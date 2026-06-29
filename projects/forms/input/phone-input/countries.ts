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

/**
 * Default country list backing `CngxPhoneInput`'s picker. Regions line up with
 * the built-in phone-mask patterns. Consumers override the displayed list via
 * the `[countries]` input.
 *
 * @internal
 */
export const CNGX_PHONE_COUNTRIES: readonly Country[] = [
  { region: 'US', dialCode: '+1', label: 'United States' },
  { region: 'UK', dialCode: '+44', label: 'United Kingdom' },
  { region: 'DE', dialCode: '+49', label: 'Germany' },
  { region: 'AT', dialCode: '+43', label: 'Austria' },
  { region: 'CH', dialCode: '+41', label: 'Switzerland' },
  { region: 'FR', dialCode: '+33', label: 'France' },
  { region: 'IT', dialCode: '+39', label: 'Italy' },
  { region: 'ES', dialCode: '+34', label: 'Spain' },
  { region: 'SI', dialCode: '+386', label: 'Slovenia' },
  { region: 'HR', dialCode: '+385', label: 'Croatia' },
  { region: 'PL', dialCode: '+48', label: 'Poland' },
  { region: 'JP', dialCode: '+81', label: 'Japan' },
  { region: 'BR', dialCode: '+55', label: 'Brazil' },
];
