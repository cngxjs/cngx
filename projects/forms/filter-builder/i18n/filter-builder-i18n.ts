import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import {
  coerceSignal,
  createNestedOverrideMerge,
  injectLocale,
  type CngxNestedOverrides,
} from '@cngx/core/utils';
import { recordEqual } from '@cngx/utils';

import type {
  CngxFilterBuilderAnnouncementFormatters,
  CngxFilterBuilderI18n,
} from '../filter-builder.config';
import type { FilterLogic } from '../filter-builder.types';
import {
  CNGX_FILTER_BUILDER_LANGUAGE_EN,
  type CngxFilterBuilderLanguageSection,
} from './filter-builder-language-section';

/**
 * The `CNGX_FILTER_BUILDER_CONFIG` i18n bundle with every key filled.
 *
 * @internal
 */
export type CngxResolvedFilterBuilderI18n = Required<CngxFilterBuilderI18n>;

/** @internal The label of an operator key that the caller did not label. Never the raw key. */
function operatorWord(
  section: CngxFilterBuilderLanguageSection,
  operator: string,
  operatorLabel: string | undefined,
): string {
  if (operatorLabel !== undefined) {
    return operatorLabel;
  }
  if (!operator) {
    return '';
  }
  return section.operators[operator] ?? section.unnamedOperator;
}

/** @internal The logic word the caller passed, else the section's word for the logic key. */
function logicWord(
  section: CngxFilterBuilderLanguageSection,
  logic: FilterLogic,
  logicLabel: string | undefined,
): string {
  return logicLabel ?? section[logic];
}

/** @internal Builds the announcement formatters from the section's messages. */
function announcementFrom(
  section: CngxFilterBuilderLanguageSection,
  locale: string,
): CngxFilterBuilderAnnouncementFormatters {
  return {
    filterAdded: ({ fieldLabel }) =>
      formatMessage(section.announceFilterAdded, { field: fieldLabel }, locale),
    filterRemoved: ({ fieldLabel, operator, value, operatorLabel }) => {
      const field = fieldLabel;
      const op = operatorWord(section, operator, operatorLabel);
      if (op && value) {
        return formatMessage(section.announceFilterRemoved, { field, operator: op, value }, locale);
      }
      if (op) {
        return formatMessage(section.announceFilterRemovedNoValue, { field, operator: op }, locale);
      }
      if (value) {
        return formatMessage(section.announceFilterRemovedNoOperator, { field, value }, locale);
      }
      return formatMessage(section.announceFilterRemovedFieldOnly, { field }, locale);
    },
    groupAdded: () => section.announceGroupAdded,
    groupRemoved: () => section.announceGroupRemoved,
    logicChanged: ({ logic, logicLabel }) =>
      formatMessage(
        section.announceLogicChanged,
        { logic: logicWord(section, logic, logicLabel) },
        locale,
      ),
    groupNegated: () => section.announceGroupNegated,
    groupUnnegated: () => section.announceGroupUnnegated,
    fieldChanged: ({ fieldLabel }) =>
      formatMessage(section.announceFieldChanged, { field: fieldLabel }, locale),
    operatorChanged: ({ operator, operatorLabel }) =>
      formatMessage(
        section.announceOperatorChanged,
        { operator: operatorWord(section, operator, operatorLabel) },
        locale,
      ),
    valueChanged: ({ value }) =>
      value
        ? formatMessage(section.announceValueChanged, { value }, locale)
        : section.announceValueChangedNoValue,
    filtersCleared: () => section.announceFiltersCleared,
  };
}

/** @internal Turns a filter-builder section into the config i18n bundle for a locale. Pure. */
export function filterBuilderI18nFrom(
  section: CngxFilterBuilderLanguageSection,
  locale: string,
): CngxResolvedFilterBuilderI18n {
  return {
    addFilter: section.addFilter,
    addGroup: section.addGroup,
    removeFilter: section.removeFilter,
    removeGroup: section.removeGroup,
    and: section.and,
    or: section.or,
    xor: section.xor,
    logicLabel: section.logicLabel,
    negate: section.negate,
    emptyState: section.emptyState,
    operators: section.operators,
    unnamedOperator: section.unnamedOperator,
    groupLabel: ({ logic, negated, isRoot, logicLabel, negatedTag }) => {
      const args = {
        logic: logicWord(section, logic, logicLabel),
        negated: negatedTag ?? section.negatedTag,
      };
      if (isRoot) {
        return formatMessage(
          negated ? section.rootGroupLabelNegated : section.rootGroupLabel,
          args,
          locale,
        );
      }
      return formatMessage(negated ? section.groupLabelNegated : section.groupLabel, args, locale);
    },
    expressionLabel: ({ fieldLabel, operator, operatorLabel }) =>
      formatMessage(
        section.expressionLabel,
        {
          field: fieldLabel,
          operator: operatorWord(section, operator, operatorLabel) || section.noOperator,
        },
        locale,
      ),
    unboundFilterLabel: section.unboundFilterLabel,
    announcement: announcementFrom(section, locale),
    negatedTag: section.negatedTag,
    booleanTrue: section.booleanTrue,
    booleanFalse: section.booleanFalse,
    quotedValue: (value) => formatMessage(section.quotedValue, { value }, locale),
  };
}

