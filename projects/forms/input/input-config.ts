import { InjectionToken, type Provider } from '@angular/core';
import type { MaskTokenMap } from './input-mask.directive';

/**
 * Global configuration for `@cngx/forms/input` directives.
 *
 * Provide via `provideInputConfig(...features)` at the application or component level.
 *
 * @category forms/input
 */
export interface InputConfig {
  /** Extra phone patterns by region code (merged with built-in). */
  readonly phonePatterns?: Readonly<Record<string, string>>;
  /** Extra IBAN patterns by country code (merged with built-in). */
  readonly ibanPatterns?: Readonly<Record<string, string>>;
  /** Extra ZIP patterns by country code (merged with built-in). */
  readonly zipPatterns?: Readonly<Record<string, string>>;
  /** Extra date format patterns by language code (merged with built-in). */
  readonly dateFormats?: Readonly<Record<string, string>>;
  /** Default mask placeholder character. Default: `'_'` */
  readonly maskPlaceholder?: string;
  /** Default guide mode for masks. Default: `true` */
  readonly maskGuide?: boolean;
  /** Custom mask tokens available globally. */
  readonly customTokens?: MaskTokenMap;
  /** Default locale for `CngxNumericInput` (overrides `LOCALE_ID`). */
  readonly numericLocale?: string;
  /** Default decimal places for `CngxNumericInput`. */
  readonly numericDecimals?: number;
  /** Default step for `CngxNumericInput`. Default: `1` */
  readonly numericStep?: number;
  /**
   * ISO 4217 currency code for `CngxNumericInput` formatting (grouping +
   * standard fraction digits). The symbol is never baked into the value -
   * render it through a `CngxPrefix`/`CngxSuffix` affix. Set via `withCurrency`.
   */
  readonly numericCurrency?: string;
  /** Default `resetDelay` for `CngxCopyValue` in ms. Default: `2000` */
  readonly copyResetDelay?: number;
  /** Default `maxSize` for `CngxFileDrop` in bytes. */
  readonly fileMaxSize?: number;
  /** Default `maxFiles` for `CngxFileDrop`. */
  readonly fileMaxFiles?: number;
  /**
   * Consumer overrides for the built-in ARIA label strings. Unset keys fall
   * back to {@link DEFAULT_INPUT_ARIA_LABELS}.
   */
  readonly ariaLabels?: Partial<InputAriaLabels>;
}

/**
 * Consumer-overridable ARIA label strings for `@cngx/forms/input` directives.
 *
 * Library defaults are English ({@link DEFAULT_INPUT_ARIA_LABELS}); supply a
 * partial override via {@link withInputAriaLabels} at the application or
 * component level. Mirrors the select family's `withAriaLabels` idiom.
 *
 * @category forms/input
 */
export interface InputAriaLabels {
  /** `aria-label` for the `CngxInputClear` button. Default: `'Clear'` */
  readonly clear: string;
  /** Group name for the `CngxOtpInput` host (`role="group"`). Default: `'One-time code'` */
  readonly otpGroup: string;
  /** Per-slot `aria-label` factory for `CngxOtpSlot`. Default: `` `Digit ${index + 1} of ${length}` `` */
  readonly otpSlot: (index: number, length: number) => string;
  /** Live-region announcement when the OTP is fully entered. Default: `'Code complete'` */
  readonly otpComplete: string;
  /** Live-region announcement when `CngxCopyValue` copies successfully. Default: `'Copied'` */
  readonly copySuccess: string;
  /** Assertive live-region announcement when `CngxCopyValue` fails to copy. Default: `'Copy failed'` */
  readonly copyError: string;
  /** `aria-label` for the `CngxFileDrop` zone. Default: `'File drop zone'` */
  readonly fileDropZone: string;
  /** Assertive live-region warning announced when `CngxCapsLock` detects Caps Lock active. Default: `'Caps Lock is on'` */
  readonly capsLockOn: string;
  /** Polite live-region template announced by `CngxPasswordStrength` when the strength label changes. Default: `` `Password strength: ${label}` `` */
  readonly passwordStrength: (label: string) => string;
  /** Assertive live-region announcement when `CngxInputFilter` rejects a disallowed character. Default: `'Character not allowed'` */
  readonly inputRejected: string;
  /** Polite live-region announcement when `CngxSensitiveValue` reveals the value. Default: `'Value revealed'` */
  readonly sensitiveReveal: string;
  /** Polite live-region announcement when `CngxSensitiveValue` hides the value. Default: `'Value hidden'` */
  readonly sensitiveHide: string;
  /** Live-region announcement factory for `CngxRating` on a committed value. Default: `` (value, max) => `${value} of ${max}` `` */
  readonly ratingValue: (value: number, max: number) => string;
}

