import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxTocConfig } from './toc.config';
import { CNGX_TOC_CONFIG, CNGX_TOC_DEFAULTS } from './toc.config.defaults';

/**
 * Discriminated-union shape returned by the toc config features -
 * `withTocAriaLabels`, `withTocScrollBehavior`, and `withTocTemplates`. The
 * reducer in `provideTocConfig` / `provideTocConfigAt` matches on `kind` and
 * merges `payload` into the corresponding config sub-tree. Mirrors
 * `CngxBreadcrumbConfigFeature` so the consumer's mental model is one across
 * feature areas.
 *
 * @category ui/toc
 * @since 0.1.0
 */
export type CngxTocConfigFeature =
  | {
      readonly kind: 'ariaLabels';
      readonly payload: NonNullable<CngxTocConfig['ariaLabels']>;
    }
  | {
      readonly kind: 'scrollBehavior';
      readonly payload: { readonly scrollBehavior: NonNullable<CngxTocConfig['scrollBehavior']> };
    }
  | {
      readonly kind: 'templates';
      readonly payload: NonNullable<CngxTocConfig['templates']>;
    };

/**
 * Reduces a list of feature objects into a partial config - last write wins
 * per sub-tree. Inner objects are spread-merged so partial overrides compose
 * cleanly with prior writes.
 *
 * @internal
 */
function reduceFeatures(features: readonly CngxTocConfigFeature[]): Partial<CngxTocConfig> {
  const out: {
    ariaLabels?: NonNullable<CngxTocConfig['ariaLabels']>;
    scrollBehavior?: NonNullable<CngxTocConfig['scrollBehavior']>;
    templates?: NonNullable<CngxTocConfig['templates']>;
  } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'ariaLabels':
        out.ariaLabels = { ...out.ariaLabels, ...f.payload };
        break;
      case 'scrollBehavior':
        out.scrollBehavior = f.payload.scrollBehavior;
        break;
      case 'templates':
        out.templates = { ...out.templates, ...f.payload };
        break;
    }
  }
  return out;
}

/**
 * Deep merge: the nested sub-trees (`ariaLabels` / `spy` / `templates`) are
 * spread-merged so a partial fills in missing keys without nuking unrelated
 * sub-trees; the flat scalar `scrollBehavior` takes the partial when present,
 * else the base. Inner objects are flat (one level), so a single spread per
 * key suffices.
 *
 * @internal
 */
function mergeConfig(
  base: CngxTocConfig,
  partial: Partial<CngxTocConfig>,
): CngxTocConfig {
  return {
    ariaLabels: { ...base.ariaLabels, ...partial.ariaLabels },
    scrollBehavior: partial.scrollBehavior ?? base.scrollBehavior,
    spy: { ...base.spy },
    templates: { ...base.templates, ...partial.templates },
  };
}

/**
 * Application-root configuration cascade for the toc organism. Pass any
 * combination of `withTocAriaLabels`, `withTocScrollBehavior`, and
 * `withTocTemplates` features in `bootstrapApplication`'s providers array.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding.
 *   2. `provideTocConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideTocConfig(...)` at the application root.
 *   4. Library defaults (`CNGX_TOC_DEFAULTS`).
 *
 * The provider deep-merges supplied features with the library defaults so
 * consumers only declare keys they want to override.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTocConfig(
 *       withTocAriaLabels({ nav: 'On this page' }),
 *       withTocScrollBehavior('smooth'),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category ui/toc
 * @since 0.1.0
 */
export function provideTocConfig(...features: CngxTocConfigFeature[]): EnvironmentProviders {
  // Empty-features: skip the override so the root factory's CNGX_TOC_DEFAULTS
  // reference flows through untouched. A fresh mergeConfig(...) would allocate
  // identical content under a new reference and bust identity comparisons.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  const partial = reduceFeatures(features);
  return makeEnvironmentProviders([
    {
      provide: CNGX_TOC_CONFIG,
      useValue: mergeConfig(CNGX_TOC_DEFAULTS, partial),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the toc organism. Pass any
 * combination of feature factories in a parent component's `viewProviders`
 * array.
 *
 * Unlike `provideTocConfig` (root-only), `provideTocConfigAt` injects the
 * parent injector's `CNGX_TOC_CONFIG` value (resolves through the priority
 * chain) and deep-merges the supplied features on top. Descendant toc
 * instances see the merged config; sibling sub-trees keep the inherited value.
 *
 * ```ts
 * @Component({
 *   viewProviders: [provideTocConfigAt(withTocScrollBehavior('auto'))],
 *   template: '<cngx-toc [items]="toc" contentRoot="#article" />',
 * })
 * class Guide {}
 * ```
 *
 * @category ui/toc
 * @since 0.1.0
 */
export function provideTocConfigAt(...features: CngxTocConfigFeature[]): Provider[] {
  // Empty-features call: parent value flows through untouched. Skipping the
  // factory preserves reference identity through the sub-tree.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_TOC_CONFIG,
      useFactory: () => {
        const parent = inject(CNGX_TOC_CONFIG, { skipSelf: true });
        return mergeConfig(parent, partial);
      },
    },
  ];
}
