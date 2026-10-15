import {
  AI_TOOLS,
  type AiTool,
  CNGX_LIBS,
  type CngxLib,
  createNote,
  invalidAnswer,
  isBoolean,
  isOneOf,
  type Language,
  LANGUAGES,
  type NgAddOptions,
  type NgAddPreset,
  type PromptAnswers,
  type PromptFlow,
  type Provenance,
  type StepResult,
  THEME_CHOICES,
  type ThemeChoice,
} from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { EDITOR_NAMES, removedMcpServer } from '../steps/ai-tools';
import { selectedLibs } from '../steps/dependencies';
import { type OnboardingAnswers } from '../steps/model';

const ANSWER_KEYS = [
  'libs',
  'theme',
  'i18n',
  'runtimeSwitch',
  'lint',
  'a11yPreferences',
  'feedback',
  'floatingFallback',
  'aiTools',
] as const;

const BOOLEAN_ANSWERS = ['true', 'false'];

/** The answers a preset gives before any flag or question. */
export function presetDefaults(preset: NgAddPreset, facts: ProjectFacts): OnboardingAnswers {
  const recommended: OnboardingAnswers = {
    preset,
    libs: [...CNGX_LIBS],
    theme: facts.material.present ? 'material' : 'cngx',
    i18n: 'en',
    runtimeSwitch: false,
    // Without a flat config the lint step says so instead of editing.
    lint: true,
    a11yPreferences: true,
    feedback: false,
    floatingFallback: false,
    aiTools: [],
  };
  if (preset === 'minimal') {
    return { ...recommended, theme: 'none', lint: false, a11yPreferences: false };
  }
  if (preset === 'full') {
    return {
      ...recommended,
      i18n: 'de',
      feedback: true,
      floatingFallback: true,
      aiTools: AI_TOOLS.filter((tool) => facts.editors[tool]),
    };
  }
  return recommended;
}

// The devkit schema registry fills every unset array option with `[]`
// (`addUndefinedDefaults`), so an empty list means "not given", never "none".
function givenValue(options: NgAddOptions, key: (typeof ANSWER_KEYS)[number]): NgAddOptions[typeof key] {
  const value = options[key];
  return Array.isArray(value) && value.length === 0 ? undefined : value;
}

/** The answer flags given on the command line, keyed like the questions. */
export function givenAnswers(options: NgAddOptions): PromptAnswers {
  return Object.fromEntries(
    ANSWER_KEYS.flatMap((key) => {
      const value = givenValue(options, key);
      return value === undefined ? [] : [[key, value]];
    }),
  );
}

// A flag the schema let through must still be one this step understands;
// `ng add` validates against schema.json, a programmatic caller may not.
function flag<T>(
  options: NgAddOptions,
  key: (typeof ANSWER_KEYS)[number],
  isValid: (value: unknown) => value is T,
  allowed: readonly string[],
  fallback: T,
): T {
  const value = givenValue(options, key);
  if (value === undefined) {
    return fallback;
  }
  if (!isValid(value)) {
    throw invalidAnswer(key, [String(value)], allowed);
  }
  return value;
}

/** The answers of one run and the editors the user asked for by name. */
export interface Onboarding {
  readonly answers: OnboardingAnswers;
  /**
   * The `--ai-tools` flag, else the editors picked in the question; empty
   * when the preset default answered. Only these override a removal the
   * last install recorded (`withdrawnAiTargets`).
   */
  readonly explicitAiTools: readonly AiTool[];
}

/**
 * The note a re-run plans when it starts from another preset than the one
 * the last install recorded, so the reset to that preset's defaults is said,
 * not silent. Empty on a first install or with the recorded preset.
 */
export function presetChangeNote(
  options: NgAddOptions,
  recorded: OnboardingAnswers | undefined,
  provenance: Provenance,
): StepResult {
  const preset = options.preset ?? 'recommended';
  if (recorded === undefined || recorded.preset === preset) {
    return { changes: [], skipped: [] };
  }
  return {
    changes: [
      createNote({
        id: 'answers:preset',
        label: `Start from the ${preset} preset`,
        reason: `the last install used ${recorded.preset}, so its answers are not reused; pass --preset=${recorded.preset} to keep them`,
        provenance,
      }),
    ],
    skipped: [],
  };
}

