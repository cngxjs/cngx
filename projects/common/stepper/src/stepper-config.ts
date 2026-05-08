import {
  type EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type Provider,
} from '@angular/core';

/**
 * Aria-label overrides for the stepper landmark region. Library
 * defaults are English (per `feedback_en_default_locale`); German /
 * other locales come from consumer overrides.
 *
 * Per-step navigation labels (`previousStep`, `nextStep`) live in
 * {@link CngxStepperI18n} — they're SR phrasing, not landmark
 * naming, and belong with the rest of the i18n surface to avoid a
 * dual-override path for the same string.
 *
 * @category interactive
 */
export interface CngxStepperAriaLabels {
  readonly stepperRegion?: string;
}

/**
 * Fallback labels for derived strings (group descriptors, badge SR
 * announcements). Library defaults are English; consumers override
 * per locale.
 *
 * @category interactive
 */
export interface CngxStepperFallbackLabels {
  readonly groupRoleDescription?: string;
  readonly stepRoleDescription?: string;
}

/**
 * Stepper config surface. Resolution priority: per-instance Input
 * → `provideStepperConfigAt` (viewProviders) → `provideStepperConfig`
 * (root) → library default. Mirrors the canonical config shape used
 * by every cngx feature family.
 *
 * @category interactive
 */
export interface CngxStepperConfig {
  readonly defaultOrientation?: 'horizontal' | 'vertical';
  readonly defaultLinear?: boolean;
  readonly defaultCommitMode?: 'optimistic' | 'pessimistic';
  readonly routerSyncMode?: 'fragment' | 'queryParam';
  readonly routerSyncParam?: string;
  readonly ariaLabels?: CngxStepperAriaLabels;
  readonly fallbackLabels?: CngxStepperFallbackLabels;
}

const STEPPER_CONFIG_DEFAULTS: Required<
  Omit<CngxStepperConfig, 'ariaLabels' | 'fallbackLabels'>
> & { ariaLabels: CngxStepperAriaLabels; fallbackLabels: CngxStepperFallbackLabels } = {
  defaultOrientation: 'horizontal',
  defaultLinear: false,
  defaultCommitMode: 'pessimistic',
  routerSyncMode: 'fragment',
  routerSyncParam: 'step',
  ariaLabels: {
    stepperRegion: 'Stepper',
  },
  fallbackLabels: {
    groupRoleDescription: 'step group',
    stepRoleDescription: 'stepper',
  },
};

/**
 * DI token for the resolved stepper config. `providedIn: 'root'`
 * with the library defaults; override via {@link provideStepperConfig}
 * (root) or {@link provideStepperConfigAt} (component scope).
 *
 * @category interactive
 */
export const CNGX_STEPPER_CONFIG = new InjectionToken<CngxStepperConfig>(
  'CngxStepperConfig',
  { providedIn: 'root', factory: () => STEPPER_CONFIG_DEFAULTS },
);

/**
 * Feature signature — each `with*` builder returns a partial config
 * the aggregator merges into the final value. Carries a hidden
 * `_target` discriminator so the family aggregator
 * {@link provideCngxStepper} can dispatch config features to
 * {@link provideStepperConfig} alongside i18n features routed to
 * {@link provideStepperI18n}.
 *
 * @category interactive
 */
export type CngxStepperConfigFeature = ((
  config: CngxStepperConfig,
) => CngxStepperConfig) & {
  readonly _target?: 'config';
};

/**
 * Internal helper that brands a config-mutator function with the
 * `_target` discriminator. Every `with*` config feature returns one
 * of these.
 *
 * @internal
 */
function defineStepperConfigFeature(
  fn: (config: CngxStepperConfig) => CngxStepperConfig,
): CngxStepperConfigFeature {
  return Object.assign(fn, { _target: 'config' as const });
}

/**
 * Override the default orientation for `<cngx-stepper>` /
 * `<cngx-mat-stepper>` consumers. Per-instance `[orientation]` Input
 * still wins; this feature only changes the cascade default.
 *
 * @category interactive
 */
export function withStepperDefaultOrientation(
  orientation: 'horizontal' | 'vertical',
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    defaultOrientation: orientation,
  }));
}

export function withStepperLinear(linear: boolean): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({ ...cfg, defaultLinear: linear }));
}

export function withStepperCommitMode(
  mode: 'optimistic' | 'pessimistic',
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    defaultCommitMode: mode,
  }));
}

export function withStepperRouterSync(
  mode: 'fragment' | 'queryParam',
  param = 'step',
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    routerSyncMode: mode,
    routerSyncParam: param,
  }));
}

export function withStepperAriaLabels(
  labels: CngxStepperAriaLabels,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    ariaLabels: { ...cfg.ariaLabels, ...labels },
  }));
}

export function withStepperFallbackLabels(
  labels: CngxStepperFallbackLabels,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    fallbackLabels: { ...cfg.fallbackLabels, ...labels },
  }));
}

function resolveFeatures(
  features: readonly CngxStepperConfigFeature[],
): CngxStepperConfig {
  return features.reduce<CngxStepperConfig>((cfg, feat) => feat(cfg), STEPPER_CONFIG_DEFAULTS);
}

/**
 * Root-level provider for the stepper config. Apply once in the
 * application providers array (`bootstrapApplication` /
 * `appConfig.providers`).
 *
 * Returns {@link EnvironmentProviders} per the canonical cngx
 * config-cascade signature — matches `provideTabsConfig` /
 * `provideSelectConfig` and the architecture-summary contract.
 *
 * @category interactive
 */
export function provideStepperConfig(
  ...features: readonly CngxStepperConfigFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_STEPPER_CONFIG, useValue: resolveFeatures(features) },
  ]);
}

/**
 * Component-scoped config override. The returned `Provider[]` goes
 * into a component's `providers` or `viewProviders` via spread —
 * `viewProviders` cannot accept opaque {@link EnvironmentProviders},
 * so this twin keeps the same merge semantics with a list shape
 * (matches `provideTabsConfigAt`).
 *
 * Resolution priority across both helpers:
 *   per-instance Input > viewProviders (`At`) > root provider >
 *   library default.
 *
 * @example
 * ```ts
 * @Component({
 *   viewProviders: [...provideStepperConfigAt(withStepperLinear(true))],
 * })
 * ```
 *
 * @category interactive
 */
export function provideStepperConfigAt(
  ...features: readonly CngxStepperConfigFeature[]
): Provider[] {
  return [{ provide: CNGX_STEPPER_CONFIG, useValue: resolveFeatures(features) }];
}

/**
 * Inject the resolved stepper config in an injection context.
 *
 * @category interactive
 */
export function injectStepperConfig(): CngxStepperConfig {
  return inject(CNGX_STEPPER_CONFIG);
}
