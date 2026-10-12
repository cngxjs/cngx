import { type JsonValue } from '@angular-devkit/core';

import {
  AI_TOOLS,
  type Change,
  type ChangePlan,
  CNGX_LIBS,
  isRecord,
  LANGUAGES,
  NG_ADD_PRESETS,
  type Provenance,
  type StepResult,
  THEME_CHOICES,
  type Tree,
  type WriteJson,
} from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { planHelperReadme } from './helper-readme';
import { type OnboardingAnswers, type Versions } from './model';
import { planTheme } from './theme';

export const INSTALL_MANIFEST_PATH = '.cngx/install.json';
const SCHEMA_VERSION = 1;

export interface InstalledStep {
  readonly id: string;
  /** A step is satisfied whether this run planned it or found it in place. */
  readonly outcome: 'satisfied';
  readonly provenance: Provenance;
}

/** `.cngx/install.json`: the inputs of the last real install, not a re-derived state. */
export interface InstallManifest {
  readonly schemaVersion: number;
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


/** A previous manifest; `undefined` when the body is not one cngx wrote. */
export function parseInstallManifest(content: string): InstallManifest | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return undefined;
  }
  return isRecord(parsed) ? toManifest(parsed) : undefined;
}

/** The install manifest a previous `ng add` left in the tree, if cngx wrote one. */
export function readManifest(tree: Tree): InstallManifest | undefined {
  return tree.exists(INSTALL_MANIFEST_PATH) ? parseInstallManifest(tree.readText(INSTALL_MANIFEST_PATH)) : undefined;
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

// A user may have edited the file; anything short of the full shape reads
// as no previous install, and the run writes a fresh one.
function toManifest(parsed: Readonly<Record<string, unknown>>): InstallManifest | undefined {
  const {
    schemaVersion,
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
    schemaVersion !== SCHEMA_VERSION ||
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
    schemaVersion,
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

/**
 * Whether two manifests record the same install: the same preset, answers,
 * versions and set of steps. `facts` and the timestamps are left out, so a
 * second run whose detection now reads `maturity: 'existing'` is the same
 * install.
 */
export function isSameInstall(a: InstallManifest, b: InstallManifest): boolean {
  const key = (manifest: InstallManifest): string =>
    canonical({
      preset: manifest.preset,
      answers: manifest.answers,
      versions: [manifest.cngxVersion, manifest.mcpVersion, manifest.eslintPluginVersion, manifest.angularVersion],
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
 * The install manifest as one more projection of the plan, planned after
 * every other step: a step id the plan changed or skipped is satisfied, a
 * note is not a step. An unchanged install plans nothing, so `updatedAt`
 * moves only with a real change and a second run writes no file.
 */
export function planManifest(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  plan: ChangePlan,
  previous: InstallManifest | undefined,
  now: string,
): StepResult {
  const provenance: Provenance = { source: 'ng-add', version: versions.cngx };
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
  const next: InstallManifest = {
    schemaVersion: SCHEMA_VERSION,
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
  const change: WriteJson = {
    kind: 'write-json',
    id: 'manifest:install',
    label: `Write ${INSTALL_MANIFEST_PATH}`,
    reason: 'records this install for a re-run and ng update',
    provenance,
    path: INSTALL_MANIFEST_PATH,
    entries: Object.entries(next).map(([key, value]) => [[key], value as JsonValue] as const),
  };
  if (previous !== undefined && isSameInstall(previous, next)) {
    return {
      changes: [],
      skipped: [{ id: change.id, label: change.label, reason: `unchanged since ${previous.updatedAt}` }],
    };
  }
  return { changes: [change], skipped: [] };
}

function oneOf<T extends string>(vocabulary: readonly T[], value: unknown): value is T {
  return vocabulary.some((entry) => entry === value);
}

function listOf<T extends string>(vocabulary: readonly T[], value: unknown): value is readonly T[] {
  return Array.isArray(value) && value.every((entry) => oneOf(vocabulary, entry));
}

/**
 * The answers the last install recorded, read back against today's answer
 * vocabulary; `undefined` when one is missing or no longer a valid answer.
 */
export function recordedAnswers(manifest: InstallManifest): OnboardingAnswers | undefined {
  const { preset, libs, theme, i18n, runtimeSwitch, lint, a11yPreferences, feedback, floatingFallback, aiTools } =
    manifest.answers;
  const flags = [runtimeSwitch, lint, a11yPreferences, feedback, floatingFallback];
  if (
    !oneOf(NG_ADD_PRESETS, preset) ||
    !listOf(CNGX_LIBS, libs) ||
    !oneOf(THEME_CHOICES, theme) ||
    !oneOf(LANGUAGES, i18n) ||
    !listOf(AI_TOOLS, aiTools) ||
    !flags.every((flag) => typeof flag === 'boolean')
  ) {
    return undefined;
  }
  return {
    preset,
    libs,
    theme,
    i18n,
    runtimeSwitch: runtimeSwitch === true,
    lint: lint === true,
    a11yPreferences: a11yPreferences === true,
    feedback: feedback === true,
    floatingFallback: floatingFallback === true,
    aiTools,
  };
}

const NO_CHANGES: StepResult = { changes: [], skipped: [] };

// ng update never writes back a step that is gone: it may be one the user
// removed on purpose, so the run names it and leaves it. `restores` picks
// the changes that would bring a step back; the rest pass through.
function restoreNotes(
  result: StepResult,
  restores: (change: Change) => boolean,
  recorded: ReadonlySet<string>,
  provenance: Provenance,
): StepResult {
  const notes: readonly Change[] = result.changes
    .filter((change) => restores(change) && recorded.has(change.id))
    .map((change) => ({
      kind: 'note',
      id: change.id,
      label: `${change.label} (not in place)`,
      reason: `recorded in ${INSTALL_MANIFEST_PATH}; run ng add @cngx/core to restore it`,
      provenance,
    }));
  return { changes: [...result.changes.filter((change) => !restores(change)), ...notes], skipped: result.skipped };
}

/**
 * The steps `ng update` re-runs from the recorded answers. The theme steps
 * are checked once the cngx version moved and only reported; the helper
 * README, which pins the MCP version, is regenerated once that version
 * moved. Neither brings back a file that is gone, and a README cngx did not
 * write stays as it is.
 */
export function planManifestReruns(facts: ProjectFacts, manifest: InstallManifest, versions: Versions): StepResult {
  const provenance: Provenance = { source: 'ng-update', version: versions.cngx };
  const answers = recordedAnswers(manifest);
  if (answers === undefined) {
    return {
      changes: [
        {
          kind: 'note',
          id: 'manifest:answers',
          label: 'Re-run the recorded install steps',
          reason: `${INSTALL_MANIFEST_PATH} records answers this release cannot read; run ng add @cngx/core to refresh it`,
          provenance,
        },
      ],
      skipped: [],
    };
  }
  const recorded = new Set(manifest.steps.map((step) => step.id));
  const theme =
    manifest.cngxVersion === versions.cngx
      ? NO_CHANGES
      : restoreNotes(planTheme(facts, answers, versions), (change) => change.kind !== 'note', recorded, provenance);
  const readme =
    manifest.mcpVersion === versions.mcp
      ? NO_CHANGES
      : restoreNotes(
          planHelperReadme(facts, answers, versions),
          (change) => change.kind === 'create-file',
          recorded,
          provenance,
        );
  return {
    changes: [...theme.changes, ...readme.changes],
    skipped: [...theme.skipped, ...readme.skipped],
  };
}

/**
 * The manifest after `ng update`: the new release versions, every step a
 * migration planned recorded with its provenance, and the earlier steps as
 * they were. Only the keys that moved are written; unchanged versions and
 * steps plan no write.
 */
export function updateManifest(
  previous: InstallManifest,
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
  const next: InstallManifest = {
    ...previous,
    cngxVersion: versions.cngx,
    mcpVersion: versions.mcp,
    eslintPluginVersion: versions.eslintPlugin,
    steps: [...kept, ...added],
    updatedAt: now,
  };
  const change: WriteJson = {
    kind: 'write-json',
    id: 'manifest:install',
    label: `Update ${INSTALL_MANIFEST_PATH}`,
    reason: 'records the cngx release this app now runs',
    provenance: { source: 'ng-update', version: versions.cngx },
    path: INSTALL_MANIFEST_PATH,
    // Only the keys that moved, so the rest of the file keeps its formatting.
    entries: Object.entries(next)
      .filter(([key, value]) => canonical(value) !== canonical(previous[key as keyof InstallManifest]))
      .map(([key, value]) => [[key], value as JsonValue] as const),
  };
  if (isSameInstall(previous, next)) {
    return {
      changes: [],
      skipped: [{ id: change.id, label: change.label, reason: `unchanged since ${previous.updatedAt}` }],
    };
  }
  return { changes: [change], skipped: [] };
}
