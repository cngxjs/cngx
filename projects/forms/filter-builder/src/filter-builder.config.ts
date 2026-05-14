import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
  type Type,
} from '@angular/core';

import type { CngxFilterBuilderTemplates } from './filter-builder-slots';
import { DEFAULT_OPERATORS } from './filter-builder.types';
import type { FilterEditorType, FilterLogic } from './filter-builder.types';

export type { CngxFilterBuilderTemplates };

/**
 * Native-input sentinel union. When `CNGX_FILTER_BUILDER_CONFIG.editors`
 * maps a key to one of these strings, the filter-builder component (Phase
 * 5) renders the corresponding bare HTML input inline instead of mounting
 * a custom editor component — keeps the bundle lean for the three builtin
 * scalar types.
 */
export type CngxFilterNativeEditor = 'native:string' | 'native:number' | 'native:date';

/**
 * Editor-registry value type. Either one of the three native sentinels, or
 * a consumer-supplied component class (e.g. `CngxInput`, `CngxNumericInput`,
 * `CngxDatepickerInput`, or any structured custom editor).
 */
export type CngxFilterEditor = Type<unknown> | CngxFilterNativeEditor;

/** Narrowing helper for `CngxFilterEditor`. */
export function isNativeEditor(value: CngxFilterEditor): value is CngxFilterNativeEditor {
  return typeof value === 'string';
}

export interface CngxFilterBuilderGroupLabelContext {
  readonly logic: FilterLogic;
  readonly negated: boolean;
  readonly isRoot: boolean;
}

export interface CngxFilterBuilderExpressionLabelContext {
  readonly fieldLabel: string;
  readonly operator: string;
}

export interface CngxFilterBuilderAnnouncementFormatters {
  readonly filterAdded: (args: { fieldLabel: string }) => string;
  readonly filterRemoved: (args: { fieldLabel: string; operator: string; value: string }) => string;
  readonly groupAdded: () => string;
  readonly groupRemoved: () => string;
  readonly logicChanged: (args: { logic: FilterLogic }) => string;
  readonly groupNegated: () => string;
  readonly groupUnnegated: () => string;
  readonly fieldChanged: (args: { fieldLabel: string }) => string;
  readonly operatorChanged: (args: { operator: string }) => string;
  readonly valueChanged: (args: { value: string }) => string;
  readonly filtersCleared: () => string;
}

export interface CngxFilterBuilderI18n {
  readonly addFilter: string;
  readonly addGroup: string;
  readonly removeFilter: string;
  readonly removeGroup: string;
  readonly and: string;
  readonly or: string;
  readonly xor: string;
  readonly negate: string;
  readonly emptyState: string;
  readonly loading: string;
  readonly error: string;
  readonly retry: string;
  readonly operators: Readonly<Record<string, string>>;
  readonly groupLabel: (ctx: CngxFilterBuilderGroupLabelContext) => string;
  readonly expressionLabel: (ctx: CngxFilterBuilderExpressionLabelContext) => string;
  readonly unboundFilterLabel: string;
  readonly announcement: CngxFilterBuilderAnnouncementFormatters;
}

export interface CngxFilterBuilderConfig {
  readonly templates: CngxFilterBuilderTemplates;
  readonly i18n: CngxFilterBuilderI18n;
  readonly maxNestingDepth: number;
  readonly defaultOperators: Readonly<Record<FilterEditorType, readonly string[]>>;
  readonly logicOptions: readonly FilterLogic[];
  readonly negationEnabled: boolean;
}

const DEFAULT_I18N: CngxFilterBuilderI18n = Object.freeze({
  addFilter: 'Add filter',
  addGroup: 'Add group',
  removeFilter: 'Remove filter',
  removeGroup: 'Remove filter group',
  and: 'AND',
  or: 'OR',
  xor: 'XOR',
  negate: 'Negate',
  emptyState: 'No filters defined',
  loading: 'Loading filters',
  error: 'Could not load filters',
  retry: 'Retry',
  operators: Object.freeze({
    contains: 'Contains',
    eq: 'Equals',
    neq: 'Not equals',
    startsWith: 'Starts with',
    endsWith: 'Ends with',
    isEmpty: 'Is empty',
    isNotEmpty: 'Is not empty',
    gt: 'Greater than',
    gte: 'Greater than or equal',
    lt: 'Less than',
    lte: 'Less than or equal',
  }),
  groupLabel: ({ logic, negated, isRoot }: CngxFilterBuilderGroupLabelContext): string => {
    const upper = logic.toUpperCase();
    const negTag = negated ? ', negated' : '';
    const heading = isRoot ? 'Root filter group' : 'Filter group';
    return `${heading} (${upper}${negTag})`;
  },
  expressionLabel: ({ fieldLabel, operator }: CngxFilterBuilderExpressionLabelContext): string => {
    const op = operator || '(no operator)';
    return `Filter: ${fieldLabel} ${op}`;
  },
  unboundFilterLabel: 'Unbound filter',
  announcement: Object.freeze({
    filterAdded: ({ fieldLabel }: { fieldLabel: string }) => `Filter added: ${fieldLabel}`,
    filterRemoved: ({
      fieldLabel,
      operator,
      value,
    }: {
      fieldLabel: string;
      operator: string;
      value: string;
    }) => `Filter removed: ${fieldLabel} ${operator} ${value}`.trim().replace(/\s+/g, ' '),
    groupAdded: () => 'Filter group added',
    groupRemoved: () => 'Filter group removed',
    logicChanged: ({ logic }: { logic: FilterLogic }) => `Logic changed to ${logic.toUpperCase()}`,
    groupNegated: () => 'Group negated',
    groupUnnegated: () => 'Group un-negated',
    fieldChanged: ({ fieldLabel }: { fieldLabel: string }) => `Field changed to ${fieldLabel}`,
    operatorChanged: ({ operator }: { operator: string }) => `Operator changed to ${operator}`,
    valueChanged: ({ value }: { value: string }) =>
      value ? `Value changed to ${value}` : 'Value changed',
    filtersCleared: () => 'Filters cleared',
  }) as CngxFilterBuilderAnnouncementFormatters,
}) as CngxFilterBuilderI18n;

