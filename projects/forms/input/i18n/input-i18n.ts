import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import {
  coerceSignal,
  createNestedOverrideMerge,
  createOverrideMerge,
  type CngxNestedOverrides,
} from '@cngx/core/utils';

import type { InputAriaLabels } from '../input-config';
import { CNGX_INPUT_LANGUAGE_EN, type CngxInputLanguageSection } from './input-language-section';

/**
 * The `CNGX_INPUT_CONFIG` labels with every key filled.
 *
 * @internal
 */
export type CngxResolvedInputAriaLabels = Required<InputAriaLabels>;

/** @internal Turns an input section into the config label keys for a locale. Pure. */
export function inputLabelsFrom(
  section: CngxInputLanguageSection,
  locale: string,
): CngxResolvedInputAriaLabels {
  return {
    clear: section.clear,
    otpGroup: section.otpGroup,
    otpSlot: (index, length) =>
      formatMessage(section.otpSlot, { position: index + 1, count: length }, locale),
    otpComplete: section.otpComplete,
    copySuccess: section.copySuccess,
    copyError: section.copyError,
    fileDropZone: section.fileDropZone,
    capsLockOn: section.capsLockOn,
    passwordStrength: (level) => formatMessage(section.passwordStrength, { level }, locale),
    passwordStrengthLevel: (level) => section.passwordStrengthLevel[level],
    inputRejected: section.inputRejected,
    sensitiveReveal: section.sensitiveReveal,
    sensitiveHide: section.sensitiveHide,
    ratingValue: (value, max) => formatMessage(section.ratingValue, { value, max }, locale),
    ratingItem: (step, max) => formatMessage(section.ratingItem, { step, max }, locale),
    phoneCountry: section.phoneCountry,
    phoneCountryOption: (dialCode, country) =>
      formatMessage(section.phoneCountryOption, { dialCode, country }, locale),
    charCountMax: (current, max) => formatMessage(section.charCountMax, { current, max }, locale),
    charCountMin: (current, min) => formatMessage(section.charCountMin, { current, min }, locale),
  };
}

const NO_SECTION: CngxNestedOverrides<CngxInputLanguageSection, 'passwordStrengthLevel'> = {};

/**
 * @internal The input section of the active pack over the English section;
 * `passwordStrengthLevel` merges key by key.
 */
function injectInputLanguage(): Signal<CngxInputLanguageSection> {
  const pack = injectLanguageSection('input');
  return createNestedOverrideMerge<CngxInputLanguageSection, 'passwordStrengthLevel'>(
    CNGX_INPUT_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
    'passwordStrengthLevel',
  );
}

/** @internal Builds and reads the section labels, formatted for the reading locale. */
const inputBundle = createSectionBundle<CngxInputLanguageSection, CngxResolvedInputAriaLabels>({
  section: injectInputLanguage,
  toBundle: inputLabelsFrom,
});

/**
 * @internal The input section labels of the active pack, formatted for the app
 * locale. Private: consumers override copy through `withInputAriaLabels`.
 */
const INPUT_SECTION_LABELS = new InjectionToken<Signal<CngxResolvedInputAriaLabels>>(
  'CngxInputSectionLabels',
  { providedIn: 'root', factory: () => inputBundle.build() },
);

/**
 * @internal The section labels at the reading site: the active pack's input
 * section formatted for the locale of the injector that reads it, so a
 * `provideLocaleAt` subtree formats its own numbers. Injection context
 * required.
 */
export function injectInputSectionLabels(): Signal<CngxResolvedInputAriaLabels> {
  return inputBundle.resolve(inject(INPUT_SECTION_LABELS));
}

const DEFINED = new WeakMap<object, Signal<Partial<InputAriaLabels>>>();

/**
 * @internal The override source without the keys it sets to `undefined`, so
 * the merge reads the section for them. Memoized per source.
 */
function definedOverrides(
  source: Partial<InputAriaLabels> | Signal<Partial<InputAriaLabels>>,
): Signal<Partial<InputAriaLabels>> {
  let defined = DEFINED.get(source);
  if (!defined) {
    const overrides = coerceSignal(source);
    defined = computed(() =>
      Object.fromEntries(Object.entries(overrides()).filter(([, value]) => value !== undefined)),
    );
    DEFINED.set(source, defined);
  }
  return defined;
}

/**
 * @internal The input labels at the reading site with the `CNGX_INPUT_CONFIG`
 * labels on top. A key the config sets wins; a key it leaves unset or
 * `undefined` reads the section. Injection context required.
 */
export function injectInputLabels(
  overrides: Partial<InputAriaLabels> | Signal<Partial<InputAriaLabels>> | undefined,
): Signal<CngxResolvedInputAriaLabels> {
  return createOverrideMerge<CngxResolvedInputAriaLabels>(
    injectInputSectionLabels(),
    overrides && definedOverrides(overrides),
  );
}
