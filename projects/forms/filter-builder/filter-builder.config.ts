import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
  type Signal,
  type Type,
} from '@angular/core';
import { createNestedOverrideMerge } from '@cngx/core/utils';

import type { CngxFilterEditorComponent } from './filter-builder-editor.contract';
import { fillFilterBuilderI18n, injectFilterBuilderSectionI18n } from './i18n/filter-builder-i18n';
import {
  CNGX_FILTER_BUILTIN_OPERATOR_DEFS,
  type CngxFilterOperatorDef,
} from './filter-builder-operators';
import type { CngxFilterBuilderTemplates } from './filter-builder-slots';
import { DEFAULT_OPERATORS } from './filter-builder.types';
import type { FilterEditorType, FilterLogic } from './filter-builder.types';

export type { CngxFilterBuilderTemplates };

/**
 * Native-input sentinel union. When `CNGX_FILTER_BUILDER_CONFIG.editors`
 * maps a key to one of these strings, the filter-builder component (Phase
 * 5) renders the corresponding bare HTML input inline instead of mounting
 * a custom editor component - keeps the bundle lean for the three builtin
 * scalar types.
 *
 * @category forms/filter-builder/config
 */
export type CngxFilterNativeEditor =
  | 'native:string'
  | 'native:number'
  | 'native:date'
  | 'native:boolean';

/**
 * Editor-registry value type. Either one of the three native sentinels, or
 * a consumer-supplied component class implementing
 * {@link CngxFilterEditorComponent} (e.g. `CngxInput`, `CngxNumericInput`,
 * `CngxDatepickerInput`, or any structured custom editor).
 *
 * @category forms/filter-builder/config
 */
export type CngxFilterEditor = Type<CngxFilterEditorComponent<unknown>> | CngxFilterNativeEditor;

/**
 * Narrowing helper for `CngxFilterEditor`.
 *
 * @category forms/filter-builder/config
 */
export function isNativeEditor(value: CngxFilterEditor): value is CngxFilterNativeEditor {
  return typeof value === 'string';
}

/** Context passed to `i18n.groupLabel` when building the group's accessible label. */
export interface CngxFilterBuilderGroupLabelContext {
  readonly logic: FilterLogic;
  readonly negated: boolean;
  readonly isRoot: boolean;
  /** Translated logic word (`i18n.and` / `or` / `xor`); `logic` stays the raw key. */
  readonly logicLabel?: string;
  /** Translated negation marker (`i18n.negatedTag`). */
  readonly negatedTag?: string;
}

/** Context passed to `i18n.expressionLabel` when building an expression row's accessible label. */
export interface CngxFilterBuilderExpressionLabelContext {
  readonly fieldLabel: string;
  readonly operator: string;
  /** Translated operator label (`i18n.operators[operator]`); `operator` stays the raw key. */
  readonly operatorLabel?: string;
}