/** @internal Library defaults. English per `feedback_en_default_locale`. */
export const CNGX_FILTER_BUILDER_DEFAULTS: CngxFilterBuilderConfig = Object.freeze({
  templates: Object.freeze({}),
  i18n: DEFAULT_I18N,
  maxNestingDepth: 8,
  defaultOperators: DEFAULT_OPERATORS,
  logicOptions: Object.freeze(['and', 'or']) as readonly FilterLogic[],
  negationEnabled: false,
}) as CngxFilterBuilderConfig;

export const CNGX_FILTER_BUILDER_CONFIG = new InjectionToken<CngxFilterBuilderConfig>(
  'CngxFilterBuilderConfig',
  { factory: () => CNGX_FILTER_BUILDER_DEFAULTS },
);

const FILTER_BUILDER_FEATURE_BRAND: unique symbol = Symbol('CngxFilterBuilderConfigFeature');

export interface CngxFilterBuilderConfigFeature {
  readonly [FILTER_BUILDER_FEATURE_BRAND]: true;
  readonly apply: (config: CngxFilterBuilderConfig) => CngxFilterBuilderConfig;
}

function feature(
  apply: (config: CngxFilterBuilderConfig) => CngxFilterBuilderConfig,
): CngxFilterBuilderConfigFeature {
  return { [FILTER_BUILDER_FEATURE_BRAND]: true, apply };
}

export function withFilterBuilderI18n(
  partial: Partial<CngxFilterBuilderI18n>,
): CngxFilterBuilderConfigFeature {
  return feature((config) => ({
    ...config,
    i18n: {
      ...config.i18n,
      ...partial,
      operators: { ...config.i18n.operators, ...(partial.operators ?? {}) },
    },
  }));
}

export function withMaxNestingDepth(depth: number): CngxFilterBuilderConfigFeature {
  return feature((config) => ({ ...config, maxNestingDepth: depth }));
}

export function withDefaultOperators(
  operators: Readonly<Record<string, readonly string[]>>,
): CngxFilterBuilderConfigFeature {
  return feature((config) => ({
    ...config,
    defaultOperators: { ...config.defaultOperators, ...operators },
  }));
}

export function withLogicOptions(
  logics: readonly FilterLogic[],
): CngxFilterBuilderConfigFeature {
  return feature((config) => ({ ...config, logicOptions: logics }));
}

export function withNegation(enabled: boolean): CngxFilterBuilderConfigFeature {
  return feature((config) => ({ ...config, negationEnabled: enabled }));
}

export function withTemplates(
  templates: CngxFilterBuilderTemplates,
): CngxFilterBuilderConfigFeature {
  return feature((config) => ({
    ...config,
    templates: { ...config.templates, ...templates },
  }));
}

function buildConfig(
  features: readonly CngxFilterBuilderConfigFeature[],
): CngxFilterBuilderConfig {
  let config = CNGX_FILTER_BUILDER_DEFAULTS;
  for (const feat of features) {
    config = feat.apply(config);
  }
  return config;
}

export function provideFilterBuilderConfig(
  ...features: CngxFilterBuilderConfigFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CNGX_FILTER_BUILDER_CONFIG,
      useValue: buildConfig(features),
    },
  ]);
}

export function provideFilterBuilderConfigAt(
  ...features: CngxFilterBuilderConfigFeature[]
): Provider[] {
  return [
    {
      provide: CNGX_FILTER_BUILDER_CONFIG,
      useValue: buildConfig(features),
    },
  ];
}

export function injectFilterBuilderConfig(): CngxFilterBuilderConfig {
  return inject(CNGX_FILTER_BUILDER_CONFIG);
}
