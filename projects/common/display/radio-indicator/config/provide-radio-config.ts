import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxRadioConfig, CngxRadioSkin } from './radio.config';
import { CNGX_RADIO_CONFIG, CNGX_RADIO_DEFAULTS } from './radio.config.defaults';

/**
 * Discriminated-union shape returned by `withRadioSkin`. The reducer in
 * `provideRadioConfig` / `provideRadioConfigAt` matches on `kind` and
 * writes `payload` into the corresponding config key. Same `kind` /
 * `payload` shape as `CngxTagConfigFeature`; a second feature turns it
 * into a union.
 */
export interface CngxRadioConfigFeature {
  readonly kind: 'skin';
  readonly payload: CngxRadioSkin;
}

/**
 * Reduces a list of feature objects into a partial config - last write
 * wins per key.
 *
 * @internal
 */
function reduceFeatures(features: readonly CngxRadioConfigFeature[]): Partial<CngxRadioConfig> {
  const out: { skin?: CngxRadioSkin } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'skin':
        out.skin = f.payload;
        break;
    }
  }
  return out;
}

/** @internal */
function mergeConfig(base: CngxRadioConfig, partial: Partial<CngxRadioConfig>): CngxRadioConfig {
  return { ...base, ...partial };
}

/**
 * Application-root configuration cascade for the radio indicator. Pass
 * `withRadioSkin(...)` in `bootstrapApplication`'s providers array.
 *
 * Resolution priority (high → low):
 *   1. Per-instance `[skin]` binding (indicator, radio or group).
 *   2. `provideRadioConfigAt(...)` in a parent component's
 *      `viewProviders`.
 *   3. `provideRadioConfig(...)` at the application root.
 *   4. Library defaults (`CNGX_RADIO_DEFAULTS`).
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideRadioConfig(withRadioSkin('tinted'))],
 * });
 * ```
 */
export function provideRadioConfig(...features: CngxRadioConfigFeature[]): EnvironmentProviders {
  // Empty-features: the root factory's CNGX_RADIO_DEFAULTS reference flows
  // through untouched instead of an identical copy under a new reference.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  const partial = reduceFeatures(features);
  return makeEnvironmentProviders([
    {
      provide: CNGX_RADIO_CONFIG,
      useValue: mergeConfig(CNGX_RADIO_DEFAULTS, partial),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the radio indicator. Pass
 * `withRadioSkin(...)` in a parent component's `viewProviders` array.
 *
 * Injects the parent injector's `CNGX_RADIO_CONFIG` value (root
 * provider, library defaults, or another `provideRadioConfigAt` further
 * up) and merges the supplied features on top, so descendant indicators
 * see the merged config and sibling sub-trees keep the inherited value.
 *
 * ```ts
 * @Component({
 *   selector: 'plan-picker',
 *   viewProviders: [provideRadioConfigAt(withRadioSkin('check'))],
 *   template: '<cngx-radio-group [(value)]="plan">...</cngx-radio-group>',
 * })
 * class PlanPicker {}
 * ```
 */
export function provideRadioConfigAt(...features: CngxRadioConfigFeature[]): Provider[] {
  // Empty-features call: parent value flows through untouched, preserving
  // reference identity through the sub-tree.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_RADIO_CONFIG,
      useFactory: () => {
        const parent = inject(CNGX_RADIO_CONFIG, { skipSelf: true });
        return mergeConfig(parent, partial);
      },
    },
  ];
}
