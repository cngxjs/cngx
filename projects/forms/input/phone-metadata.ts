import { InjectionToken, type Provider } from '@angular/core';

/**
 * Strategy contract that resolves a phone number's line type from its region
 * and national subscriber digits.
 *
 * `nationalDigits` is the subscriber number with the country dial-code digits
 * already stripped - `CngxPhoneInput` owns that extraction, so an adapter never
 * sees the `+49` prefix and can hand the digits straight to a metadata library.
 * The default registered on {@link CNGX_PHONE_METADATA} returns `'unknown'`,
 * which keeps `CngxPhoneInput`'s length-based mask alternation unchanged; a
 * consumer who needs prefix-accurate detection provides an adapter backed by
 * real numbering metadata (e.g. `libphonenumber-js`), which stays in the
 * consumer's dependency graph, never cngx's.
 *
 * `formatAsYouType` / `isValid` are reserved for a later display-formatting
 * pass and are intentionally not declared yet, so the contract ships as a
 * single load-bearing method rather than an empty surface.
 *
 * @category forms/input
 */
export interface CngxPhoneMetadata {
  /**
   * Resolves the line type for `nationalDigits` in `region`. Return `'unknown'`
   * when the prefix is not yet decisive so the caller keeps its length-based
   * fallback.
   *
   * Must be a pure function of its two arguments: `CngxPhoneInput` reads it
   * inside a `computed()`, so any internal state or side effect would taint
   * that derivation and is unsupported.
   */
  lineType(region: string, nationalDigits: string): 'mobile' | 'fixedLine' | 'unknown';
}

/**
 * DI token holding the active {@link CngxPhoneMetadata} strategy that
 * `CngxPhoneInput` consults to drive its `auto` line-type mask. `providedIn:
 * 'root'` with a default that returns `'unknown'`, so the field works without
 * any provider and falls back to its length-based alternation; override
 * app-wide or per-subtree through {@link providePhoneMetadata} to swap in a
 * metadata-backed adapter.
 *
 * ```typescript
 * providers: [providePhoneMetadata(libphonenumberAdapter)]
 * ```
 *
 * @category forms/input
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/phone-metadata.ts
 * @since 0.2.0
 * @relatedTo CngxPhoneInput, providePhoneMetadata
 */
export const CNGX_PHONE_METADATA = new InjectionToken<CngxPhoneMetadata>('CNGX_PHONE_METADATA', {
  providedIn: 'root',
  factory: () => ({ lineType: () => 'unknown' }),
});

/**
 * Registers a {@link CngxPhoneMetadata} adapter for `CngxPhoneInput`'s `auto`
 * line-type detection.
 *
 * Returns a plain `Provider`, so it works app-wide in
 * `ApplicationConfig.providers` or scoped to a subtree via a component's
 * `viewProviders` - mirroring {@link provideInputConfig}. The nearest provider
 * wins for a subtree by token resolution.
 *
 * ```typescript
 * // app.config.ts
 * providers: [providePhoneMetadata(libphonenumberAdapter)]
 * ```
 *
 * @category forms/input
 */
export function providePhoneMetadata(adapter: CngxPhoneMetadata): Provider {
  return { provide: CNGX_PHONE_METADATA, useValue: adapter };
}

/**
 * A single national-prefix rule: a literal prefix matched with `startsWith`
 * (`'0664'` minus the trunk `0` is `'664'`), or a `RegExp` matched against the
 * start of the national digits (`/^1[567]/`). Only start-anchored matches count
 * as a prefix; a `RegExp` that matches mid-number is ignored.
 *
 * @category forms/input
 */
export type PhonePrefixMatcher = string | RegExp;

/**
 * Per-region map of the national-number prefixes that identify each line type.
 * This carries the consumer's own numbering data only - cngx ships none, in line
 * with {@link CngxPhoneMetadata} keeping numbering metadata out of the library.
 *
 * @category forms/input
 */
export type PhonePrefixMap = Readonly<
  Record<string, Readonly<Partial<Record<'mobile' | 'fixedLine', readonly PhonePrefixMatcher[]>>>>
>;

/**
 * Builds a {@link CngxPhoneMetadata} adapter from a region keyed prefix map,
 * so a consumer declares the prefixes that matter instead of hand-writing the
 * region branch and the matching closure.
 *
 * The adapter resolves the line type by longest matching prefix: the matcher
 * with the most matched leading digits wins, so a specific `'0820'` fixed-line
 * rule beats a broader `'08'` mobile rule. Ties resolve to `mobile` (it is the
 * decisive case `auto` mask alternation cares about). An unknown region or no
 * matching prefix returns `'unknown'`, keeping the length-based fallback.
 *
 * It still ships no numbering data - the caller supplies every prefix - so it is
 * sugar over an inline adapter, not a replacement for a real metadata library
 * like `libphonenumber-js`.
 *
 * ```typescript
 * providePhoneMetadata(
 *   createPrefixPhoneMetadata({
 *     DE: { mobile: [/^1[567]/] },
 *     AT: { mobile: ['650', '660', '664', '676', '699'] },
 *   }),
 * );
 * ```
 *
 * @category forms/input
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/phone-metadata.ts
 * @since 0.2.0
 * @relatedTo CngxPhoneMetadata, providePhoneMetadata
 */
export function createPrefixPhoneMetadata(prefixes: PhonePrefixMap): CngxPhoneMetadata {
  const compiled = new Map<string, readonly CompiledMatcher[]>();
  for (const region of Object.keys(prefixes)) {
    const entry = prefixes[region];
    const matchers: CompiledMatcher[] = [];
    for (const type of ['mobile', 'fixedLine'] as const) {
      for (const matcher of entry[type] ?? []) {
        matchers.push({ type, matchedLength: compileMatcher(matcher) });
      }
    }
    compiled.set(region, matchers);
  }

  return {
    lineType(region, nationalDigits) {
      const matchers = compiled.get(region);
      if (!matchers) {
        return 'unknown';
      }
      let bestLength = -1;
      let bestType: 'mobile' | 'fixedLine' | 'unknown' = 'unknown';
      for (const { type, matchedLength } of matchers) {
        const length = matchedLength(nationalDigits);
        if (length > bestLength) {
          bestLength = length;
          bestType = type;
        }
      }
      return bestType;
    },
  };
}

interface CompiledMatcher {
  readonly type: 'mobile' | 'fixedLine';
  /** Returns the matched leading-digit count, or `-1` when the prefix misses. */
  readonly matchedLength: (nationalDigits: string) => number;
}

function compileMatcher(matcher: PhonePrefixMatcher): (nationalDigits: string) => number {
  if (typeof matcher === 'string') {
    return (national) => (national.startsWith(matcher) ? matcher.length : -1);
  }
  // Drop the global flag: exec on a /g RegExp is stateful across calls and the
  // adapter reuses each matcher for every lookup.
  const re = matcher.global ? new RegExp(matcher.source, matcher.flags.replace('g', '')) : matcher;
  return (national) => {
    const match = re.exec(national);
    return match?.index === 0 ? match[0].length : -1;
  };
}