/**
 * English default ARIA labels for `@cngx/forms/input`. Directives read a key
 * as `config.ariaLabels?.<key> ?? DEFAULT_INPUT_ARIA_LABELS.<key>`.
 *
 * @category forms/input
 */
export const DEFAULT_INPUT_ARIA_LABELS: InputAriaLabels = {
  clear: 'Clear',
  otpGroup: 'One-time code',
  otpSlot: (index, length) => `Digit ${index + 1} of ${length}`,
  otpComplete: 'Code complete',
  copySuccess: 'Copied',
  copyError: 'Copy failed',
  fileDropZone: 'File drop zone',
  capsLockOn: 'Caps Lock is on',
  passwordStrength: (label) => `Password strength: ${label}`,
  inputRejected: 'Character not allowed',
  sensitiveReveal: 'Value revealed',
  sensitiveHide: 'Value hidden',
  ratingValue: (value, max) => `${value} of ${max}`,
};

/**
 * Empty default - every directive falls back to its own default.
 * @internal
 */
const DEFAULT_INPUT_CONFIG: InputConfig = {};

/**
 * DI token holding the resolved `InputConfig` for the `@cngx/forms/input`
 * directive family. Every input directive injects it to read app- or
 * subtree-level defaults, falling back to its own per-directive default for any
 * key left unset.
 *
 * Do not bind it directly. Configure it through `provideInputConfig(...features)`
 * composed from the `with*` features; a raw `{ provide: CNGX_INPUT_CONFIG,
 * useValue }` bypasses the per-key merge those features encode.
 *
 * - `providedIn: 'root'` with an empty-config factory, so it resolves without a
 *   provider and each directive keeps its built-in default.
 * - Consumed by `CngxInputMask`, `CngxNumericInput`, `CngxCopyValue`,
 *   `CngxFileDrop`, `CngxInputClear`, `CngxOtpInput`, `CngxCapsLock`,
 *   `CngxPasswordStrength`, `CngxInputFilter`, and `CngxSensitiveValue`.
 * - Token resolution is nearest-wins: a config in a component's `viewProviders`
 *   replaces an ancestor's for that subtree, it does not deep-merge.
 *
 * @see {@link provideInputConfig}
 *
 * @category forms/input
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/input-config.ts
 * @since 0.1.0
 * @relatedTo provideInputConfig, withInputAriaLabels, withNumericDefaults, withMaskPlaceholder, withMaskGuide, withCustomTokens, withPhonePatterns, withIbanPatterns, withZipPatterns, withDateFormats, withCopyResetDelay, withFileMaxSize, withFileMaxFiles, withCurrency
 */
export const CNGX_INPUT_CONFIG = new InjectionToken<InputConfig>('CNGX_INPUT_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_INPUT_CONFIG,
});

/**
 * A feature function that contributes to the input config.
 *
 * @category forms/input
 */
export type InputConfigFeature = (config: InputConfig) => InputConfig;

/**
 * Provides global configuration for `@cngx/forms/input` directives.
 *
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideInputConfig(
 *       withPhonePatterns({ LI: '+000 000 00 00' }),
 *       withMaskPlaceholder('·'),
 *       withNumericDefaults({ decimals: 2, locale: 'de-CH' }),
 *       withCopyResetDelay(3000),
 *     ),
 *   ],
 * };
 * ```
 *
 * Returns a plain `Provider`, so it works app-wide in
 * `ApplicationConfig.providers` or scoped to a subtree via a component's
 * `viewProviders`. The nearest `provideInputConfig` wins for a subtree by
 * token resolution - it replaces an ancestor config, it does not deep-merge.
 *
 * Compose with the feature functions:
 * @see {@link withPhonePatterns}
 * @see {@link withIbanPatterns}
 * @see {@link withZipPatterns}
 * @see {@link withDateFormats}
 * @see {@link withMaskPlaceholder}
 * @see {@link withMaskGuide}
 * @see {@link withCustomTokens}
 * @see {@link withNumericDefaults}
 * @see {@link withCopyResetDelay}
 * @see {@link withFileMaxSize}
 * @see {@link withFileMaxFiles}
 * @see {@link withInputAriaLabels}
 * @see {@link withCurrency}
 *
 * @category forms/input
 */
export function provideInputConfig(...features: InputConfigFeature[]): Provider {
  let config: InputConfig = {};
  for (const feature of features) {
    config = feature(config);
  }
  return { provide: CNGX_INPUT_CONFIG, useValue: config };
}

