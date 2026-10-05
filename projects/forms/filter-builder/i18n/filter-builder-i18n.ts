import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { createSectionBundle, formatMessage, injectLanguageSection } from '@cngx/core/i18n';
import {
  coerceSignal,
  createNestedOverrideMerge,
  type CngxNestedOverrides,
} from '@cngx/core/utils';

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

const NO_SECTION: CngxNestedOverrides<CngxFilterBuilderLanguageSection, 'operators'> = {};

/**
 * @internal The filter-builder section of the active pack over the English
 * section; `operators` merges key by key.
 */
function injectFilterBuilderLanguage(): Signal<CngxFilterBuilderLanguageSection> {
  const pack = injectLanguageSection('filterBuilder');
  return createNestedOverrideMerge<CngxFilterBuilderLanguageSection, 'operators'>(
    CNGX_FILTER_BUILDER_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
    'operators',
  );
}

/** @internal Builds and reads the section bundle, formatted for the reading locale. */
const filterBuilderBundle = createSectionBundle<
  CngxFilterBuilderLanguageSection,
  CngxResolvedFilterBuilderI18n
>({
  section: injectFilterBuilderLanguage,
  toBundle: filterBuilderI18nFrom,
});

/**
 * @internal The filter-builder section bundle of the active pack, formatted
 * for the app locale. Private: consumers override copy through
 * `withFilterBuilderI18n`.
 */
const FILTER_BUILDER_SECTION_I18N = new InjectionToken<Signal<CngxResolvedFilterBuilderI18n>>(
  'CngxFilterBuilderSectionI18n',
  { providedIn: 'root', factory: () => filterBuilderBundle.build() },
);

/**
 * @internal The section bundle at the reading site: the active pack's
 * filter-builder section formatted for the locale of the injector that reads
 * it, so a `provideLocaleAt` subtree formats with its own locale. Injection
 * context required.
 */
export function injectFilterBuilderSectionI18n(): Signal<CngxResolvedFilterBuilderI18n> {
  return filterBuilderBundle.resolve(inject(FILTER_BUILDER_SECTION_I18N));
}

type CngxFilterBuilderOverrides = CngxNestedOverrides<CngxResolvedFilterBuilderI18n, 'operators'>;

/** @internal `record` without the keys it sets to `undefined`. */
function withoutUndefined<T extends object>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T;
}

const DEFINED = new WeakMap<object, Signal<CngxFilterBuilderOverrides>>();

/**
 * @internal The override source without the keys it sets to `undefined`, at
 * the top level and inside `operators`, so the merge reads the section for
 * them. Memoized per source.
 */
function definedOverrides(
  source: Partial<CngxFilterBuilderI18n> | Signal<Partial<CngxFilterBuilderI18n>>,
): Signal<CngxFilterBuilderOverrides> {
  let defined = DEFINED.get(source);
  if (!defined) {
    const overrides = coerceSignal(source);
    defined = computed(() => {
      const { operators, ...rest } = overrides();
      const top: CngxFilterBuilderOverrides = withoutUndefined(rest);
      return operators ? { ...top, operators: withoutUndefined(operators) } : top;
    });
    DEFINED.set(source, defined);
  }
  return defined;
}

/**
 * @internal The filter-builder bundle at the reading site with the config
 * overrides on top. A key an override sets wins; a key it leaves unset or
 * `undefined` reads the section; `operators` merges key by key and
 * `announcement` is replaced as a whole. Injection context required.
 */
export function injectFilterBuilderSiteI18n(
  overrides: Partial<CngxFilterBuilderI18n> | Signal<Partial<CngxFilterBuilderI18n>> | undefined,
): Signal<CngxResolvedFilterBuilderI18n> {
  return createNestedOverrideMerge<CngxResolvedFilterBuilderI18n, 'operators'>(
    injectFilterBuilderSectionI18n(),
    overrides && definedOverrides(overrides),
    'operators',
  );
}
