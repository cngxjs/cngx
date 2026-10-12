import {
  AI_TOOLS,
  type Change,
  CNGX_LIBS,
  LANGUAGES,
  NG_ADD_PRESETS,
  type Provenance,
  type StepResult,
  THEME_CHOICES,
} from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { planHelperReadme } from './helper-readme';
import { INSTALL_MANIFEST_PATH, type InstallManifest } from './manifest';
import { type OnboardingAnswers, type Versions } from './model';
import { planTheme } from './theme';

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
export function readRecordedAnswers(manifest: InstallManifest): OnboardingAnswers | undefined {
  const {
    preset,
    libs,
    theme,
    i18n,
    runtimeSwitch,
    lint,
    a11yPreferences,
    feedback,
    floatingFallback,
    aiTools,
  } = manifest.answers;
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

// ng update never writes back a step that is not in place: it may be one
// the user removed on purpose, so the run names it and leaves it. A step the
// manifest recorded is gone; one it did not record was never installed,
// though the recorded answers ask for it. `restores` picks the changes that
// would bring a step in; the rest pass through.
function restoreNotes(
  result: StepResult,
  restores: (change: Change) => boolean,
  recorded: ReadonlySet<string>,
  provenance: Provenance,
): StepResult {
  const notes: readonly Change[] = result.changes.filter(restores).map((change) => ({
    kind: 'note',
    id: change.id,
    label: `${change.label} (not in place)`,
    reason: recorded.has(change.id)
      ? `recorded in ${INSTALL_MANIFEST_PATH}; run ng add @cngx/core to restore it`
      : 'the recorded answers ask for it but it was never installed; run ng add @cngx/core to add it',
    provenance,
  }));
  return {
    changes: [...result.changes.filter((change) => !restores(change)), ...notes],
    skipped: result.skipped,
  };
}

/**
 * The steps `ng update` re-runs from the recorded answers. The theme steps
 * are checked once the cngx version moved and only reported; the helper
 * README, which pins the MCP version, is regenerated once that version
 * moved. Neither brings back a file that is gone, and a README cngx did not
 * write stays as it is.
 */
export function planManifestReruns(
  facts: ProjectFacts,
  manifest: InstallManifest,
  versions: Versions,
): StepResult {
  const provenance: Provenance = { source: 'ng-update', version: versions.cngx };
  const answers = readRecordedAnswers(manifest);
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
      : restoreNotes(
          planTheme(facts, answers, versions),
          (change) => change.kind !== 'note',
          recorded,
          provenance,
        );
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