/**
 * Adds or overrides phone mask patterns keyed by region code. \
 * Reach for it when a `cngxInputMask="phone"` / `"phone:<REGION>"` needs a
 * region the library does not ship, or to override one it does.
 *
 * - Built-in regions: US, DE, CH, AT, FR, UK, IT, ES, JP, BR.
 * - Consumer entries merge per key onto the built-ins and win on collision.
 * - Resolved as `{ ...PHONE_PATTERNS, ...config.phonePatterns }[region]`,
 *   falling back to US when the region is absent.
 * - Region comes from `phone:<REGION>` or `LOCALE_ID`.
 * - Pattern tokens: `0` = required digit, literals pass through.
 *
 * ```typescript
 * provideInputConfig(withPhonePatterns({ LI: '+000 000 00 00' }));
 * // <input cngxInputMask="phone:LI" />
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withPhonePatterns(patterns: Record<string, string>): InputConfigFeature {
  return (config) => ({
    ...config,
    phonePatterns: { ...config.phonePatterns, ...patterns },
  });
}

/**
 * Adds or overrides IBAN mask patterns keyed by country code.
 *
 * - Built-in countries: CH, DE, AT, FR, IT, ES, NL, GB.
 * - Patterns encode length and 4-char grouping with tokens (`A` = required
 *   letter, `0` = required digit).
 * - Read as `{ ...IBAN_PATTERNS, ...config.ibanPatterns }[region]`; an unknown
 *   region falls back to `AA00 0000 0000 0000 0000 00`.
 * - Consumer entries merge per key and win on collision.
 * - Region comes from `iban:<REGION>` or `LOCALE_ID`.
 *
 * ```typescript
 * provideInputConfig(withIbanPatterns({ BE: 'AA00 0000 0000 0000' }));
 * // <input cngxInputMask="iban:BE" />
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withIbanPatterns(patterns: Record<string, string>): InputConfigFeature {
  return (config) => ({
    ...config,
    ibanPatterns: { ...config.ibanPatterns, ...patterns },
  });
}

/**
 * Adds or overrides postal-code mask patterns keyed by country code.
 *
 * - Built-in countries: US, DE, CH, AT, FR, UK, JP.
 * - A `|` in a pattern declares alternates picked by input length (the UK
 *   entry: `A0A 0AA|AA0 0AA|...`).
 * - Read as `{ ...ZIP_PATTERNS, ...config.zipPatterns }[region]`; an unknown
 *   region falls back to `00000`.
 * - Consumer entries merge per key and win on collision.
 * - Region comes from `zip:<REGION>` or `LOCALE_ID`.
 *
 * ```typescript
 * provideInputConfig(withZipPatterns({ NL: '0000 AA' }));
 * // <input cngxInputMask="zip:NL" />
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withZipPatterns(patterns: Record<string, string>): InputConfigFeature {
  return (config) => ({
    ...config,
    zipPatterns: { ...config.zipPatterns, ...patterns },
  });
}

/**
 * Adds or overrides date mask patterns keyed by language code (the `de` in
 * `de-CH`).
 *
 * - Built-ins cover the DD/MM/YYYY, MM/DD/YYYY, and YYYY/MM/DD orders per
 *   language.
 * - Read by the `date`, `datetime`, and `time` presets as
 *   `{ ...DATE_FORMATS, ...config.dateFormats }[lang]`, falling back to `en`;
 *   `lang` is the prefix of `LOCALE_ID`.
 * - Tokens: `0` = required digit, separators are literals.
 * - Does not feed `date:short` - that uses a separate built-in table.
 * - Consumer entries merge per key and win on collision.
 *
 * ```typescript
 * provideInputConfig(withDateFormats({ sv: '0000-00-00' }));
 * // LOCALE_ID 'sv-SE' + <input cngxInputMask="date" />
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withDateFormats(formats: Record<string, string>): InputConfigFeature {
  return (config) => ({
    ...config,
    dateFormats: { ...config.dateFormats, ...formats },
  });
}

/**
 * Sets the global placeholder character `CngxInputMask` shows for unfilled
 * slots in guide mode. Library default is `'_'`.
 *
 * - Resolution order: `[placeholder]` input, then `config.maskPlaceholder`,
 *   then `'_'`.
 * - Sets the app-wide baseline for every masked input that does not bind its
 *   own `[placeholder]`.
 * - Also fills the `aria-placeholder` the mask exposes.
 *
 * ```typescript
 * provideInputConfig(withMaskPlaceholder('·')); // middle dot
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withMaskPlaceholder(char: string): InputConfigFeature {
  return (config) => ({ ...config, maskPlaceholder: char });
}

/**
 * Sets the global guide mode for `CngxInputMask`. Library default is `true`.
 *
 * - `true`: placeholder characters fill unfilled slots and the cursor snaps to
 *   the next empty slot on focus.
 * - `false`: a bare mask showing only typed characters and their literals.
 * - Resolution order: `[guide]` input, then `config.maskGuide`, then `true`.
 *
 * ```typescript
 * provideInputConfig(withMaskGuide(false));
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withMaskGuide(guide: boolean): InputConfigFeature {
  return (config) => ({ ...config, maskGuide: guide });
}

/**
 * Registers mask tokens globally, beyond the built-in `0` `9` `A` `a` `*`.
 *
 * - Each token maps one mask character to a `pattern` regex, an `optional`
 *   flag, and an optional per-char `transform`.
 * - Use it when a pattern needs a character class the built-ins lack (hex
 *   digit, restricted letter set) across the app rather than per input.
 * - Merged as `{ ...config.customTokens, ...input.customTokens }`, so a
 *   per-input `[customTokens]` entry overrides the global one of the same key.
 *
 * ```typescript
 * provideInputConfig(withCustomTokens({
 *   H: { pattern: /[0-9a-fA-F]/, transform: (c) => c.toUpperCase() },
 * }));
 * // <input cngxInputMask="#HHHHHH" />
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withCustomTokens(tokens: MaskTokenMap): InputConfigFeature {
  return (config) => ({
    ...config,
    customTokens: { ...config.customTokens, ...tokens },
  });
}

/**
 * Sets app-wide defaults for `CngxNumericInput`.
 *
 * - `locale` overrides `LOCALE_ID` for numeric inputs only.
 * - `decimals` and `step` set formatting (`step` default `1`).
 * - Each key applies only when supplied; a partial override leaves the rest at
 *   the directive's defaults.
 * - Per-input bindings still win over these.
 * - Maps to the `numericLocale` / `numericDecimals` / `numericStep` keys.
 *
 * ```typescript
 * provideInputConfig(withNumericDefaults({ decimals: 2, locale: 'de-CH' }));
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withNumericDefaults(defaults: {
  locale?: string;
  decimals?: number;
  step?: number;
}): InputConfigFeature {
  return (config) => ({
    ...config,
    ...(defaults.locale != null && { numericLocale: defaults.locale }),
    ...(defaults.decimals != null && { numericDecimals: defaults.decimals }),
    ...(defaults.step != null && { numericStep: defaults.step }),
  });
}

/**
 * Sets the global delay in milliseconds before `CngxCopyValue` reverts its
 * copied state - the window where the button reads as copied before snapping
 * back to idle. Library default is `2000`.
 *
 * - A per-input binding overrides it.
 * - Maps to the `copyResetDelay` config key.
 *
 * ```typescript
 * provideInputConfig(withCopyResetDelay(3000));
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withCopyResetDelay(ms: number): InputConfigFeature {
  return (config) => ({ ...config, copyResetDelay: ms });
}

/**
 * Sets the global maximum accepted file size in bytes for `CngxFileDrop`.
 *
 * - No library default; unset means the directive enforces no size cap.
 * - Value is raw bytes, not KB/MB.
 * - A per-input binding overrides it.
 * - Maps to the `fileMaxSize` config key.
 *
 * ```typescript
 * provideInputConfig(withFileMaxSize(5 * 1024 * 1024)); // 5 MiB
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withFileMaxSize(bytes: number): InputConfigFeature {
  return (config) => ({ ...config, fileMaxSize: bytes });
}

/**
 * Set the default `maxFiles` for `CngxFileDrop`.
 *
 * @category forms/input
 */
