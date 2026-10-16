/**
 * The ng-add answer vocabulary, shared by `NgAddOptions`, the typed answers
 * the steps read and the shim delegation. `ng-add/schema.json` repeats these
 * lists as enums; `ng-add/index.spec.ts` keeps the two in step.
 */
export const NG_ADD_PRESETS = ['minimal', 'recommended', 'full'] as const;
export type NgAddPreset = (typeof NG_ADD_PRESETS)[number];

/** Every package `ng add` can select; `@cngx/themes` follows the theme answer. */
export const CNGX_LIBS = ['utils', 'core', 'common', 'interop', 'forms', 'data-display', 'ui'] as const;
export type CngxLib = (typeof CNGX_LIBS)[number];

export const THEME_CHOICES = ['cngx', 'material', 'none'] as const;
export type ThemeChoice = (typeof THEME_CHOICES)[number];

export const LANGUAGES = ['en', 'de'] as const;
export type Language = (typeof LANGUAGES)[number];

export const AI_TOOLS = ['claude', 'cursor', 'vscode'] as const;
export type AiTool = (typeof AI_TOOLS)[number];

/** `value` is one entry of `vocabulary`; an answer read from a flag or a record is `unknown`. */
export function isOneOf<T extends string>(vocabulary: readonly T[], value: unknown): value is T {
  return vocabulary.some((entry) => entry === value);
}

/** `value` is an array whose every entry is one of `vocabulary`. */
export function isListOf<T extends string>(
  vocabulary: readonly T[],
  value: unknown,
): value is readonly T[] {
  return Array.isArray(value) && value.every((entry) => isOneOf(vocabulary, entry));
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

// The messages name the flag the way the user typed it (`--ai-tools`), not
// the schema key (`aiTools`).
function flagName(key: string): string {
  return `--${key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}`;
}

/** The message for a list flag that names an entry more than once. */
export function createRepeatedAnswerError(key: string, entries: readonly string[]): Error {
  const verb = entries.length === 1 ? 'is' : 'are';
  return new Error(`"${entries.join('", "')}" ${verb} given more than once for ${flagName(key)}.`);
}

/** The message for a comma list with an empty slot (`core,,ui`, `core,`, `--libs=`). */
export function createEmptyEntryError(key: string, allowed: readonly string[]): Error {
  const flag = flagName(key);
  return new Error(
    `${flag} has an empty entry. Separate the values with single commas, for example ${flag} ${allowed.slice(0, 2).join(',')}.`,
  );
}

/** The one message for a flag or prompt answer outside its vocabulary. */
export function createInvalidAnswerError(key: string, entries: readonly string[], allowed: readonly string[]): Error {
  return new Error(
    `"${entries.join('", "')}" is not a valid answer for ${flagName(key)}. Expected one of: ${allowed.join(', ')}.`,
  );
}

/** The options every `ng add @cngx/<lib>` forwards to the core onboarding. */
export interface NgAddOptions {
  readonly project?: string;
  readonly preset?: NgAddPreset;
  /** Each answer below is asked when a terminal is attached and left unset. */
  readonly libs?: readonly CngxLib[];
  readonly theme?: ThemeChoice;
  readonly i18n?: Language;
  readonly runtimeSwitch?: boolean;
  readonly lint?: boolean;
  readonly a11yPreferences?: boolean;
  readonly feedback?: boolean;
  readonly floatingFallback?: boolean;
  readonly aiTools?: readonly AiTool[];
  /** Skip the confirmation an existing app gets before apply. */
  readonly yes?: boolean;
  /** `false` answers every question from flags and preset defaults. */
  readonly prompts?: boolean;
  /** Print only the summary. */
  readonly quiet?: boolean;
}

/** A boolean flag as `ng add` passes it before the install (`--lint=false`) or after. */
type BooleanFlag = boolean | 'true' | 'false';

/**
 * The options as the CLI hands them over, the input shape of `schema.json`.
 * `ng add` parses its flags before the package is installed, without the
 * schema's types: a list arrives as one string (`--ai-tools claude,vscode`)
 * and `--lint=false` as the string `"false"`. Only an installed package sees
 * typed values. `parseNgAddOptions` turns either form into `NgAddOptions`.
 */
export interface NgAddFlags {
  readonly project?: string;
  readonly preset?: string;
  readonly libs?: string | readonly string[];
  readonly theme?: string;
  readonly i18n?: string;
  readonly runtimeSwitch?: BooleanFlag;
  readonly lint?: BooleanFlag;
  readonly a11yPreferences?: BooleanFlag;
  readonly feedback?: BooleanFlag;
  readonly floatingFallback?: BooleanFlag;
  readonly aiTools?: string | readonly string[];
  readonly yes?: BooleanFlag;
  readonly prompts?: BooleanFlag;
  readonly quiet?: BooleanFlag;
}

const BOOLEAN_FLAG_VALUES = ['true', 'false'] as const;

// A comma list is split here: as a string, a list skips the schema's enum
// and `uniqueItems`, so every entry is checked and a repeat is rejected.
function parseList<T extends string>(
  key: string,
  vocabulary: readonly T[],
  raw: string | readonly string[] | undefined,
): readonly T[] | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const entries = typeof raw === 'string' ? raw.split(',').map((entry) => entry.trim()) : raw;
  if (entries.length === 0) {
    return undefined;
  }
  if (entries.includes('')) {
    throw createEmptyEntryError(key, vocabulary);
  }
  if (!isListOf(vocabulary, entries)) {
    throw createInvalidAnswerError(key, entries.filter((entry) => !isOneOf(vocabulary, entry)), vocabulary);
  }
  const repeated = entries.filter((entry, index) => entries.indexOf(entry) !== index);
  if (repeated.length > 0) {
    throw createRepeatedAnswerError(key, [...new Set(repeated)]);
  }
  return entries;
}