/**
 * Per-mutation message factories the announcer feeds into the live-region `Signal<string>`.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterBuilderAnnouncementFormatters {
  readonly filterAdded: (args: { fieldLabel: string }) => string;
  readonly filterRemoved: (args: {
    fieldLabel: string;
    operator: string;
    value: string;
    operatorLabel?: string;
  }) => string;
  readonly groupAdded: () => string;
  readonly groupRemoved: () => string;
  readonly logicChanged: (args: { logic: FilterLogic; logicLabel?: string }) => string;
  readonly groupNegated: () => string;
  readonly groupUnnegated: () => string;
  readonly fieldChanged: (args: { fieldLabel: string }) => string;
  readonly operatorChanged: (args: { operator: string; operatorLabel?: string }) => string;
  readonly valueChanged: (args: { value: string }) => string;
  readonly filtersCleared: () => string;
}

/**
 * Locale bundle - button copy, operator labels, group/expression label
 * factories, announcer formatters. Unset keys read the `filterBuilder`
 * section of the active language pack (`CNGX_FILTER_BUILDER_LANGUAGE_EN` by
 * default); set keys through {@link withFilterBuilderI18n}.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterBuilderI18n {
  readonly addFilter: string;
  readonly addGroup: string;
  readonly removeFilter: string;
  readonly removeGroup: string;
  readonly and: string;
  readonly or: string;
  readonly xor: string;
  /** Accessible name of the per-group logic radiogroup (segmented AND/OR/XOR control). */
  readonly logicLabel: string;
  readonly negate: string;
  readonly emptyState: string;
  readonly operators: Readonly<Record<string, string>>;
  /**
   * Label of an operator key that has neither an `operators` entry nor a
   * definition `label`. The raw key is never shown or announced. Default:
   * `'Unnamed operator'`.
   */
  readonly unnamedOperator: string;
  readonly groupLabel: (ctx: CngxFilterBuilderGroupLabelContext) => string;
  readonly expressionLabel: (ctx: CngxFilterBuilderExpressionLabelContext) => string;
  readonly unboundFilterLabel: string;
  readonly announcement: CngxFilterBuilderAnnouncementFormatters;
  /** Negation marker in the group label. Default: `'negated'`. */
  readonly negatedTag?: string;
  /** Spoken form of a `true` filter value in announcements. Default: `'true'`. */
  readonly booleanTrue?: string;
  /** Spoken form of a `false` filter value in announcements. Default: `'false'`. */
  readonly booleanFalse?: string;
  /**
   * A text filter value in announcements, quoted in the language's quotation
   * marks. Default: `'"{value}"'`.
   */
  readonly quotedValue: (value: string) => string;
}

/**
 * Resolved runtime config - produced by composing `withX(...)` features through `provideFilterBuilderConfig(...)`.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterBuilderConfig {
  readonly templates: CngxFilterBuilderTemplates;
  /**
   * Copy overrides. Unset keys read the `filterBuilder` section of the active
   * language pack; read the resolved bundle with `injectFilterBuilderI18n()`.
   * Holds a `Signal` once `withFilterBuilderI18n` ran.
   */
  readonly i18n?: Partial<CngxFilterBuilderI18n> | Signal<Partial<CngxFilterBuilderI18n>>;
  readonly maxNestingDepth: number;
  readonly defaultOperators: Readonly<Record<FilterEditorType, readonly string[]>>;
  readonly operators: ReadonlyMap<string, CngxFilterOperatorDef>;
  readonly caseInsensitive: boolean;
  readonly logicOptions: readonly FilterLogic[];
  readonly negationEnabled: boolean;
}

/**
 * @internal Library defaults. The copy is not here: it reads the
 * `filterBuilder` language section at the reading site.
 */
export const CNGX_FILTER_BUILDER_DEFAULTS: CngxFilterBuilderConfig = Object.freeze({
  templates: Object.freeze({}),
  maxNestingDepth: 8,
  defaultOperators: DEFAULT_OPERATORS,
  operators: CNGX_FILTER_BUILTIN_OPERATOR_DEFS,
  caseInsensitive: false,
  logicOptions: Object.freeze(['and', 'or']) as readonly FilterLogic[],
  negationEnabled: false,
}) as CngxFilterBuilderConfig;

