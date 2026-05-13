import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
  type TemplateRef,
  type Type,
} from '@angular/core';
import { CngxToggle } from '@cngx/common/interactive';

import { DEFAULT_OPERATORS } from './filter-builder.types';
import type { FilterEditorType, FilterLogic } from './filter-builder.types';

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
  readonly operators: Readonly<Record<string, string>>;
}

export type CngxFilterBuilderTemplates = Readonly<Record<string, TemplateRef<unknown> | null>>;

export interface CngxFilterBuilderConfig {
  readonly templates: CngxFilterBuilderTemplates;
  readonly i18n: CngxFilterBuilderI18n;
  readonly editors: ReadonlyMap<string, CngxFilterEditor>;
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
}) as CngxFilterBuilderI18n;

function buildDefaultEditors(): ReadonlyMap<string, CngxFilterEditor> {
  const map = new Map<string, CngxFilterEditor>();
  map.set('string', 'native:string');
  map.set('number', 'native:number');
  map.set('date', 'native:date');
  map.set('boolean', CngxToggle);
  return map;
}

/** @internal Library defaults. English per `feedback_en_default_locale`. */
export const CNGX_FILTER_BUILDER_DEFAULTS: CngxFilterBuilderConfig = Object.freeze({
  templates: Object.freeze({}),
  i18n: DEFAULT_I18N,
  editors: buildDefaultEditors(),
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

export function withEditors(
  editors: Readonly<Record<string, CngxFilterEditor>>,
): CngxFilterBuilderConfigFeature {
  return feature((config) => {
    const next = new Map(config.editors);
    for (const [key, value] of Object.entries(editors)) {
      next.set(key, value);
    }
    return { ...config, editors: next };
  });
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
