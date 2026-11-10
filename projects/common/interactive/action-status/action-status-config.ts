import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
  type Signal,
  type TemplateRef,
} from '@angular/core';
import { createLanguageSection } from '@cngx/core/i18n';

import {
  CNGX_ACTION_STATUS_LANGUAGE_EN,
  type CngxActionStatusLanguageSection,
} from '../i18n/action-status-language-section';

/**
 * Template context of a failed cell: the error as `$implicit`
 * (`let-err`), for a projected `cngxFailed` and a config `failed` template.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 * @relatedTo CngxFailed, CngxActionStatusTemplates
 */
export interface CngxActionStatusFailedContext {
  /** The rejection value of the run, or the error of the bound external state. */
  readonly $implicit: unknown;
}

/**
 * App-wide status labels, the same shape as the actionStatus section of a
 * language pack. An empty label renders no cell for that state.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 * @relatedTo withActionStatusLabels
 */
export type CngxActionStatusLabels = CngxActionStatusLanguageSection;

/**
 * App-wide status cell templates, used where a host projects no
 * `cngxPending` / `cngxSucceeded` / `cngxFailed`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 * @relatedTo withActionStatusTemplates
 */
export interface CngxActionStatusTemplates {
  /** Content of the pending cell. */
  readonly pending?: TemplateRef<unknown>;
  /** Content of the succeeded cell. */
  readonly succeeded?: TemplateRef<unknown>;
  /** Content of the failed cell; gets the error as `$implicit`. */
  readonly failed?: TemplateRef<CngxActionStatusFailedContext>;
}

/**
 * App-wide defaults for every action host on `CngxActionStatusBrain`
 * (`CngxActionButton`, `CngxPopoverAction`, ejected hosts).
 *
 * Resolution per cell (high -> low):
 *   1. A projected `cngxPending` / `cngxSucceeded` / `cngxFailed` template.
 *   2. `templates` from `provideActionStatusConfigAt(...)` in a parent
 *      component's `viewProviders`, else `provideActionStatusConfig(...)`.
 *   3. The bound `pendingLabel` / `succeededLabel` / `failedLabel`; a bound
 *      `''` switches the cell off.
 *   4. `labels` from the config, over the actionStatus section of the active
 *      language pack (English: empty, no cell).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 * @relatedTo provideActionStatusConfig, provideActionStatusConfigAt, injectActionStatusConfig
 */
export interface CngxActionStatusConfig {
  /** Status labels over the language pack. A `Signal` follows a language switch. */
  readonly labels?: Partial<CngxActionStatusLabels> | Signal<Partial<CngxActionStatusLabels>>;
  /** Status cell templates. */
  readonly templates?: CngxActionStatusTemplates;
}

/**
 * DI token carrying the resolved {@link CngxActionStatusConfig}. Defaults to
 * an empty object: no templates, the labels of the language pack.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 * @relatedTo provideActionStatusConfig, injectActionStatusConfig
 */
export const CNGX_ACTION_STATUS_CONFIG = new InjectionToken<CngxActionStatusConfig>(
  'CngxActionStatusConfig',
  { providedIn: 'root', factory: (): CngxActionStatusConfig => ({}) },
);

/**
 * Feature returned by `withActionStatusLabels` / `withActionStatusTemplates`;
 * merged by {@link provideActionStatusConfig} and
 * {@link provideActionStatusConfigAt}. The hidden `_target: 'actionStatus'`
 * routes it through `provideCngxButton` in `@cngx/common/button`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 */
export interface CngxActionStatusConfigFeature {
  readonly _target: 'actionStatus';
  readonly config: CngxActionStatusConfig;
}

/**
 * App-wide status labels. Unset keys keep the language pack's label; pass a
 * `Signal` of a partial bundle to switch languages at runtime. A later call
 * replaces the whole bundle.
 *
 * ```ts
 * provideActionStatusConfig(withActionStatusLabels({ pending: 'Saving...', succeeded: 'Saved' }))
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 * @relatedTo provideActionStatusConfig
 */
export function withActionStatusLabels(
  labels: Partial<CngxActionStatusLabels> | Signal<Partial<CngxActionStatusLabels>>,
): CngxActionStatusConfigFeature {
  return { _target: 'actionStatus', config: { labels } };
}

/**
 * App-wide status cell templates. Merged per key with earlier calls and
 * with the parent scope.
 *
 * ```ts
 * provideActionStatusConfig(withActionStatusTemplates({ succeeded: savedTpl }))
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 * @relatedTo provideActionStatusConfig
 */
export function withActionStatusTemplates(
  templates: CngxActionStatusTemplates,
): CngxActionStatusConfigFeature {
  return { _target: 'actionStatus', config: { templates } };
}

/** @internal */
function mergeFeatures(
  base: CngxActionStatusConfig,
  features: readonly CngxActionStatusConfigFeature[],
): CngxActionStatusConfig {
  return features.reduce<CngxActionStatusConfig>(
    (acc, f) => ({
      labels: f.config.labels ?? acc.labels,
      templates: { ...acc.templates, ...f.config.templates },
    }),
    base,
  );
}

/**
 * Register app-wide action status defaults composed from `withActionStatus*`
 * features.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideActionStatusConfig(withActionStatusLabels({ succeeded: 'Saved' }))],
 * });
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 * @relatedTo withActionStatusLabels, withActionStatusTemplates, provideActionStatusConfigAt
 */
export function provideActionStatusConfig(
  ...features: CngxActionStatusConfigFeature[]
): EnvironmentProviders {
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  return makeEnvironmentProviders([
    { provide: CNGX_ACTION_STATUS_CONFIG, useValue: mergeFeatures({}, features) },
  ]);
}

/**
 * Component-scoped twin of {@link provideActionStatusConfig} for
 * `viewProviders`. Merges the features on top of the config inherited from
 * the parent injector, so nested scopes cascade.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 * @relatedTo provideActionStatusConfig
 */
export function provideActionStatusConfigAt(
  ...features: CngxActionStatusConfigFeature[]
): Provider[] {
  if (features.length === 0) {
    return [];
  }
  return [
    {
      provide: CNGX_ACTION_STATUS_CONFIG,
      useFactory: () =>
        mergeFeatures(inject(CNGX_ACTION_STATUS_CONFIG, { skipSelf: true }), features),
    },
  ];
}

/**
 * Inject the action status config resolved for the current injector.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-config.ts
 * @since 0.1.0
 */
export function injectActionStatusConfig(): CngxActionStatusConfig {
  return inject(CNGX_ACTION_STATUS_CONFIG);
}

/** @internal The actionStatus section of the active pack over the English one. */
export const injectActionStatusSection = createLanguageSection(
  'actionStatus',
  CNGX_ACTION_STATUS_LANGUAGE_EN,
);
