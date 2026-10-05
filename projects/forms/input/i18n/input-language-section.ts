import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The input section of a {@link CngxLanguagePack}: the copy of every
 * `@cngx/forms/input` directive and component. It feeds the `ariaLabels` of
 * `CNGX_INPUT_CONFIG`; a key set through `withInputAriaLabels` still wins.
 * Messages use `{name}` placeholders, numbers are formatted for the locale.
 *
 * @category forms/input/i18n
 * @since 0.1.0
 * @relatedTo CNGX_INPUT_CONFIG, withInputAriaLabels
 */
export interface CngxInputLanguageSection {
  /** Accessible name of the `CngxInputClear` button. */
  readonly clear: string;
  /** Group name of the `CngxOtpInput` host. */
  readonly otpGroup: string;
  /** `{position}`, `{count}`: accessible name of one `CngxOtpSlot`. */
  readonly otpSlot: CngxMessage;
  /** Announced when the one-time code is fully entered. */
  readonly otpComplete: string;
  /** Announced when `CngxCopyValue` copied. */
  readonly copySuccess: string;
  /** Announced when `CngxCopyValue` failed to copy. */
  readonly copyError: string;
  /** Accessible name of the `CngxFileDrop` zone. */
  readonly fileDropZone: string;
  /** Announced when `CngxCapsLock` detects Caps Lock. */
  readonly capsLockOn: string;
  /** `{level}`: announced by `CngxPasswordStrength` when the level changes. */
  readonly passwordStrength: CngxMessage;
  /** The word of each password-strength level, filled into `{level}`. */
  readonly passwordStrengthLevel: {
    readonly weak: string;
    readonly fair: string;
    readonly good: string;
    readonly strong: string;
  };
  /** Announced when `CngxInputFilter` rejects a character. */
  readonly inputRejected: string;
  /** Announced when `CngxSensitiveValue` reveals the value. */
  readonly sensitiveReveal: string;
  /** Announced when `CngxSensitiveValue` hides the value. */
  readonly sensitiveHide: string;
  /** `{value}`, `{max}`: announced when a `CngxRating` value is committed. */
  readonly ratingValue: CngxMessage;
  /** `{step}`, `{max}`: accessible name of one `CngxRating` star. */
  readonly ratingItem: CngxMessage;
  /** Accessible name of the `CngxPhoneInput` country picker. */
  readonly phoneCountry: string;
  /** `{dialCode}`, `{country}`: one row of the `CngxPhoneInput` country picker. */
  readonly phoneCountryOption: CngxMessage;
  /** `{current}`, `{max}`: the `CngxCharCount` readout when a maximum applies. */
  readonly charCountMax: CngxMessage;
  /** `{current}`, `{min}`: the `CngxCharCount` readout when only a minimum applies. */
  readonly charCountMin: CngxMessage;
}

/**
 * The English input section: the single source of the input entry's English
 * copy. The `CNGX_INPUT_CONFIG` labels default to it.
 *
 * @category forms/input/i18n
 * @since 0.1.0
 * @relatedTo CNGX_INPUT_CONFIG
 */
export const CNGX_INPUT_LANGUAGE_EN: CngxInputLanguageSection = {
  clear: 'Clear',
  otpGroup: 'One-time code',
  otpSlot: 'Digit {position} of {count}',
  otpComplete: 'Code complete',
  copySuccess: 'Copied',
  copyError: 'Copy failed',
  fileDropZone: 'File drop zone',
  capsLockOn: 'Caps Lock is on',
  passwordStrength: 'Password strength: {level}',
  passwordStrengthLevel: { weak: 'weak', fair: 'fair', good: 'good', strong: 'strong' },
  inputRejected: 'Character not allowed',
  sensitiveReveal: 'Value revealed',
  sensitiveHide: 'Value hidden',
  ratingValue: '{value} of {max}',
  ratingItem: '{step} of {max}',
  phoneCountry: 'Country',
  phoneCountryOption: '{dialCode} {country}',
  charCountMax: '{current}/{max}',
  charCountMin: '{current} (min {min})',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly input: CngxInputLanguageSection;
  }
}
