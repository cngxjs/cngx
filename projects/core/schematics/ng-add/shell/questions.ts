import { type NgAddOptions, type NgAddPreset, type PromptAnswers, type PromptFlow } from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { selectedLibs } from '../steps/dependencies';
import { type AiTool, CNGX_LIBS, type CngxLib, type OnboardingAnswers, type ThemeChoice } from '../steps/model';

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

const AI_TOOLS: readonly AiTool[] = ['claude', 'cursor', 'vscode'];

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

function flag<T>(options: NgAddOptions, key: (typeof ANSWER_KEYS)[number], fallback: T): T {
  const value = givenValue(options, key);
  return value === undefined ? fallback : (value as T);
}

/**
 * Asks only what detection leaves open: the packages, the theme when Material
 * is present, the language, the lint entry when an eslint config exists and
 * the feedback providers when `@cngx/ui` is selected. A flag answers its
 * question; without a terminal the preset default does. `minimal` asks
 * nothing.
 */
export async function askOnboarding(
  facts: ProjectFacts,
  options: NgAddOptions,
  flow: PromptFlow,
): Promise<OnboardingAnswers> {
  const preset = options.preset ?? 'recommended';
  const defaults = presetDefaults(preset, facts);

  const libs = await flow.multiSelect<CngxLib>({
    key: 'libs',
    message: 'Which cngx packages do you want?',
    choices: CNGX_LIBS.map((lib) => ({ value: lib, name: `@cngx/${lib}` })),
    default: defaults.libs,
  });
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
    : flag<ThemeChoice>(options, 'theme', defaults.theme);
  const i18n = await flow.select<'en' | 'de'>({
    key: 'i18n',
    message: 'Which language should cngx speak?',
    choices: [
      { value: 'en', name: 'English only' },
      { value: 'de', name: 'German, with the English fallback' },
    ],
    default: defaults.i18n,
  });
  const runtimeSwitch =
    i18n === 'de' &&
    (await flow.confirm({
      key: 'runtimeSwitch',
      message: 'Switch between English and German at runtime?',
      default: defaults.runtimeSwitch,
    }));
  const lint =
    facts.eslintConfig === undefined
      ? flag(options, 'lint', defaults.lint)
      : await flow.confirm({
          key: 'lint',
          message: `Add the cngx lint rules to ${facts.eslintConfig.path}?`,
          default: defaults.lint,
        });
  const feedback =
    selectedLibs(libs).includes('ui') &&
    (await flow.confirm({
      key: 'feedback',
      message: 'Provide toasts, alerts and banners at the root?',
      default: defaults.feedback,
    }));

  return {
    preset,
    libs,
    theme,
    i18n,
    runtimeSwitch,
    lint,
    feedback,
    a11yPreferences: flag(options, 'a11yPreferences', defaults.a11yPreferences),
    floatingFallback: flag(options, 'floatingFallback', defaults.floatingFallback),
    aiTools: flag<readonly AiTool[]>(options, 'aiTools', defaults.aiTools),
  };
}
