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
