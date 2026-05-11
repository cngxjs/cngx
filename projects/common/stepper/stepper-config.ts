import {
  type EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type Provider,
  type TemplateRef,
} from '@angular/core';

import type { CngxStepBadgeContext } from './slots/step-badge.directive';
import type { CngxStepBusySpinnerContext } from './slots/step-busy-spinner.directive';
import type { CngxStepGroupHeaderContext } from './slots/step-group-header.directive';
import type { CngxStepIndicatorContext } from './slots/step-indicator.directive';
import type { CngxStepRejectionContext } from './slots/step-rejection.directive';

/**
 * Aria-label overrides for the stepper landmark region. Library
 * defaults are English; locales come from consumer overrides.
 *
 * Per-step navigation labels (`previousStep`, `nextStep`) live in
 * {@link CngxStepperI18n} — SR phrasing, not landmark naming.
 * Splitting the surfaces avoids a dual-override path for the same string.
 *
 * @category interactive
 */
export interface CngxStepperAriaLabels {
  readonly stepperRegion?: string;
}

/**
 * Fallback labels for derived strings (group descriptors, badge SR
 * announcements). English defaults; consumer overrides per locale.
 *
 * @category interactive
 */
export interface CngxStepperFallbackLabels {
  readonly groupRoleDescription?: string;
  readonly stepRoleDescription?: string;
}

/**
 * Per-slot template overrides for `<cngx-stepper>`. Middle tier of
 * the 3-stage cascade: per-instance directive > this field > built-in
 * markup. Apply via the `with*Template` feature builders below.
 *
 * @category interactive
 */
export interface CngxStepperTemplates {
  readonly indicator?: TemplateRef<CngxStepIndicatorContext>;
  readonly badge?: TemplateRef<CngxStepBadgeContext>;
  readonly busySpinner?: TemplateRef<CngxStepBusySpinnerContext>;
  readonly rejection?: TemplateRef<CngxStepRejectionContext>;
  readonly groupHeader?: TemplateRef<CngxStepGroupHeaderContext>;
  readonly empty?: TemplateRef<void>;
}

/**
 * Stepper config surface. Resolution priority: per-instance Input
 * > `provideStepperConfigAt` (viewProviders) > `provideStepperConfig`
 * (root) > library default. Canonical cngx config shape.
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
  readonly templates?: CngxStepperTemplates;
}

const STEPPER_CONFIG_DEFAULTS: Required<
  Omit<CngxStepperConfig, 'ariaLabels' | 'fallbackLabels' | 'templates'>
> & {
  ariaLabels: CngxStepperAriaLabels;
  fallbackLabels: CngxStepperFallbackLabels;
  templates: CngxStepperTemplates;
} = {
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
  templates: {},
};

/**
 * DI token for the resolved stepper config. `providedIn: 'root'` with
 * library defaults; override via {@link provideStepperConfig} (root)
 * or {@link provideStepperConfigAt} (component scope).
 *
 * @category interactive
 */
export const CNGX_STEPPER_CONFIG = new InjectionToken<CngxStepperConfig>(
  'CngxStepperConfig',
  { providedIn: 'root', factory: () => STEPPER_CONFIG_DEFAULTS },
);

/**
 * Feature signature — each `with*` builder reduces over the config.
 * Hidden `_target: 'config'` discriminator routes through the family
 * aggregator {@link provideCngxStepper}.
 *
 * @category interactive
 */
export type CngxStepperConfigFeature = ((
  config: CngxStepperConfig,
) => CngxStepperConfig) & {
  readonly _target: 'config';
};

/**
 * Brands a config mutator with `_target: 'config'`. Every `with*`
 * config feature returns one of these.
 *
 * @internal
 */
function defineStepperConfigFeature(
  fn: (config: CngxStepperConfig) => CngxStepperConfig,
): CngxStepperConfigFeature {
  return Object.assign(fn, { _target: 'config' as const });
}

/**
 * Override the default orientation. Per-instance `[orientation]`
 * Input still wins; this only moves the cascade default.
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

/**
 * Override the default `*cngxStepIndicator` template app-wide.
 * Per-instance directive still wins; this only moves the cascade
 * middle tier.
 *
 * @category interactive
 */
export function withStepIndicatorTemplate(
  template: TemplateRef<CngxStepIndicatorContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, indicator: template },
  }));
}

/**
 * Override the default `*cngxStepBadge` template app-wide.
 *
 * @category interactive
 */
export function withStepBadgeTemplate(
  template: TemplateRef<CngxStepBadgeContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, badge: template },
  }));
}

/**
 * Override the default `*cngxStepBusySpinner` template app-wide.
 *
 * @category interactive
 */
export function withStepBusySpinnerTemplate(
  template: TemplateRef<CngxStepBusySpinnerContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, busySpinner: template },
  }));
}

/**
 * Override the default `*cngxStepRejection` template app-wide.
 * Symmetric with the upcoming tabs `cngxTabRejectionIcon` (Phase 4).
 *
 * @category interactive
 */
export function withStepRejectionTemplate(
  template: TemplateRef<CngxStepRejectionContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, rejection: template },
  }));
}

/**
 * Override the default `*cngxStepGroupHeader` template app-wide.
 *
 * @category interactive
 */
export function withStepGroupHeaderTemplate(
  template: TemplateRef<CngxStepGroupHeaderContext>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, groupHeader: template },
  }));
}

/**
 * Override the default `*cngxStepperEmpty` template app-wide.
 *
 * @category interactive
 */
export function withStepperEmptyTemplate(
  template: TemplateRef<void>,
): CngxStepperConfigFeature {
  return defineStepperConfigFeature((cfg) => ({
    ...cfg,
    templates: { ...cfg.templates, empty: template },
  }));
}

function resolveFeatures(
  features: readonly CngxStepperConfigFeature[],
): CngxStepperConfig {
  return features.reduce<CngxStepperConfig>((cfg, feat) => feat(cfg), STEPPER_CONFIG_DEFAULTS);
}

/**
 * Root-level provider for the stepper config. Apply once in the
 * application providers array. Sibling of `provideTabsConfig` /
 * `provideSelectConfig`.
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
 * Component-scoped config override. Spread the returned `Provider[]`
 * into `providers` or `viewProviders` — `viewProviders` cannot accept
 * opaque {@link EnvironmentProviders}, so the twin returns a list.
 * Sibling of `provideTabsConfigAt`.
 *
 * Resolution priority: per-instance Input > viewProviders (`At`) >
 * root provider > library default.
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