/**
 * Asks only what detection leaves open: the packages, the theme when Material
 * is present, the language, the lint entry when an eslint config exists, the
 * feedback providers when `@cngx/ui` is selected and the editors that get the
 * cngx MCP server, with the detected ones preselected unless the user removed
 * the server the last install wired (`installed` holds its step ids). A flag
 * answers its question; without a terminal the default does. The defaults
 * are the `recorded` answers of the last install when this run keeps its
 * preset, else the preset's. `minimal` asks nothing.
 */
export async function askOnboarding(
  facts: ProjectFacts,
  options: NgAddOptions,
  flow: PromptFlow,
  installed: readonly string[],
  recorded?: OnboardingAnswers,
): Promise<Onboarding> {
  const preset = options.preset ?? 'recommended';
  // A re-run with the recorded preset starts from the recorded answers, so a
  // run without flags or a terminal keeps every earlier choice.
  const rerun = recorded?.preset === preset ? recorded : undefined;
  const defaults = rerun ?? presetDefaults(preset, facts);

  const libs = await flow.multiSelect<CngxLib>({
    key: 'libs',
    message: 'Which cngx packages do you want?',
    choices: CNGX_LIBS.map((lib) => ({ value: lib, name: `@cngx/${lib}` })),
    default: defaults.libs,
  });
  const selected = selectedLibs(libs);
  const hasCore = selected.includes('core');
  const theme = facts.material.present
    ? await flow.select<ThemeChoice>({
        key: 'theme',
        message: 'Angular Material is installed. Which theme should cngx follow?',
        choices: [
          { value: 'material', name: 'The Material theme, through the cngx bridge' },
          { value: 'cngx', name: 'The cngx default theme' },
          { value: 'none', name: 'No theme file' },
        ],
        default: defaults.theme,
      })
    : flag(options, 'theme', (value) => isOneOf(THEME_CHOICES, value), THEME_CHOICES, defaults.theme);
  // The language pack and the a11y preferences come from @cngx/core; without
  // it there is nothing to ask, and a preset default must not turn into a
  // "skipped" note the user never asked for.
  const i18n = hasCore
    ? await flow.select<Language>({
        key: 'i18n',
        message: 'Which language should cngx speak?',
        choices: [
          { value: 'en', name: 'English only' },
          { value: 'de', name: 'German, with the English fallback' },
        ],
        default: defaults.i18n,
      })
    : flag(options, 'i18n', (value) => isOneOf(LANGUAGES, value), LANGUAGES, 'en');
  // A flag the question cannot ask about is kept, so the step can say why it
  // does not apply instead of dropping it.
  const runtimeSwitch =
    i18n === 'de'
      ? await flow.confirm({
          key: 'runtimeSwitch',
          message: 'Switch between English and German at runtime?',
          default: defaults.runtimeSwitch,
        })
      : flag(options, 'runtimeSwitch', isBoolean, BOOLEAN_ANSWERS, false);
  const lint =
    facts.eslintConfig === undefined
      ? flag(options, 'lint', isBoolean, BOOLEAN_ANSWERS, defaults.lint)
      : await flow.confirm({
          key: 'lint',
          message: `Add the cngx lint rules to ${facts.eslintConfig.path}?`,
          default: defaults.lint,
        });
  const feedback = selected.includes('ui')
    ? await flow.confirm({
        key: 'feedback',
        message: 'Provide toasts, alerts and banners at the root?',
        default: defaults.feedback,
      })
    : flag(options, 'feedback', isBoolean, BOOLEAN_ANSWERS, false);
  const aiTools = await flow.multiSelect<AiTool>({
    key: 'aiTools',
    message: 'Which editors should get the cngx MCP server?',
    choices: AI_TOOLS.map((tool) => ({
      value: tool,
      name: EDITOR_NAMES[tool],
      checked:
        (rerun === undefined ? facts.editors[tool] : rerun.aiTools.includes(tool)) &&
        !removedMcpServer(facts, installed, tool),
    })),
    default: defaults.aiTools,
  });
  const answeredByName = givenValue(options, 'aiTools') !== undefined || flow.interactive;

  return {
    answers: {
      preset,
      libs,
      theme,
      i18n,
      runtimeSwitch,
      lint,
      feedback,
      a11yPreferences: flag(
        options,
        'a11yPreferences',
        isBoolean,
        BOOLEAN_ANSWERS,
        defaults.a11yPreferences && hasCore,
      ),
      floatingFallback: flag(
        options,
        'floatingFallback',
        isBoolean,
        BOOLEAN_ANSWERS,
        defaults.floatingFallback && selected.includes('common'),
      ),
      aiTools,
    },
    explicitAiTools: answeredByName ? aiTools : [],
  };
}
