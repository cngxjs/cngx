import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxStatCardConfig } from './stat-card.config';
import { CNGX_STAT_CARD_CONFIG, CNGX_STAT_CARD_DEFAULTS } from './stat-card.config.defaults';

/**
 * Discriminated-union shape returned by the stat-card config features -
 * `withStatCardAriaLabels` and `withStatCardLoadingTreatment`. The reducer in
 * `provideStatCardConfig` / `provideStatCardConfigAt` matches on `kind` and
 * merges `payload` into the corresponding config sub-tree. Mirrors
 * `CngxBreadcrumbConfigFeature` so the consumer's mental model is one across
 * feature areas.
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export type CngxStatCardConfigFeature =
  | {
      readonly kind: 'ariaLabels';
      readonly payload: NonNullable<CngxStatCardConfig['ariaLabels']>;
    }
  | {
      readonly kind: 'loadingTreatment';
      readonly payload: { readonly loadingTreatment: NonNullable<CngxStatCardConfig['loadingTreatment']> };
    };

/**
 * Reduces a list of feature objects into a partial config - last write wins
 * per sub-tree. Inner objects are spread-merged so partial overrides compose
 * cleanly with prior writes.
 *
 * @internal
 */
function reduceFeatures(
  features: readonly CngxStatCardConfigFeature[],
): Partial<CngxStatCardConfig> {
  const out: {
    ariaLabels?: NonNullable<CngxStatCardConfig['ariaLabels']>;
    loadingTreatment?: NonNullable<CngxStatCardConfig['loadingTreatment']>;
  } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'ariaLabels':
        out.ariaLabels = { ...out.ariaLabels, ...f.payload };
        break;
      case 'loadingTreatment':
        out.loadingTreatment = f.payload.loadingTreatment;
        break;
    }
  }
  return out;
}

/**
 * Two-level deep merge: the nested `ariaLabels` sub-tree is spread-merged so a
 * partial fills in missing keys without nuking the rest; the flat top-level
 * scalar `loadingTreatment` takes the partial when present, else the base.
 *
 * @internal
 */
function mergeConfig(
  base: CngxStatCardConfig,
  partial: Partial<CngxStatCardConfig>,
): CngxStatCardConfig {
  return {
    ariaLabels: { ...base.ariaLabels, ...partial.ariaLabels },
    loadingTreatment: partial.loadingTreatment ?? base.loadingTreatment,
  };
}

/**
 * Application-root configuration cascade for the stat-card. Pass any
 * combination of `withStatCardAriaLabels` and `withStatCardLoadingTreatment`
 * in `bootstrapApplication`'s providers array.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideStatCardConfig(
 *       withStatCardAriaLabels({ errorFallback: 'Kennzahl nicht verfügbar' }),
 *       withStatCardLoadingTreatment('skeleton'),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export function provideStatCardConfig(
  ...features: CngxStatCardConfigFeature[]
): EnvironmentProviders {
  // Empty-features: skip the override so the root factory's
  // CNGX_STAT_CARD_DEFAULTS reference flows through untouched. A fresh
  // mergeConfig(...) would allocate identical content under a new reference
  // and bust downstream identity comparisons.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  const partial = reduceFeatures(features);
  return makeEnvironmentProviders([
    {
      provide: CNGX_STAT_CARD_CONFIG,
      useValue: mergeConfig(CNGX_STAT_CARD_DEFAULTS, partial),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the stat-card. Pass any
 * combination of feature factories in a parent component's `viewProviders`.
 *
 * Unlike `provideStatCardConfig` (root-only), this injects the parent
 * injector's `CNGX_STAT_CARD_CONFIG` value and deep-merges the supplied
 * features on top. Descendant tiles see the merged config; sibling sub-trees
 * keep the inherited value untouched.
 *
 * ```ts
 * @Component({
 *   viewProviders: [provideStatCardConfigAt(withStatCardLoadingTreatment('spinner'))],
 *   template: '<cngx-stat-card [state]="s" />',
 * })
 * class LiveTiles {}
 * ```
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export function provideStatCardConfigAt(...features: CngxStatCardConfigFeature[]): Provider[] {
  // Empty-features call: parent value flows through untouched. Skipping the
  // factory preserves reference identity through the sub-tree.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_STAT_CARD_CONFIG,
      useFactory: () => {
        const parent = inject(CNGX_STAT_CARD_CONFIG, { skipSelf: true });
        return mergeConfig(parent, partial);
      },
    },
  ];
}
