import { memoize } from '@cngx/core/utils';

/**
 * A selectable country for {@link CngxPhoneInput}.
 *
 * @category forms/input
 */
export interface Country {
  /** Region key passed to the phone mask as `phone:<region>` (matches the built-in `PHONE_PATTERNS` keys). */
  readonly region: string;
  /** International dial code, e.g. `'+49'`. */
  readonly dialCode: string;
  /** Human-readable country name. */
  readonly label: string;
}

/** Region key and dial code per built-in phone-mask region. @internal */
const PHONE_REGIONS: readonly (readonly [region: string, dialCode: string])[] = [
  ['US', '+1'],
  ['UK', '+44'],
  ['DE', '+49'],
  ['AT', '+43'],
  ['CH', '+41'],
  ['FR', '+33'],
  ['IT', '+39'],
  ['ES', '+34'],
  ['SI', '+386'],
  ['HR', '+385'],
  ['PL', '+48'],
  ['JP', '+81'],
  ['BR', '+55'],
];

/** Mask region keys that are not ISO 3166 codes, mapped for the `Intl` lookup only. @internal */
const ISO_REGION_ALIAS: Readonly<Record<string, string>> = { UK: 'GB' };

/** @internal */
function regionName(names: Intl.DisplayNames | null, region: string): string {
  return names?.of(ISO_REGION_ALIAS[region] ?? region) ?? region;
}

/** @internal */
function displayNamesFor(locale: string): Intl.DisplayNames | null {
  try {
    return new Intl.DisplayNames(locale, { type: 'region' });
  } catch {
    return null;
  }
}

/**
 * Default country list backing `CngxPhoneInput`'s picker, labelled in `locale`
 * through `Intl.DisplayNames` (names depend on the runtime's ICU data). Regions
 * line up with the built-in phone-mask patterns; the `region` key stays the mask
 * key (`UK`), only the name lookup uses ISO `GB`. One frozen list per locale, so
 * every instance under the same locale shares the same `Country` objects.
 * Consumers override the displayed list via the `[countries]` input.
 *
 * @internal
 */
export const createPhoneCountries: (locale: string) => readonly Country[] = memoize(
  (locale: string) => {
    const names = displayNamesFor(locale);
    return Object.freeze(
      PHONE_REGIONS.map(([region, dialCode]) =>
        Object.freeze({ region, dialCode, label: regionName(names, region) }),
      ),
    );
  },
  { cacheLimit: 16 },
);