const BUNDLES = new WeakMap<
  CngxFilterBuilderLanguageSection,
  Map<string, CngxResolvedFilterBuilderI18n>
>();

/**
 * @internal The bundle of one section object and locale, built once: equal
 * inputs give the identical object, so readers compare by reference.
 */
function bundleOf(
  section: CngxFilterBuilderLanguageSection,
  locale: string,
): CngxResolvedFilterBuilderI18n {
  let byLocale = BUNDLES.get(section);
  if (!byLocale) {
    byLocale = new Map();
    BUNDLES.set(section, byLocale);
  }
  let bundle = byLocale.get(locale);
  if (!bundle) {
    bundle = filterBuilderI18nFrom(section, locale);
    byLocale.set(locale, bundle);
  }
  return bundle;
}

const NO_SECTION: CngxNestedOverrides<CngxFilterBuilderLanguageSection, 'operators'> = {};

/**
 * @internal The filter-builder section of the active language pack over the
 * English section, resolved once per injector so every builder reads the same
 * signal.
 */
const FILTER_BUILDER_LANGUAGE = new InjectionToken<Signal<CngxFilterBuilderLanguageSection>>(
  'CngxFilterBuilderLanguage',
  {
    providedIn: 'root',
    factory: () => {
      const pack = injectLanguageSection('filterBuilder');
      return createNestedOverrideMerge<CngxFilterBuilderLanguageSection, 'operators'>(
        CNGX_FILTER_BUILDER_LANGUAGE_EN,
        computed(() => pack() ?? NO_SECTION),
        'operators',
      );
    },
  },
);

/**
 * @internal The filter-builder section of the active language pack over
 * English. Injection context required.
 */
export function injectFilterBuilderLanguage(): Signal<CngxFilterBuilderLanguageSection> {
  return inject(FILTER_BUILDER_LANGUAGE);
}

const SITE_BUNDLES = new WeakMap<
  Signal<CngxFilterBuilderLanguageSection>,
  WeakMap<Signal<string>, Signal<CngxResolvedFilterBuilderI18n>>
>();

/**
 * @internal The section bundle at the reading site: the active pack's
 * filter-builder section formatted for the locale of the injector that reads
 * it, so a `provideLocaleAt` subtree formats with its own locale. Memoized per
 * section and locale signal. Injection context required.
 */
export function injectFilterBuilderSectionI18n(): Signal<CngxResolvedFilterBuilderI18n> {
  const language = injectFilterBuilderLanguage();
  const locale = injectLocale();
  let byLocale = SITE_BUNDLES.get(language);
  if (!byLocale) {
    byLocale = new WeakMap();
    SITE_BUNDLES.set(language, byLocale);
  }
  let bundle = byLocale.get(locale);
  if (!bundle) {
    bundle = computed(() => bundleOf(language(), locale()));
    byLocale.set(locale, bundle);
  }
  return bundle;
}

const NO_OVERRIDES: object = {};

const FILLS = new WeakMap<
  Signal<CngxResolvedFilterBuilderI18n>,
  WeakMap<object, Signal<CngxResolvedFilterBuilderI18n>>
>();

/** @internal Key-wise equality with the record under `key` compared key by key. */
function nestedRecordEqual<T extends object>(key: keyof T): (a: T, b: T) => boolean {
  return (a, b) =>
    recordEqual({ ...a, [key]: undefined }, { ...b, [key]: undefined }) &&
    recordEqual(a[key] as object, b[key] as object);
}

const bundleEqual = nestedRecordEqual<CngxResolvedFilterBuilderI18n>('operators');

/**
 * @internal The config overrides spread over the section bundle; a key an
 * override leaves `undefined` reads the section, and `operators` merges key by
 * key. `announcement` is replaced as a whole. Memoized per (section bundle,
 * override source); keeps its reference while the result is equal.
 */
export function fillFilterBuilderI18n(
  defaults: Signal<CngxResolvedFilterBuilderI18n>,
  overrides: Partial<CngxFilterBuilderI18n> | Signal<Partial<CngxFilterBuilderI18n>> | undefined,
): Signal<CngxResolvedFilterBuilderI18n> {
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
  const user = coerceSignal<Partial<CngxFilterBuilderI18n>>(overrides);
  const filled = computed<CngxResolvedFilterBuilderI18n>(
    () => {
      const base = defaults();
      const value: Record<string, unknown> = { ...base };
      for (const [name, override] of Object.entries(user())) {
        if (override !== undefined && name !== 'operators') {
          value[name] = override;
        }
      }
      const operators: Record<string, string> = { ...base.operators };
      for (const [name, label] of Object.entries(user().operators ?? {})) {
        if (label !== undefined) {
          operators[name] = label;
        }
      }
      value['operators'] = operators;
      return value as unknown as CngxResolvedFilterBuilderI18n;
    },
    { equal: bundleEqual },
  );
  byOverrides.set(key, filled);
  return filled;
}
