import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The form-field section of a {@link CngxLanguagePack}: the message of every
 * built-in validator kind, the generic fallback for any other kind, the
 * order of a field label and its message in the form-level error summary, and
 * the constraint hints a field derives from its validators. It
 * feeds `CNGX_FORM_FIELD_I18N`. Messages use `{name}` placeholders; a plural
 * message picks its form from `{count}`.
 *
 * @category forms/field/i18n
 * @since 0.1.0
 * @relatedTo CNGX_FORM_FIELD_I18N, CngxFieldErrors, CngxFormErrors
 */
export interface CngxFormFieldLanguageSection {
  /** Error kind `required`. */
  readonly required: string;
  /** Error kind `requiredTrue` (a checkbox that has to be checked). */
  readonly requiredTrue: string;
  /** Error kind `email`. */
  readonly email: string;
  /** Error kind `min`; `{min}` is the lowest allowed value. */
  readonly min: CngxMessage;
  /** Error kind `max`; `{max}` is the highest allowed value. */
  readonly max: CngxMessage;
  /** Error kind `minLength`; plural on `{count}`, the lowest allowed length. */
  readonly minLength: CngxMessage;
  /** Error kind `maxLength`; plural on `{count}`, the highest allowed length. */
  readonly maxLength: CngxMessage;
  /** Error kind `pattern`. */
  readonly pattern: string;
  /** Error kind `parse` (the control could not read the typed text). */
  readonly parse: string;
  /**
   * Any other error kind that has neither a registry entry nor its own
   * `message`. Never the raw kind.
   */
  readonly invalid: string;
  /**
   * Places a field label and its error message in the form-level summary:
   * `{label}` and `{message}`, in the order of the language. String only:
   * the summary renders the placeholders as elements, so a plural object or
   * a function has nothing to fill in.
   */
  readonly errorSummaryItem: string;
  /**
   * Constraint hint for a length range: `{min}` and `{max}`, plural on
   * `{count}` (the highest allowed length).
   */
  readonly hintLengthRange: CngxMessage;
  /** Constraint hint for a lowest length; plural on `{count}`. */
  readonly hintMinLength: CngxMessage;
  /** Constraint hint for a highest length; plural on `{count}`. */
  readonly hintMaxLength: CngxMessage;
  /** Constraint hint for a value range: `{min}` and `{max}`. */
  readonly hintValueRange: CngxMessage;
  /** Constraint hint for a lowest value: `{min}`. */
  readonly hintMinValue: CngxMessage;
  /** Constraint hint for a highest value: `{max}`. */
  readonly hintMaxValue: CngxMessage;
}

/**
 * The English form-field section: the single source of the form fields'
 * English error copy. `CNGX_FORM_FIELD_I18N` defaults to it.
 *
 * @category forms/field/i18n
 * @since 0.1.0
 * @relatedTo CNGX_FORM_FIELD_I18N
 */
export const CNGX_FORM_FIELD_LANGUAGE_EN: CngxFormFieldLanguageSection = {
  required: 'This field is required.',
  requiredTrue: 'Check this box to continue.',
  email: 'Enter a valid email address.',
  min: 'Enter a value of {min} or more.',
  max: 'Enter a value of {max} or less.',
  minLength: {
    one: 'Enter at least {count} character.',
    other: 'Enter at least {count} characters.',
  },
  maxLength: {
    one: 'Enter at most {count} character.',
    other: 'Enter at most {count} characters.',
  },
  pattern: 'Enter a value in the expected format.',
  parse: 'Enter a valid value.',
  invalid: 'This value is invalid.',
  errorSummaryItem: '{label}: {message}',
  hintLengthRange: {
    one: '{min}–{max} character',
    other: '{min}–{max} characters',
  },
  hintMinLength: {
    one: 'Min. {count} character',
    other: 'Min. {count} characters',
  },
  hintMaxLength: {
    one: 'Max. {count} character',
    other: 'Max. {count} characters',
  },
  hintValueRange: '{min}–{max}',
  hintMinValue: 'Min. {min}',
  hintMaxValue: 'Max. {max}',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly formField: CngxFormFieldLanguageSection;
  }
}
