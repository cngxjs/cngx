import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxNavRailLabelPlacement, CngxNavRailSide } from '../nav-rail';
import type { CngxNavRailConfig } from './nav-rail.config';
import { CNGX_NAV_RAIL_CONFIG, CNGX_NAV_RAIL_DEFAULTS } from './nav-rail.config.defaults';

/**
 * Discriminated-union shape returned by the nav rail config features
 * (`withNavRailLabelPlacement`, `withNavRailSide`, `withNavRailTooltip`,
 * `withNavRailTooltipDelay`). The reducer in
 * `provideNavRailConfig` / `provideNavRailConfigAt` matches on `kind`; every
 * key is a flat scalar, so the last write wins.
 *
 * @since 0.3.0
 */
export type CngxNavRailConfigFeature =
  | {
      readonly kind: 'labelPlacement';
      readonly payload: { readonly labelPlacement: CngxNavRailLabelPlacement };
    }
  | {
      readonly kind: 'side';
      readonly payload: { readonly side: CngxNavRailSide };
    }
  | {
      readonly kind: 'tooltip';
      readonly payload: { readonly tooltip: boolean };
    }
  | {
      readonly kind: 'tooltipDelay';
      readonly payload: { readonly tooltipDelay: number };
    };

/** @internal */
function reduceFeatures(features: readonly CngxNavRailConfigFeature[]): CngxNavRailConfig {
  let out: CngxNavRailConfig = {};
  for (const f of features) {
    out = { ...out, ...f.payload };
  }
  return out;
}

/** @internal */
function mergeConfig(base: CngxNavRailConfig, partial: CngxNavRailConfig): CngxNavRailConfig {
  return {
    labelPlacement: partial.labelPlacement ?? base.labelPlacement,
    side: partial.side ?? base.side,
    tooltip: partial.tooltip ?? base.tooltip,
    tooltipDelay: partial.tooltipDelay ?? base.tooltipDelay,
  };
}

/**
 * Application-root configuration cascade for the nav rail. Pass
 * `withNavRailLabelPlacement`, `withNavRailSide`, `withNavRailTooltip` and
 * `withNavRailTooltipDelay` in
 * `bootstrapApplication`'s providers; unset keys keep the library defaults.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideNavRailConfig(withNavRailLabelPlacement('below'))],
 * });
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/config/provide-nav-rail-config.ts
 * @since 0.3.0
 * @relatedTo CNGX_NAV_RAIL_CONFIG, provideNavRailConfigAt, withNavRailLabelPlacement, withNavRailSide, withNavRailTooltip, withNavRailTooltipDelay
 */
export function provideNavRailConfig(
  ...features: CngxNavRailConfigFeature[]
): EnvironmentProviders {
  // No features: the root factory's defaults flow through with their identity.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  return makeEnvironmentProviders([
    {
      provide: CNGX_NAV_RAIL_CONFIG,
      useValue: mergeConfig(CNGX_NAV_RAIL_DEFAULTS, reduceFeatures(features)),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the nav rail. Use it in a parent
 * component's `viewProviders`: it reads the parent injector's
 * `CNGX_NAV_RAIL_CONFIG` (root provider, library defaults or another
 * `provideNavRailConfigAt` further up) and merges the features on top.
 *
 * ```ts
 * @Component({
 *   viewProviders: [provideNavRailConfigAt(withNavRailTooltipDelay(600))],
 *   template: '<cngx-nav-rail>...</cngx-nav-rail>',
 * })
 * class Section {}
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/nav-rail/config/provide-nav-rail-config.ts
 * @since 0.3.0
 * @relatedTo CNGX_NAV_RAIL_CONFIG, provideNavRailConfig
 */
export function provideNavRailConfigAt(...features: CngxNavRailConfigFeature[]): Provider[] {
  // No features: the parent value flows through with its identity.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_NAV_RAIL_CONFIG,
      useFactory: () => mergeConfig(inject(CNGX_NAV_RAIL_CONFIG, { skipSelf: true }), partial),
    },
  ];
}
