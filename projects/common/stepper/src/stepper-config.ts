import { inject, InjectionToken, type Provider } from '@angular/core';

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
  readonly rovingLoop?: boolean;
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
  rovingLoop: false,
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
 * that the aggregator merges into the final value.
 *
 * @category interactive
 */
export type CngxStepperConfigFeature = (config: CngxStepperConfig) => CngxStepperConfig;

export function withDefaultOrientation(
  orientation: 'horizontal' | 'vertical',
): CngxStepperConfigFeature {
  return (cfg) => ({ ...cfg, defaultOrientation: orientation });
}

export function withStepperLinear(linear: boolean): CngxStepperConfigFeature {
  return (cfg) => ({ ...cfg, defaultLinear: linear });
}

export function withStepperRovingLoop(loop: boolean): CngxStepperConfigFeature {
  return (cfg) => ({ ...cfg, rovingLoop: loop });
}

export function withStepperCommitMode(
  mode: 'optimistic' | 'pessimistic',
): CngxStepperConfigFeature {
  return (cfg) => ({ ...cfg, defaultCommitMode: mode });
}

export function withStepperRouterSync(
  mode: 'fragment' | 'queryParam',
  param = 'step',
): CngxStepperConfigFeature {
  return (cfg) => ({ ...cfg, routerSyncMode: mode, routerSyncParam: param });
}

export function withStepperAriaLabels(
  labels: CngxStepperAriaLabels,
): CngxStepperConfigFeature {
  return (cfg) => ({
    ...cfg,
    ariaLabels: { ...cfg.ariaLabels, ...labels },
  });
}

export function withStepperFallbackLabels(
  labels: CngxStepperFallbackLabels,
): CngxStepperConfigFeature {
  return (cfg) => ({
    ...cfg,
    fallbackLabels: { ...cfg.fallbackLabels, ...labels },
  });
}

function resolveFeatures(
  features: readonly CngxStepperConfigFeature[],
): CngxStepperConfig {
  return features.reduce<CngxStepperConfig>((cfg, feat) => feat(cfg), STEPPER_CONFIG_DEFAULTS);
}

/**
 * Root-level provider for the stepper config. Apply once in the
 * application providers array.
 *
 * @category interactive
 */
export function provideStepperConfig(
  ...features: readonly CngxStepperConfigFeature[]
): Provider {
  return { provide: CNGX_STEPPER_CONFIG, useValue: resolveFeatures(features) };
}

/**
 * Component-scoped provider for the stepper config. Apply via
 * `viewProviders` to override config for a specific stepper subtree.
 *
 * @category interactive
 */
export function provideStepperConfigAt(
  ...features: readonly CngxStepperConfigFeature[]
): Provider {
  return { provide: CNGX_STEPPER_CONFIG, useValue: resolveFeatures(features) };
}

/**
 * Inject the resolved stepper config in an injection context.
 *
 * @category interactive
 */
export function injectStepperConfig(): CngxStepperConfig {
  return inject(CNGX_STEPPER_CONFIG);
}
