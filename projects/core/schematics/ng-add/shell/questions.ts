import {
  AI_TOOLS,
  type AiTool,
  CNGX_LIBS,
  type CngxLib,
  createNote,
  declaredRange,
  type Language,
  type NgAddOptions,
  type NgAddPreset,
  type PromptAnswers,
  type PromptFlow,
  type Provenance,
  type StepResult,
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

/** The answer flags given on the command line, keyed like the questions. */
export function givenAnswers(options: NgAddOptions): PromptAnswers {
  return Object.fromEntries(
    ANSWER_KEYS.flatMap((key) => {
      const value = options[key];
      return value === undefined ? [] : [[key, value]];
    }),
  );
}

// The answer of a flag no question asks about; `parseNgAddOptions` already
// validated it.
function flag<K extends (typeof ANSWER_KEYS)[number]>(
  options: NgAddOptions,
  key: K,
  fallback: NonNullable<NgAddOptions[K]>,
): NonNullable<NgAddOptions[K]> {
  return options[key] ?? fallback;
}

/**
 * The libs of a run: the answered ones plus the floor a run never drops, the
 * libs the last install recorded and every `@cngx/<lib>` the app declares
 * (which includes the package a shim pinned before it delegated). A declared
 * lib that is only a peer of the others is installed through them and not
 * recorded, so the pins cngx itself wrote do not grow the record.
 * `@cngx/themes`, `@cngx/mcp` and `@cngx/eslint-plugin` are no lib; the theme
 * answer and the tooling steps own them.
 */
export function withLibsFloor(
  answered: readonly CngxLib[],
  facts: ProjectFacts,
  recorded: OnboardingAnswers | undefined,
): readonly CngxLib[] {
  const asked = new Set<CngxLib>([...answered, ...(recorded?.libs ?? [])]);
  const declared = CNGX_LIBS.filter(
    (lib) => !asked.has(lib) && declaredRange(facts.manifest, `@cngx/${lib}`) !== undefined,
  );
  const kept = CNGX_LIBS.filter((lib) => asked.has(lib) || declared.includes(lib));
  // Peers are transitive in LIB_PEERS, so one pass against every other kept
  // lib drops a declared peer of a lib that is itself only declared.
  return kept.filter(
    (lib) => asked.has(lib) || !selectedLibs(kept.filter((other) => other !== lib)).includes(lib),
  );
}

/** The answers of one run and the editors the user asked for by name. */
export interface Onboarding {
  readonly answers: OnboardingAnswers;
  /** The libs the flag, the question or the defaults gave, before the floor. */
  readonly answeredLibs: readonly CngxLib[];
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
 * The note a run plans when the floor keeps libs the answer left out, so a
 * narrower `--libs` is said to add nothing instead of silently not removing.
 * Empty when the answer already holds every kept lib.
 */
export function libsFloorNote(
  answered: readonly CngxLib[],
  kept: readonly CngxLib[],
  project: string,
  provenance: Provenance,
): StepResult {
  const implied = selectedLibs(answered);
  const added = kept.filter((lib) => !implied.includes(lib)).map((lib) => `@cngx/${lib}`);
  if (added.length === 0) {
    return { changes: [], skipped: [] };
  }
  const [stay, them, it] = added.length === 1 ? ['stays', 'it', 'it'] : ['stay', 'them', 'one'];
  return {
    changes: [
      createNote({
        id: 'answers:libs',
        label: 'Keep the recorded packages',
        reason: `${added.join(', ')} ${stay} because the last install recorded ${them} or package.json declares ${them}; to remove ${it}, delete it from package.json and from projects.${project}.answers.libs in .cngx/install.json`,
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
 * preset, else the preset's. `minimal` asks nothing. The libs never fall
 * below the floor of `withLibsFloor`.
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

  const answeredLibs = await flow.multiSelect<CngxLib>({
    key: 'libs',
    message: 'Which cngx packages do you want?',
    choices: CNGX_LIBS.map((lib) => ({ value: lib, name: `@cngx/${lib}` })),
    default: defaults.libs,
  });
  const libs = withLibsFloor(answeredLibs, facts, recorded);
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
    : flag(options, 'theme', defaults.theme);
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
    : flag(options, 'i18n', 'en');
  // A flag the question cannot ask about is kept, so the step can say why it
  // does not apply instead of dropping it.
  const runtimeSwitch =
    i18n === 'de'
      ? await flow.confirm({
          key: 'runtimeSwitch',
          message: 'Switch between English and German at runtime?',
          default: defaults.runtimeSwitch,
        })
      : flag(options, 'runtimeSwitch', false);
  const lint =
    facts.eslintConfig === undefined
      ? flag(options, 'lint', defaults.lint)
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
    : flag(options, 'feedback', false);
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
  const answeredByName = options.aiTools !== undefined || flow.interactive;

  return {
    answers: {
      preset,
      libs,
      theme,
      i18n,
      runtimeSwitch,
      lint,
      feedback,
      a11yPreferences: flag(options, 'a11yPreferences', defaults.a11yPreferences && hasCore),
      floatingFallback: flag(options, 'floatingFallback', defaults.floatingFallback && selected.includes('common')),
      aiTools,
    },
    answeredLibs,
    explicitAiTools: answeredByName ? aiTools : [],
  };
}
