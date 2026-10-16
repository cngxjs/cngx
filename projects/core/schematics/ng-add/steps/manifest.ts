import { type JsonValue } from '@angular-devkit/core';

import {
  type ChangePlan,
  CNGX_LIBS,
  type CngxLib,
  type CreateFile,
  createProvenance,
  type EditFile,
  isListOf,
  isRecord,
  type Provenance,
  skipChange,
  type StepResult,
  type WriteJson,
} from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { type OnboardingAnswers, type Versions } from './model';

export const INSTALL_MANIFEST_PATH = '.cngx/install.json';
const SCHEMA_VERSION = 2;

export interface InstalledStep {
  readonly id: string;
  /** A step is satisfied whether this run planned it or found it in place. */
  readonly outcome: 'satisfied';
  readonly provenance: Provenance;
}

/** One project's record: the inputs of its last real install, not a re-derived state. */
export interface ProjectRecord {
  readonly cngxVersion: string;
  readonly mcpVersion: string;
  readonly eslintPluginVersion: string;
  readonly angularVersion: string | null;
  readonly preset: string;
  readonly answers: Readonly<Record<string, JsonValue>>;
  readonly steps: readonly InstalledStep[];
  /** A snapshot for whoever reads the file; never compared. */
  readonly facts: Readonly<Record<string, JsonValue>>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * `.cngx/install.json`: one record per project `ng add` ran for. The
 * README, the editor configs and `package.json` are workspace-wide, the
 * records are not.
 */
export interface InstallManifest {
  readonly schemaVersion: number;
  readonly projects: Readonly<Record<string, ProjectRecord>>;
}

/**
 * A previous manifest; `undefined` when the body is not one this release
 * writes. An earlier schema is not read either: no release with schematics
 * wrote one.
 */
export function parseInstallManifest(content: string): InstallManifest | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return undefined;
  }
  if (!isRecord(parsed) || parsed['schemaVersion'] !== SCHEMA_VERSION || !isRecord(parsed['projects'])) {
    return undefined;
  }
  const records = Object.entries(parsed['projects']).map(
    ([project, value]) => [project, isRecord(value) ? toRecord(value) : undefined] as const,
  );
  if (!records.every((entry): entry is readonly [string, ProjectRecord] => entry[1] !== undefined)) {
    return undefined;
  }
  return { schemaVersion: SCHEMA_VERSION, projects: Object.fromEntries(records) };
}

function isProvenance(value: unknown): value is Provenance {
  return isRecord(value) && typeof value['source'] === 'string' && typeof value['version'] === 'string';
}

function isInstalledStep(value: unknown): value is InstalledStep {
  return (
    isRecord(value) &&
    typeof value['id'] === 'string' &&
    value['outcome'] === 'satisfied' &&
    isProvenance(value['provenance'])
  );
}

// A user may have edited the file; a record short of the full shape makes
// the whole file unreadable, so no other project's record is dropped silently.
function toRecord(parsed: Readonly<Record<string, unknown>>): ProjectRecord | undefined {
  const {
    cngxVersion,
    mcpVersion,
    eslintPluginVersion,
    angularVersion,
    preset,
    answers,
    steps,
    facts,
    createdAt,
    updatedAt,
  } = parsed;
  const strings = [cngxVersion, mcpVersion, eslintPluginVersion, preset, createdAt, updatedAt];
  if (
    !strings.every((value) => typeof value === 'string') ||
    !(typeof angularVersion === 'string' || angularVersion === null) ||
    !isRecord(answers) ||
    !isRecord(facts) ||
    !Array.isArray(steps) ||
    !steps.every(isInstalledStep)
  ) {
    return undefined;
  }
  return {
    cngxVersion: String(cngxVersion),
    mcpVersion: String(mcpVersion),
    eslintPluginVersion: String(eslintPluginVersion),
    angularVersion,
    preset: String(preset),
    // Parsed from JSON, so every value is JSON.
    answers: answers as Readonly<Record<string, JsonValue>>,
    steps,
    facts: facts as Readonly<Record<string, JsonValue>>,
    createdAt: String(createdAt),
    updatedAt: String(updatedAt),
  };
}

