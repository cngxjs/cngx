import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxDataGridAccordionConfig, CngxDataGridSkin } from './data-grid-accordion.config';
import {
  CNGX_DATA_GRID_ACCORDION_CONFIG,
  CNGX_DATA_GRID_ACCORDION_DEFAULTS,
} from './data-grid-accordion.config.defaults';

/**
 * Discriminated-union shape returned by `withDataGridSkin`. The reducer in
 * `provideDataGridAccordionConfig` / `provideDataGridAccordionConfigAt` matches
 * on `kind` and writes `payload` onto the corresponding config key. Mirrors
 * `CngxAccordionConfigFeature` from `@cngx/ui/accordion` so the consumer's mental
 * model is one across feature areas.
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export interface CngxDataGridAccordionConfigFeature {
  readonly kind: 'skin';
  readonly payload: { readonly skin: CngxDataGridSkin };
}

/**
 * Reduces a list of feature objects into a partial config - last write wins per
 * key.
 *
 * @internal
 */
function reduceFeatures(
  features: readonly CngxDataGridAccordionConfigFeature[],
): Partial<CngxDataGridAccordionConfig> {
  const out: { skin?: CngxDataGridSkin } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'skin':
        out.skin = f.payload.skin;
        break;
    }
  }
  return out;
}

/**
 * Merges a partial config onto a base. Scalars take the partial when present.
 *
 * @internal
 */
function mergeConfig(
  base: CngxDataGridAccordionConfig,
  partial: Partial<CngxDataGridAccordionConfig>,
): CngxDataGridAccordionConfig {
  return {
    skin: partial.skin ?? base.skin,
  };
}

/**
 * Application-root configuration cascade for the data-grid-accordion. Pass a
 * `withDataGridSkin` feature in `bootstrapApplication`'s providers array to move
 * the app-wide default skin.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance `[skin]` Input binding.
 *   2. `provideDataGridAccordionConfigAt(...)` in a parent component's
 *      `viewProviders`.
 *   3. `provideDataGridAccordionConfig(...)` at the application root.
 *   4. Library defaults (`CNGX_DATA_GRID_ACCORDION_DEFAULTS`).
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideDataGridAccordionConfig(withDataGridSkin('ledger'))],
 * });
 * ```
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export function provideDataGridAccordionConfig(
  ...features: CngxDataGridAccordionConfigFeature[]
): EnvironmentProviders {
  // Empty-features: skip the override so the root factory's
  // CNGX_DATA_GRID_ACCORDION_DEFAULTS reference flows through untouched. A fresh
  // merge would allocate identical content under a new reference and bust
  // downstream identity comparisons.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  const partial = reduceFeatures(features);
  return makeEnvironmentProviders([
    {
      provide: CNGX_DATA_GRID_ACCORDION_CONFIG,
      useValue: mergeConfig(CNGX_DATA_GRID_ACCORDION_DEFAULTS, partial),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the data-grid-accordion. Pass a
 * `withDataGridSkin` feature in a parent component's `viewProviders` array.
 *
 * Unlike `provideDataGridAccordionConfig` (root-only),
 * `provideDataGridAccordionConfigAt` injects the parent injector's
 * `CNGX_DATA_GRID_ACCORDION_CONFIG` value (resolves through the priority chain)
 * and merges the supplied features on top. Descendant grid instances see the
 * merged config; sibling sub-trees keep the inherited value untouched.
 *
 * ```ts
 * @Component({
 *   viewProviders: [provideDataGridAccordionConfigAt(withDataGridSkin('report'))],
 *   template: '<cngx-data-grid-accordion>...</cngx-data-grid-accordion>',
 * })
 * class Ledger {}
 * ```
 *
 * @category ui/data-grid-accordion
 * @since 0.1.0
 */
export function provideDataGridAccordionConfigAt(
  ...features: CngxDataGridAccordionConfigFeature[]
): Provider[] {
  // Empty-features call: parent value flows through untouched. Skipping the
  // factory preserves reference identity through the sub-tree.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_DATA_GRID_ACCORDION_CONFIG,
      useFactory: () => {
        const parent = inject(CNGX_DATA_GRID_ACCORDION_CONFIG, { skipSelf: true });
        return mergeConfig(parent, partial);
      },
    },
  ];
}
