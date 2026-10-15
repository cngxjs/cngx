import {
  AI_TOOLS,
  type Change,
  CNGX_LIBS,
  isBoolean,
  isListOf,
  isOneOf,
  LANGUAGES,
  mergeStepResults,
  NG_ADD_PRESETS,
  type NgAddPreset,
  type Provenance,
  type StepResult,
  THEME_CHOICES,
} from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { withdrawnAiTargets } from './ai-tools';
import { planHelperReadme } from './helper-readme';
import { INSTALL_MANIFEST_PATH, type InstallManifest } from './manifest';
import { type OnboardingAnswers, type Versions } from './model';
import { planTheme } from './theme';

/** What a preset answers before any flag or question; the shell passes `presetDefaults`. */
export type PresetDefaults = (preset: NgAddPreset) => OnboardingAnswers;

// A missing answer reads as the preset default, so a manifest written before
// a release added a question still re-runs; a recorded answer outside the
// vocabulary (or of the wrong type) rejects the whole record.
function answerOr<T>(value: unknown, valid: (value: unknown) => value is T, fallback: T): T | undefined {
  if (value === undefined) {
    return fallback;
  }
  return valid(value) ? value : undefined;
}

/**
 * The answers the last install recorded, read back against today's answer
 * vocabulary. The preset is required; every other missing answer is the
 * preset's default. `undefined` when the preset is missing or a recorded
 * answer is no longer valid.
 */
export function readRecordedAnswers(manifest: InstallManifest, defaultsFor: PresetDefaults): OnboardingAnswers | undefined {
  const recorded = manifest.answers;
  const preset = recorded['preset'];
  if (!isOneOf(NG_ADD_PRESETS, preset)) {
    return undefined;
  }
  const defaults = defaultsFor(preset);
  const answers = {
    preset,
    libs: answerOr(recorded['libs'], (value) => isListOf(CNGX_LIBS, value), defaults.libs),
    theme: answerOr(recorded['theme'], (value) => isOneOf(THEME_CHOICES, value), defaults.theme),
    i18n: answerOr(recorded['i18n'], (value) => isOneOf(LANGUAGES, value), defaults.i18n),
    runtimeSwitch: answerOr(recorded['runtimeSwitch'], isBoolean, defaults.runtimeSwitch),
    lint: answerOr(recorded['lint'], isBoolean, defaults.lint),
    a11yPreferences: answerOr(recorded['a11yPreferences'], isBoolean, defaults.a11yPreferences),
    feedback: answerOr(recorded['feedback'], isBoolean, defaults.feedback),
    floatingFallback: answerOr(recorded['floatingFallback'], isBoolean, defaults.floatingFallback),
    aiTools: answerOr(recorded['aiTools'], (value) => isListOf(AI_TOOLS, value), defaults.aiTools),
  };
  const { libs, theme, i18n, runtimeSwitch, lint, a11yPreferences, feedback, floatingFallback, aiTools } = answers;
  if (
    libs === undefined ||
    theme === undefined ||
    i18n === undefined ||
    runtimeSwitch === undefined ||
    lint === undefined ||
    a11yPreferences === undefined ||
    feedback === undefined ||
    floatingFallback === undefined ||
    aiTools === undefined
  ) {
    return undefined;
  }
  return { preset, libs, theme, i18n, runtimeSwitch, lint, a11yPreferences, feedback, floatingFallback, aiTools };
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
  defaultsFor: PresetDefaults,
): StepResult {
  const provenance: Provenance = { source: 'ng-update', version: versions.cngx };
  const answers = readRecordedAnswers(manifest, defaultsFor);
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
  // ng update asks for no editor, so every removal the user made since the
  // install holds, the same way a later `ng add` respects it.
  const withdrawn = withdrawnAiTargets(facts, answers, [...recorded], []);
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
          planHelperReadme(facts, answers, versions, withdrawn),
          (change) => change.kind === 'create-file',
          recorded,
          provenance,
        );
  return mergeStepResults([theme, readme]);
}