export function withFileMaxFiles(count: number): InputConfigFeature {
  return (config) => ({ ...config, fileMaxFiles: count });
}

/**
 * Overrides the built-in ARIA label strings the input directives announce.
 *
 * - Unset keys fall back to `DEFAULT_INPUT_ARIA_LABELS` per key, so a partial
 *   override is safe.
 * - Library defaults are English; German (or any locale) is consumer-supplied
 *   here. Mirrors the select family's `withAriaLabels`.
 * - `clear` -> `CngxInputClear` button label.
 * - `copySuccess` / `copyError` -> `CngxCopyValue` live-region announcements.
 * - `otpGroup` / `otpSlot(index, length)` / `otpComplete` -> `CngxOtpInput`
 *   group, per-slot labels, and completion announcement.
 * - `capsLockOn` -> `CngxCapsLock` assertive warning.
 * - `passwordStrength(label)` -> `CngxPasswordStrength` polite announcement.
 * - `inputRejected` -> `CngxInputFilter` assertive rejection.
 * - `sensitiveReveal` / `sensitiveHide` -> `CngxSensitiveValue` reveal/hide announcements.
 * - `ratingValue(value, max)` -> `CngxRating` polite committed-value announcement.
 *
 * ```typescript
 * provideInputConfig(
 *   withInputAriaLabels({ clear: 'Leeren', copySuccess: 'Kopiert' }),
 * );
 * ```
 *
 * @see {@link provideInputConfig}
 * @category forms/input
 */
export function withInputAriaLabels(labels: Partial<InputAriaLabels>): InputConfigFeature {
  return (config) => ({
    ...config,
    ariaLabels: { ...config.ariaLabels, ...labels },
  });
}