function canonical(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonical).join(',')}]`;
  }
  if (isRecord(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

// The installed Angular moves with every patch the package manager pulls in;
// only its `major.minor` line changes what cngx plans.
function angularLine(version: string | null): string | null {
  return version === null ? null : (/^\d+\.\d+/.exec(version)?.[0] ?? version);
}

/**
 * Whether two manifests record the same install: the same preset, answers,
 * versions and set of steps. `facts` and the timestamps are left out, so a
 * second run whose detection now reads `maturity: 'existing'` is the same
 * install, and Angular counts by its `major.minor` line, so a patch bump in
 * `node_modules` is too.
 */
export function isSameInstall(a: ProjectRecord, b: ProjectRecord): boolean {
  const key = (manifest: ProjectRecord): string =>
    canonical({
      preset: manifest.preset,
      answers: manifest.answers,
      versions: [
        manifest.cngxVersion,
        manifest.mcpVersion,
        manifest.eslintPluginVersion,
        angularLine(manifest.angularVersion),
      ],
      steps: manifest.steps.map((step) => step.id).sort(),
    });
  return key(a) === key(b);
}

// The facts minus the app's package.json: the manifest already records the
// versions it pinned, and the dependency list would only add noise.
function factsSnapshot(facts: ProjectFacts): Readonly<Record<string, JsonValue>> {
  const snapshot = Object.fromEntries(Object.entries(facts).filter(([key]) => key !== 'manifest'));
  return JSON.parse(JSON.stringify(snapshot)) as Record<string, JsonValue>;
}

/**
 * The step ids every project's record holds. The AI tooling a removal
 * withdraws is workspace-wide, so one project's record is not enough.
 */
export function recordedStepIds(manifest: InstallManifest | undefined): readonly string[] {
  const ids = Object.values(manifest?.projects ?? {}).flatMap((record) => record.steps.map((step) => step.id));
  return [...new Set(ids)];
}

/** The libs any project's record answered, in `CNGX_LIBS` order. */
export function recordedLibs(manifest: InstallManifest | undefined): readonly CngxLib[] {
  const libs = new Set(
    Object.values(manifest?.projects ?? {}).flatMap((record) => {
      const answered = record.answers['libs'];
      return isListOf(CNGX_LIBS, answered) ? answered : [];
    }),
  );
  return CNGX_LIBS.filter((lib) => libs.has(lib));
}

function nextRecord(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  plan: ChangePlan,
  previous: ProjectRecord | undefined,
  now: string,
): ProjectRecord {
  const provenance = createProvenance('ng-add', versions.cngx);
  const earlier = new Map((previous?.steps ?? []).map((step) => [step.id, step.provenance]));
  const steps: readonly InstalledStep[] = [
    ...plan.changes
      .filter((change) => change.kind !== 'note')
      .map((change) => ({ id: change.id, outcome: 'satisfied' as const, provenance: change.provenance })),
    ...plan.skipped.map((step) => ({
      id: step.id,
      outcome: 'satisfied' as const,
      provenance: earlier.get(step.id) ?? provenance,
    })),
  ];
  return {
    cngxVersion: versions.cngx,
    mcpVersion: versions.mcp,
    eslintPluginVersion: versions.eslintPlugin,
    angularVersion: facts.angularVersion ?? null,
    preset: answers.preset,
    answers: JSON.parse(JSON.stringify(answers)) as Record<string, JsonValue>,
    steps,
    facts: factsSnapshot(facts),
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
}

/**
 * The install manifest as one more projection of the plan, planned after
 * every other step: a step id the plan changed or skipped is satisfied, a
 * note is not a step. Only this project's record is written; the others
 * stay as they are. An unchanged install plans nothing, so `updatedAt`
 * moves only with a real change and a second run writes no file.
 */
export function planManifest(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  plan: ChangePlan,
  previous: ProjectRecord | undefined,
  now: string,
): StepResult {
  const record = nextRecord(facts, answers, versions, plan, previous, now);
  const change: WriteJson = {
    kind: 'write-json',
    id: 'manifest:install',
    label: `Write ${INSTALL_MANIFEST_PATH}`,
    reason: 'records this install for a re-run and ng update',
    provenance: createProvenance('ng-add', versions.cngx),
    path: INSTALL_MANIFEST_PATH,
    entries: [
      [['schemaVersion'], SCHEMA_VERSION],
      [['projects', facts.project], record as unknown as JsonValue],
    ],
  };
  if (previous !== undefined && isSameInstall(previous, record)) {
    return { changes: [], skipped: [skipChange(change, `unchanged since ${previous.updatedAt}`)] };
  }
  return { changes: [change], skipped: [] };
}

/**
 * The manifest a run starts over when `.cngx/install.json` cannot be read:
 * the file is kept under `copyPath`, then emptied, so the record
 * `planManifest` writes next is the only one in it. Both are changes of the
 * plan, so `--dry-run` lists them.
 */
export function planUnreadableManifest(
  project: string,
  content: string,
  copyPath: string,
  versions: Versions,
): StepResult {
  const provenance = createProvenance('ng-add', versions.cngx);
  const copy: CreateFile = {
    kind: 'create-file',
    id: 'manifest:unreadable',
    label: 'Start a new install record',
    reason: `${INSTALL_MANIFEST_PATH} exists but cngx cannot read it; it is kept as ${copyPath} and replaced by a record of ${project} only`,
    provenance,
    path: copyPath,
    content,
  };
  const reset: EditFile = {
    kind: 'edit-file',
    id: 'manifest:reset',
    label: `Clear ${INSTALL_MANIFEST_PATH}`,
    reason: `its content is kept in ${copyPath}`,
    provenance,
    path: INSTALL_MANIFEST_PATH,
    edit: () => '{}\n',
  };
  return { changes: [copy, reset], skipped: [] };
}

/**
 * One project's record after `ng update`: the new release versions, every
 * step a migration planned recorded with its provenance, and the earlier
 * steps as they were. Only the keys that moved are written; unchanged
 * versions and steps plan no write.
 */
export function planManifestUpdate(
  project: string,
  previous: ProjectRecord,
  versions: Versions,
  plan: ChangePlan,
  now: string,
): StepResult {
  const planned = new Map(
    plan.changes.filter((change) => change.kind !== 'note').map((change) => [change.id, change.provenance]),
  );
  const kept = previous.steps.map((step) => {
    const provenance = planned.get(step.id);
    return provenance === undefined ? step : { ...step, provenance };
  });
  const added = [...planned]
    .filter(([id]) => !previous.steps.some((step) => step.id === id))
    .map(([id, provenance]) => ({ id, outcome: 'satisfied' as const, provenance }));
  const next: ProjectRecord = {
    ...previous,
    cngxVersion: versions.cngx,
    mcpVersion: versions.mcp,
    eslintPluginVersion: versions.eslintPlugin,
    steps: [...kept, ...added],
    updatedAt: now,
  };
  const earlier = new Map(Object.entries(previous).map(([key, value]) => [key, canonical(value)]));
  const change: WriteJson = {
    kind: 'write-json',
    id: 'manifest:install',
    label: `Update ${INSTALL_MANIFEST_PATH} for ${project}`,
    reason: 'records the cngx release this app now runs',
    provenance: createProvenance('ng-update', versions.cngx),
    path: INSTALL_MANIFEST_PATH,
    // Only the keys that moved, so the rest of the file keeps its formatting.
    entries: Object.entries(next)
      .filter(([key, value]) => canonical(value) !== earlier.get(key))
      .map(([key, value]) => [['projects', project, key], value as JsonValue] as const),
  };
  if (isSameInstall(previous, next)) {
    return { changes: [], skipped: [skipChange(change, `unchanged since ${previous.updatedAt}`)] };
  }
  return { changes: [change], skipped: [] };
}