function parseChoice<T extends string>(key: string, vocabulary: readonly T[], raw: string | undefined): T | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!isOneOf(vocabulary, raw)) {
    throw createInvalidAnswerError(key, [raw], vocabulary);
  }
  return raw;
}

function parseBoolean(key: string, raw: boolean | string | undefined): boolean | undefined {
  if (raw === undefined || isBoolean(raw)) {
    return raw;
  }
  if (!isOneOf(BOOLEAN_FLAG_VALUES, raw)) {
    throw createInvalidAnswerError(key, [raw], BOOLEAN_FLAG_VALUES);
  }
  return raw === 'true';
}

// `--interactive=false` and `--defaults` both stop the CLI's own prompts;
// the value forms yargs accepts for a boolean option, attached or as the next
// argument.
const PROMPTS_OFF: Readonly<Record<string, string>> = {
  '--interactive': 'false',
  '--defaults': 'true',
};

/**
 * The CLI flag that turns prompts off, the way it was typed (a separate
 * value reads as `--flag=value`); `undefined` when none does. `ng add`
 * drops `--interactive` and `--defaults` before the rule runs and never
 * passes them to the schematic context, so `argv` is the only place left to
 * read them.
 */
export function readPromptFlags(argv: readonly string[]): string | undefined {
  for (const [index, arg] of argv.entries()) {
    if (arg === '--no-interactive') {
      return arg;
    }
    const [name, attached] = arg.split('=', 2);
    const off = PROMPTS_OFF[name];
    if (off === undefined) {
      continue;
    }
    const next = argv[index + 1];
    const value = attached ?? (next === 'true' || next === 'false' ? next : undefined);
    if (value === off) {
      return `${name}=${value}`;
    }
    if (name === '--defaults' && value === undefined) {
      return arg;
    }
  }
  return undefined;
}

/**
 * Whether the CLI runs the schematic as `--dry-run` (or `-d`). The CLI
 * drops the writes itself and passes no flag to the rule, so `argv` is the
 * only place to read it, the same as for `readPromptFlags`.
 */
export function readDryRunFlag(argv: readonly string[]): boolean {
  for (const [index, arg] of argv.entries()) {
    if (arg === '-d') {
      return true;
    }
    const [name, attached] = arg.split('=', 2);
    if (name !== '--dry-run') {
      continue;
    }
    const next = argv[index + 1];
    const value = attached ?? (next === 'true' || next === 'false' ? next : 'true');
    return value === 'true';
  }
  return false;
}

/**
 * The typed answers of `raw`, validated once at the ng-add entry. A list
 * given as `undefined` or `[]` reads as not given; a programmatic caller
 * skips the schema, so every answer is checked against its vocabulary.
 */
export function parseNgAddOptions(raw: NgAddFlags): NgAddOptions {
  return {
    project: raw.project,
    preset: parseChoice('preset', NG_ADD_PRESETS, raw.preset),
    libs: parseList('libs', CNGX_LIBS, raw.libs),
    theme: parseChoice('theme', THEME_CHOICES, raw.theme),
    i18n: parseChoice('i18n', LANGUAGES, raw.i18n),
    runtimeSwitch: parseBoolean('runtimeSwitch', raw.runtimeSwitch),
    lint: parseBoolean('lint', raw.lint),
    a11yPreferences: parseBoolean('a11yPreferences', raw.a11yPreferences),
    feedback: parseBoolean('feedback', raw.feedback),
    floatingFallback: parseBoolean('floatingFallback', raw.floatingFallback),
    aiTools: parseList('aiTools', AI_TOOLS, raw.aiTools),
    yes: parseBoolean('yes', raw.yes),
    prompts: parseBoolean('prompts', raw.prompts),
    quiet: parseBoolean('quiet', raw.quiet),
  };
}