/**
 * Resolved `CngxFilterBuilderConfig` every `<cngx-filter-builder>` in scope
 * reads for its defaults. Each slice comes from one `with*` feature:
 *
 * - templates - `withTemplates`
 * - i18n bundle - `withFilterBuilderI18n`
 * - max nesting depth - `withMaxNestingDepth` (default 8)
 * - operator lists per editor type - `withDefaultOperators`
 * - operator definitions (evaluate + label + valueless) - `withOperators` (default: the 14 builtins)
 * - case-insensitive substring matching - `withCaseInsensitiveStrings` (default off)
 * - logic options (the and/or/xor picker) - `withLogicOptions` (default `['and', 'or']`)
 * - negation toggle - `withNegation` (default off)
 *
 * Provide it through one of two entry points, never the token directly:
 *
 * - `provideFilterBuilderConfig(...)` returns `EnvironmentProviders` - for an
 *   environment injector (app bootstrap or a lazy route).
 * - `provideFilterBuilderConfigAt(...)` returns `Provider[]` - for a component's
 *   `providers` / `viewProviders`.
 *
 * Resolution is nearest-wins and replace, not merge: a nested provider shadows
 * the ancestor config for its subtree rather than deep-merging into it. The
 * default factory returns `CNGX_FILTER_BUILDER_DEFAULTS`. Editors are separate -
 * swap them via `CNGX_FILTER_EDITORS`, not here.
 *
 * @category forms/filter-builder/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder.config.ts
 * @since 0.1.0
 * @relatedTo provideFilterBuilderConfig, provideFilterBuilderConfigAt, withTemplates, withFilterBuilderI18n, withMaxNestingDepth, withDefaultOperators, withOperators, withCaseInsensitiveStrings, withLogicOptions, withNegation, CNGX_FILTER_EDITORS
 */
export const CNGX_FILTER_BUILDER_CONFIG = new InjectionToken<CngxFilterBuilderConfig>(
  'CngxFilterBuilderConfig',
  { factory: () => CNGX_FILTER_BUILDER_DEFAULTS },
);

/** @internal - shared empty bundle for the first `withFilterBuilderI18n` merge. */
const NO_I18N: Partial<CngxFilterBuilderI18n> = {};

/** @internal */
const FILTER_BUILDER_FEATURE_BRAND: unique symbol = Symbol('CngxFilterBuilderConfigFeature');

/**
 * Branded config feature produced by `withX(...)` helpers. Opaque to consumers; only `provideFilterBuilderConfig` reads `.apply`.
 *
 * @category forms/filter-builder/config
 */
export interface CngxFilterBuilderConfigFeature {
  readonly [FILTER_BUILDER_FEATURE_BRAND]: true;
  readonly apply: (config: CngxFilterBuilderConfig) => CngxFilterBuilderConfig;
}

/** @internal */
function feature(
  apply: (config: CngxFilterBuilderConfig) => CngxFilterBuilderConfig,
): CngxFilterBuilderConfigFeature {
  return { [FILTER_BUILDER_FEATURE_BRAND]: true, apply };
}

/**
 * Override any subset of the i18n bundle. Unset keys read the `filterBuilder`
 * section of the active language pack, and the overrides apply on top of it.
 * `operators` merges key by key; `announcement` is replaced as a whole. Pass a
 * `Signal` to switch the copy at runtime; the merge then follows it.
 *
 * @category forms/filter-builder/config
 */
export function withFilterBuilderI18n(
  partial: Partial<CngxFilterBuilderI18n> | Signal<Partial<CngxFilterBuilderI18n>>,
): CngxFilterBuilderConfigFeature {
  return feature((config) => ({
    ...config,
    i18n: createNestedOverrideMerge<Partial<CngxFilterBuilderI18n>, 'operators'>(
      config.i18n ?? NO_I18N,
      partial,
      'operators',
    ),
  }));
}

/**
 * Cap the nesting depth of the builder tree. Default 8.
 *
 * @category forms/filter-builder/config
 */
export function withMaxNestingDepth(depth: number): CngxFilterBuilderConfigFeature {
  return feature((config) => ({ ...config, maxNestingDepth: depth }));
}

/**
 * Extend or override the default operator lists keyed by editor type.
 *
 * @category forms/filter-builder/config
 */
export function withDefaultOperators(
  operators: Readonly<Record<string, readonly string[]>>,
): CngxFilterBuilderConfigFeature {
  return feature((config) => ({
    ...config,
    defaultOperators: { ...config.defaultOperators, ...operators },
  }));
}

