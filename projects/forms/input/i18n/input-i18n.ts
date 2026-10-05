import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import {
  coerceSignal,
  createNestedOverrideMerge,
  injectLocale,
  type CngxNestedOverrides,
} from '@cngx/core/utils';
import { recordEqual } from '@cngx/utils';

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

const LABELS = new WeakMap<CngxInputLanguageSection, Map<string, CngxResolvedInputAriaLabels>>();

/**
 * @internal The labels of one section object and locale, built once: equal
 * inputs give the identical object, so readers compare by reference.
 */
function labelsOf(section: CngxInputLanguageSection, locale: string): CngxResolvedInputAriaLabels {
  let byLocale = LABELS.get(section);
  if (!byLocale) {
    byLocale = new Map();
    LABELS.set(section, byLocale);
  }
  let labels = byLocale.get(locale);
  if (!labels) {
    labels = inputLabelsFrom(section, locale);
    byLocale.set(locale, labels);
  }
  return labels;
}

const NO_SECTION: CngxNestedOverrides<CngxInputLanguageSection, 'passwordStrengthLevel'> = {};

/**
 * @internal The input section of the active language pack over the English
 * section, resolved once per injector so every input reads the same signal.
 */
const INPUT_LANGUAGE = new InjectionToken<Signal<CngxInputLanguageSection>>('CngxInputLanguage', {
  providedIn: 'root',
  factory: () => {
    const pack = injectLanguageSection('input');
    return createNestedOverrideMerge<CngxInputLanguageSection, 'passwordStrengthLevel'>(
      CNGX_INPUT_LANGUAGE_EN,
      computed(() => pack() ?? NO_SECTION),
      'passwordStrengthLevel',
    );
  },
});

/**
 * @internal The input section of the active language pack over English.
 * Injection context required.
 */
export function injectInputLanguage(): Signal<CngxInputLanguageSection> {
  return inject(INPUT_LANGUAGE);
}

const SITE_LABELS = new WeakMap<
  Signal<CngxInputLanguageSection>,
  WeakMap<Signal<string>, Signal<CngxResolvedInputAriaLabels>>
>();

/**
 * @internal The section labels at the reading site: the active pack's input
 * section formatted for the locale of the injector that reads it, so a
 * `provideLocaleAt` subtree formats its own numbers. Memoized per section and
 * locale signal. Injection context required.
 */
export function injectInputSectionLabels(): Signal<CngxResolvedInputAriaLabels> {
  const language = injectInputLanguage();
  const locale = injectLocale();
  let byLocale = SITE_LABELS.get(language);
  if (!byLocale) {
    byLocale = new WeakMap();
    SITE_LABELS.set(language, byLocale);
  }
  let labels = byLocale.get(locale);
  if (!labels) {
    labels = computed(() => labelsOf(language(), locale()));
    byLocale.set(locale, labels);
  }
  return labels;
}

const NO_OVERRIDES: object = {};

const FILLS = new WeakMap<
  Signal<CngxResolvedInputAriaLabels>,
  WeakMap<object, Signal<CngxResolvedInputAriaLabels>>
>();

/**
 * @internal The config overrides spread over the section labels; a key an
 * override leaves `undefined` reads the section. Memoized per (section labels,
 * override source); keeps its reference while the result is key-wise equal.
 */
export function fillInputLabels(
  defaults: Signal<CngxResolvedInputAriaLabels>,
  overrides: Partial<InputAriaLabels> | Signal<Partial<InputAriaLabels>> | undefined,
): Signal<CngxResolvedInputAriaLabels> {
  let byOverrides = FILLS.get(defaults);
  if (!byOverrides) {
    byOverrides = new WeakMap();
    FILLS.set(defaults, byOverrides);
  }
  const key: object = overrides ?? NO_OVERRIDES;
  const cached = byOverrides.get(key);
  if (cached) {
    return cached;
  }
  if (!overrides) {
    byOverrides.set(key, defaults);
    return defaults;
  }
  const user = coerceSignal<Partial<InputAriaLabels>>(overrides);
  const filled = computed<CngxResolvedInputAriaLabels>(
    () => {
      const base = defaults();
      const value: Record<string, unknown> = { ...base };
      for (const [name, override] of Object.entries(user())) {
        if (override !== undefined) {
          value[name] = override;
        }
      }
      return value as unknown as CngxResolvedInputAriaLabels;
    },
    { equal: recordEqual },
  );
  byOverrides.set(key, filled);
  return filled;
}
