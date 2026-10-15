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

/** The one message for a flag or prompt answer outside its vocabulary. */
export function invalidAnswer(key: string, entries: readonly string[], allowed: readonly string[]): Error {
  return new Error(
    `"${entries.join('", "')}" is not a valid answer for ${key}. Expected one of: ${allowed.join(', ')}.`,
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