/**
 * Register operator definitions - the one surface where an operator's
 * evaluation, its default picker label, and its `valueless` flag land
 * together. Merges over the builtin map (and over earlier `withOperators`
 * calls), so builtins stay evaluable and individual keys can be
 * overridden. Label resolution per row is
 * `i18n.operators[key] ?? def.label ?? i18n.unnamedOperator`.
 *
 * Registration alone adds no picker entry: expose the key per field via
 * `FilterFieldDef.operators` or per editor type via
 * `withDefaultOperators` once an editor can serve it.
 *
 * @category forms/filter-builder/config
 */
export function withOperators(
  defs: Readonly<Record<string, CngxFilterOperatorDef>>,
): CngxFilterBuilderConfigFeature {
  return feature((config) => ({
    ...config,
    operators: new Map([...config.operators, ...Object.entries(defs)]),
  }));
}

/**
 * Fold both sides of the builtin substring trio (`contains` /
 * `startsWith` / `endsWith`) via `toLowerCase()` at evaluation time.
 * Off by default - the trio is case-SENSITIVE unless enabled. `eq` /
 * `neq` keep `Object.is` identity semantics regardless; custom operator
 * definitions receive the flag through their evaluation context and
 * decide themselves.
 *
 * @category forms/filter-builder/config
 */
export function withCaseInsensitiveStrings(enabled: boolean): CngxFilterBuilderConfigFeature {
  return feature((config) => ({ ...config, caseInsensitive: enabled }));
}

/**
 * Restrict which logic operators (`and` / `or` / `xor`) appear in the group toggle.
 *
 * @category forms/filter-builder/config
 */
export function withLogicOptions(logics: readonly FilterLogic[]): CngxFilterBuilderConfigFeature {
  return feature((config) => ({ ...config, logicOptions: logics }));
}

/**
 * Reveal the per-group negation toggle. Off by default.
 *
 * @category forms/filter-builder/config
 */
export function withNegation(enabled: boolean): CngxFilterBuilderConfigFeature {
  return feature((config) => ({ ...config, negationEnabled: enabled }));
}

/**
 * Register global template overrides - keyed fallback below per-instance content-child slots.
 *
 * @category forms/filter-builder/config
 */
export function withTemplates(
  templates: CngxFilterBuilderTemplates,
): CngxFilterBuilderConfigFeature {
  return feature((config) => ({
    ...config,
    templates: { ...config.templates, ...templates },
  }));
}

/** @internal */
function buildConfig(features: readonly CngxFilterBuilderConfigFeature[]): CngxFilterBuilderConfig {
  let config = CNGX_FILTER_BUILDER_DEFAULTS;
  for (const feat of features) {
    config = feat.apply(config);
  }
  return config;
}

/**
 * Root / environment-level config. Compose with `withFilterBuilderI18n(...)`, `withNegation(true)`, etc.
 *
 * @category forms/filter-builder/config
 */
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

/**
 * Component/route-level config - same shape as `provideFilterBuilderConfig` but for non-environment injectors.
 *
 * @category forms/filter-builder/config
 */
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

/**
 * Inject-context helper that resolves `CNGX_FILTER_BUILDER_CONFIG`.
 *
 * @category forms/filter-builder/config
 */
export function injectFilterBuilderConfig(): CngxFilterBuilderConfig {
  return inject(CNGX_FILTER_BUILDER_CONFIG);
}

/**
 * Reads the resolved i18n bundle as a `Signal`: the `withFilterBuilderI18n`
 * overrides over the `filterBuilder` section of the active language pack,
 * formatted for the locale of the reading injector. A key an override leaves
 * unset or `undefined` reads the section. Read it inside a `computed()`, a
 * template or a handler so a runtime language switch reaches the copy.
 * Injection context required.
 *
 * @category forms/filter-builder/config
 * @since 0.1.0
 * @relatedTo withFilterBuilderI18n, CNGX_FILTER_BUILDER_LANGUAGE_EN
 */
export function injectFilterBuilderI18n(): Signal<Required<CngxFilterBuilderI18n>> {
  return fillFilterBuilderI18n(
    injectFilterBuilderSectionI18n(),
    inject(CNGX_FILTER_BUILDER_CONFIG).i18n,
  );
}
