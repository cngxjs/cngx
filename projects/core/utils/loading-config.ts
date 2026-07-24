import {
  type EnvironmentProviders,
  InjectionToken,
  type Provider,
  inject,
  makeEnvironmentProviders,
} from '@angular/core';

/**
 * Loading-feedback tuning: the visibility-gate timings shared by every surface
 * that gates its visibility through `createVisibilityGate`, **and** the
 * indicator-selection thresholds a consumer reads to choose one loading
 * treatment over another.
 *
 * @category core/utils
 */
export interface CngxLoadingConfig {
  /** Delay in ms before a loading surface becomes visible. Operations faster than this never flash. */
  showDelay: number;

  /** Minimum time in ms a loading surface stays visible once shown, to avoid a jarring flash-out. */
  minDwell: number;

  /**
   * Duration in ms above which an app-shell indicator should prefer a skeleton
   * over a spinner. A consumer compares an observed busy-envelope duration
   * (e.g. `createLatencyProbe().lastDuration()`) against this cutoff.
   */
  spinnerVsSkeletonCutoff: number;
}

/**
 * Library defaults for {@link CngxLoadingConfig}. English/neutral values; a
 * 120ms show delay suppresses sub-perceptual blips, a 400ms min-dwell keeps a
 * shown indicator on screen long enough to read, an 800ms cutoff splits a
 * spinner-worthy wait from a skeleton-worthy one.
 *
 * @category core/utils
 */
export const CNGX_LOADING_DEFAULTS = {
  showDelay: 120,
  minDwell: 400,
  spinnerVsSkeletonCutoff: 800,
} as const satisfies CngxLoadingConfig;

/**
 * Injection token carrying the resolved {@link CngxLoadingConfig}. Provided in
 * `'root'` with {@link CNGX_LOADING_DEFAULTS}; override app-wide via
 * `provideLoadingConfig(...)` or per component tree via `provideLoadingConfigAt(...)`.
 *
 * @category core/utils
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/loading-config.ts
 * @since 0.1.0
 * @relatedTo provideLoadingConfig, provideLoadingConfigAt, injectLoadingConfig
 */
export const CNGX_LOADING_CONFIG = new InjectionToken<CngxLoadingConfig>('CngxLoadingConfig', {
  providedIn: 'root',
  factory: () => ({ ...CNGX_LOADING_DEFAULTS }),
});

/**
 * A feature configuration function returned by `withXxx()` helpers for the
 * loading-config cascade.
 *
 * @category core/utils
 */
export interface CngxLoadingConfigFeature {
  /** @internal */
  readonly _apply: (config: CngxLoadingConfig) => CngxLoadingConfig;
}

/**
 * Override the show delay for gated loading surfaces.
 *
 * @category core/utils
 */
export function withShowDelay(ms: number): CngxLoadingConfigFeature {
  return { _apply: (c) => ({ ...c, showDelay: ms }) };
}

/**
 * Override the minimum dwell time for gated loading surfaces.
 *
 * @category core/utils
 */
export function withMinDwell(ms: number): CngxLoadingConfigFeature {
  return { _apply: (c) => ({ ...c, minDwell: ms }) };
}

/**
 * Override the spinner-vs-skeleton cutoff (ms) an app-shell indicator reads to
 * pick a skeleton for waits longer than this and a spinner for shorter ones.
 *
 * @category core/utils
 */
export function withSpinnerVsSkeletonCutoff(ms: number): CngxLoadingConfigFeature {
  return { _apply: (c) => ({ ...c, spinnerVsSkeletonCutoff: ms }) };
}

function resolveLoadingConfig(features: CngxLoadingConfigFeature[]): CngxLoadingConfig {
  let config: CngxLoadingConfig = { ...CNGX_LOADING_DEFAULTS };
  for (const f of features) {
    config = f._apply(config);
  }
  return config;
}

/**
 * Register app-wide loading timing defaults.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideLoadingConfig(withShowDelay(200), withMinDwell(600))],
 * });
 * ```
 *
 * @category core/utils
 */
export function provideLoadingConfig(
  ...features: CngxLoadingConfigFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_LOADING_CONFIG, useValue: resolveLoadingConfig(features) },
  ]);
}

/**
 * Component-scope twin of {@link provideLoadingConfig} for `viewProviders`.
 *
 * ```ts
 * @Component({ viewProviders: [...provideLoadingConfigAt(withShowDelay(0))] })
 * ```
 *
 * @category core/utils
 */
export function provideLoadingConfigAt(...features: CngxLoadingConfigFeature[]): Provider[] {
  return [{ provide: CNGX_LOADING_CONFIG, useValue: resolveLoadingConfig(features) }];
}

/**
 * Read the resolved {@link CngxLoadingConfig}. Runs in an injection context.
 *
 * @category core/utils
 */
export function injectLoadingConfig(): CngxLoadingConfig {
  return inject(CNGX_LOADING_CONFIG);
}
