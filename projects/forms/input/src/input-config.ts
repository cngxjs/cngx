import { InjectionToken, type Provider } from '@angular/core';
import type { MaskTokenMap } from './input-mask.directive';

// ── Config interface ────────────────────────────────────────────────────

/**
 * Global configuration for `@cngx/forms/input` directives.
 *
 * Provide via `provideInputConfig(...features)` at the application or component level.
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
  /** Default `resetDelay` for `CngxCopyValue` in ms. Default: `2000` */
  readonly copyResetDelay?: number;
  /** Default `maxSize` for `CngxFileDrop` in bytes. */
  readonly fileMaxSize?: number;
}

/** Default config — all undefined, directives use their own defaults. */
const DEFAULT_INPUT_CONFIG: InputConfig = {};

/**
 * Injection token for `@cngx/forms/input` global configuration.
 *
 * @see {@link provideInputConfig}
 */
export const CNGX_INPUT_CONFIG = new InjectionToken<InputConfig>('CNGX_INPUT_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_INPUT_CONFIG,
});

// ── Feature type ────────────────────────────────────────────────────────

/** A feature function that contributes to the input config. */
export type InputConfigFeature = (config: InputConfig) => InputConfig;

// ── Provider factory ────────────────────────────────────────────────────

/**
 * Provides global configuration for `@cngx/forms/input` directives.
 *
 * @example
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
 */
export function provideInputConfig(...features: InputConfigFeature[]): Provider {
  let config: InputConfig = {};
  for (const feature of features) {
    config = feature(config);
  }
  return { provide: CNGX_INPUT_CONFIG, useValue: config };
}

// ── Feature functions ───────────────────────────────────────────────────

/** Add or override phone mask patterns by region code. */
export function withPhonePatterns(patterns: Record<string, string>): InputConfigFeature {
  return (config) => ({
    ...config,
    phonePatterns: { ...config.phonePatterns, ...patterns },
  });
}

/** Add or override IBAN mask patterns by country code. */
export function withIbanPatterns(patterns: Record<string, string>): InputConfigFeature {
  return (config) => ({
    ...config,
    ibanPatterns: { ...config.ibanPatterns, ...patterns },
  });
}

/** Add or override ZIP mask patterns by country code. */
export function withZipPatterns(patterns: Record<string, string>): InputConfigFeature {
  return (config) => ({
    ...config,
    zipPatterns: { ...config.zipPatterns, ...patterns },
  });
}

/** Add or override date format patterns by language code. */
export function withDateFormats(formats: Record<string, string>): InputConfigFeature {
  return (config) => ({
    ...config,
    dateFormats: { ...config.dateFormats, ...formats },
  });
}

/** Set the default mask placeholder character. */
export function withMaskPlaceholder(char: string): InputConfigFeature {
  return (config) => ({ ...config, maskPlaceholder: char });
}

/** Set the default mask guide mode. */
export function withMaskGuide(guide: boolean): InputConfigFeature {
  return (config) => ({ ...config, maskGuide: guide });
}

/** Register global custom mask tokens. */
export function withCustomTokens(tokens: MaskTokenMap): InputConfigFeature {
  return (config) => ({
    ...config,
    customTokens: { ...config.customTokens, ...tokens },
  });
}

/** Set defaults for `CngxNumericInput`. */
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

/** Set the default `resetDelay` for `CngxCopyValue`. */
export function withCopyResetDelay(ms: number): InputConfigFeature {
  return (config) => ({ ...config, copyResetDelay: ms });
}

/** Set the default `maxSize` for `CngxFileDrop`. */
export function withFileMaxSize(bytes: number): InputConfigFeature {
  return (config) => ({ ...config, fileMaxSize: bytes });
}
