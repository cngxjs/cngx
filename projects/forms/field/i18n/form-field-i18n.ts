import { computed, inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import {
  createNestedOverrideMerge,
  createOverrideMerge,
  type CngxNestedOverrides,
} from '@cngx/core/utils';
import type { ValidationError } from '@angular/forms/signals';

import type { ErrorMessageFn, ErrorMessageMap } from '../models';
import {
  CNGX_FORM_FIELD_LANGUAGE_EN,
  type CngxFormFieldLanguageSection,
} from './form-field-language-section';

/**
 * Form-field i18n surface: the library's own error copy and constraint hints.
 * The error copy sits below the consumer's `CNGX_ERROR_MESSAGES` registry and
 * below an error's own `message`, so it only speaks where neither says
 * anything. The `hint*` keys are the language-pack copy of the constraint
 * hints; replace a hint through `withConstraintHints`, the one override for
 * hints (`withFormFieldI18nLabels` does not take them).
 *
 * @category forms/field/i18n
 * @since 0.1.0
 */
export interface CngxFormFieldI18n {
  /**
   * Message per built-in validator kind (`required`, `requiredTrue`, `email`,
   * `min`, `max`, `minLength`, `maxLength`, `pattern`, `parse`, `timeRange`).
   */
  readonly errorMessages: ErrorMessageMap;
  /** Message for any other kind that has no registry entry and no own `message`. */
  readonly invalid: string;
  /**
   * Order of a field label and its message in the form-level summary,
   * `{label}` and `{message}` rendered as elements. English `'{label}: {message}'`.
   */
  readonly errorSummaryItem: string;
  /** Constraint hint for a length range, e.g. "8–64 characters". */
  readonly hintLengthRange: (min: number, max: number) => string;
  /** Constraint hint for a lowest length, e.g. "Min. 8 characters". */
  readonly hintMinLength: (min: number) => string;
  /** Constraint hint for a highest length, e.g. "Max. 64 characters". */
  readonly hintMaxLength: (max: number) => string;
  /** Constraint hint for a value range, e.g. "0–100". */
  readonly hintValueRange: (min: number, max: number) => string;
  /** Constraint hint for a lowest value, e.g. "Min. 0". */
  readonly hintMinValue: (min: number) => string;
  /** Constraint hint for a highest value, e.g. "Max. 100". */
  readonly hintMaxValue: (max: number) => string;
}

/** @internal The constraint-hint keys, overridden only through `withConstraintHints`. */
type HintKey =
  | 'hintLengthRange'
  | 'hintMinLength'
  | 'hintMaxLength'
  | 'hintValueRange'
  | 'hintMinValue'
  | 'hintMaxValue';

/**
 * The keys {@link withFormFieldI18nLabels} accepts: every
 * {@link CngxFormFieldI18n} key except the constraint hints, with
 * `errorMessages` merged kind by kind. Hints are replaced through
 * `withConstraintHints` on `provideFormField` / `provideFormFieldAt`.
 *
 * @category forms/field/i18n
 * @since 0.1.0
 */
export type CngxFormFieldI18nOverrides = CngxNestedOverrides<
  Omit<CngxFormFieldI18n, HintKey>,
  'errorMessages'
>;

type NumberKey = 'min' | 'max' | 'minLength' | 'maxLength';

/** @internal The numeric payload of a built-in error, or `undefined`. */
function numberOf(error: ValidationError.WithFieldTree, key: NumberKey): number | undefined {
  const value = (error as unknown as Partial<Record<NumberKey, unknown>>)[key];
  return typeof value === 'number' ? value : undefined;
}

/** @internal Turns a form-field section into the token's keys for a locale. */
function formFieldBundleFrom(
  section: CngxFormFieldLanguageSection,
  locale: string,
): CngxFormFieldI18n {
  const bounded =
    (
      key: NumberKey,
      message: CngxFormFieldLanguageSection[NumberKey],
      name: string,
    ): ErrorMessageFn =>
    (error) => {
      const bound = numberOf(error, key);
      return bound === undefined
        ? section.invalid
        : formatMessage(message, { [name]: bound }, locale);
    };
  return {
    errorMessages: {
      required: () => section.required,
      requiredTrue: () => section.requiredTrue,
      email: () => section.email,
      min: bounded('min', section.min, 'min'),
      max: bounded('max', section.max, 'max'),
      minLength: bounded('minLength', section.minLength, 'count'),
      maxLength: bounded('maxLength', section.maxLength, 'count'),
      pattern: () => section.pattern,
      parse: () => section.parse,
      timeRange: () => section.timeRange,
    },
    invalid: section.invalid,
    errorSummaryItem: section.errorSummaryItem,
    hintLengthRange: (min, max) =>
      formatMessage(section.hintLengthRange, { min, max, count: max }, locale),
    hintMinLength: (min) => formatMessage(section.hintMinLength, { count: min }, locale),
    hintMaxLength: (max) => formatMessage(section.hintMaxLength, { count: max }, locale),
    hintValueRange: (min, max) => formatMessage(section.hintValueRange, { min, max }, locale),
    hintMinValue: (min) => formatMessage(section.hintMinValue, { min }, locale),
    hintMaxValue: (max) => formatMessage(section.hintMaxValue, { max }, locale),
  };
}

const NO_SECTION: Partial<CngxFormFieldLanguageSection> = {};

/** @internal The form-field section of the active pack over English. */
function injectFormFieldSection(): Signal<CngxFormFieldLanguageSection> {
  const pack = injectLanguageSection('formField');
  return createOverrideMerge(
    CNGX_FORM_FIELD_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/** @internal Builds and reads the token, formatted for the reading locale. */
const formFieldBundle = createSectionBundle<CngxFormFieldLanguageSection, CngxFormFieldI18n>({
  section: injectFormFieldSection,
  toBundle: formFieldBundleFrom,
});

/**
 * DI token for the form-field i18n bundle, as a `Signal` so a runtime
 * language switch reaches every message it feeds. `providedIn: 'root'`: the
 * form-field section of the active language pack over the English defaults,
 * formatted for the app locale. Provide it through {@link provideFormFieldI18n}.
 *
 * `CngxFieldErrors` and `CngxFormErrors` resolve an error's text in order:
 * the `CNGX_ERROR_MESSAGES` entry for its kind, the error's own `message`,
 * this bundle's `errorMessages` entry, then `invalid`. The raw kind is never
 * shown.
 *
 * @category forms/field/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/i18n/form-field-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxFieldErrors, CngxFormErrors, CNGX_ERROR_MESSAGES, provideFormFieldI18n
 */
export const CNGX_FORM_FIELD_I18N = new InjectionToken<Signal<CngxFormFieldI18n>>(
  'CngxFormFieldI18n',
  {
    providedIn: 'root',
    factory: () => formFieldBundle.build(),
  },
);

/**
 * Branded feature-fn for {@link provideFormFieldI18n}.
 *
 * @category forms/field/i18n
 * @since 0.1.0
 */
export type CngxFormFieldI18nFeature = ((
  bundle: Signal<CngxFormFieldI18n>,
) => Signal<CngxFormFieldI18n>) & {
  readonly _target: 'i18n';
};

/**
 * Override form-field labels via a partial bundle - unset keys keep the
 * language pack's copy, or the English default. `errorMessages` merges kind
 * by kind, so overriding `required` keeps the other built-in messages. Pass a
 * `Signal` to switch the language at runtime.
 *
 * The constraint hints are not taken here: `withConstraintHints(formatters)`
 * on `provideFormField` / `provideFormFieldAt` is the one override for them,
 * and the language pack's `formField.hint*` keys stay their copy source.
 *
 * @category forms/field/i18n
 * @since 0.1.0
 * @relatedTo provideFormFieldI18n, withConstraintHints
 */
export function withFormFieldI18nLabels(
  overrides: CngxFormFieldI18nOverrides | Signal<CngxFormFieldI18nOverrides>,
): CngxFormFieldI18nFeature {
  return Object.assign(
    (bundle: Signal<CngxFormFieldI18n>) =>
      createNestedOverrideMerge<CngxFormFieldI18n, 'errorMessages'>(
        bundle,
        overrides,
        'errorMessages',
      ),
    { _target: 'i18n' as const },
  );
}

/**
 * Provider for the form-field i18n bundle. Returns a plain `Provider`, so it
 * also scopes a subtree through `viewProviders`. The features apply on top of
 * the active language pack.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideFormFieldI18n(
 *       withFormFieldI18nLabels({ invalid: 'Ungueltiger Wert.' }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category forms/field/i18n
 * @since 0.1.0
 */
export function provideFormFieldI18n(...features: readonly CngxFormFieldI18nFeature[]): Provider {
  return {
    provide: CNGX_FORM_FIELD_I18N,
    useFactory: () => formFieldBundle.build(features),
  };
}

/**
 * Inject the resolved form-field i18n bundle. Read it inside a `computed()`,
 * template or handler so a language switch reaches the message.
 *
 * @category forms/field/i18n
 * @since 0.1.0
 */
export function injectFormFieldI18n(): Signal<CngxFormFieldI18n> {
  return formFieldBundle.resolve(inject(CNGX_FORM_FIELD_I18N));
}

/**
 * @internal The display text of one validation error: the registry entry for
 * its kind, its own `message`, the library message for its kind, then the
 * generic `invalid`. Never the raw kind.
 */
export function resolveErrorMessage(
  error: ValidationError.WithFieldTree,
  registry: ErrorMessageMap,
  i18n: CngxFormFieldI18n,
): string {
  const own = Object.hasOwn(registry, error.kind) ? registry[error.kind] : undefined;
  if (own) {
    return own(error);
  }
  if (error.message) {
    return error.message;
  }
  const builtIn = Object.hasOwn(i18n.errorMessages, error.kind)
    ? i18n.errorMessages[error.kind]
    : undefined;
  return builtIn ? builtIn(error) : i18n.invalid;
}
