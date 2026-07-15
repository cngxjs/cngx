import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxSidenavConfig } from './sidenav.config';
import {
  CNGX_SIDENAV_CONFIG,
  CNGX_SIDENAV_DEFAULTS,
} from './sidenav.config.defaults';

/**
 * Discriminated-union shape returned by the sidenav config features -
 * `withSidenavDimensions`, `withSidenavResponsive`, `withSidenavShortcut`, and
 * (Phase 2) `withSidenavHoverDwell`. The reducer in `provideSidenavConfig` /
 * `provideSidenavConfigAt` matches on `kind` and merges `payload` into the
 * corresponding config sub-tree: `dimensions` and `hover` are one-level nested
 * sub-trees, `responsive` and `shortcut` are flat top-level scalars. Mirrors
 * `CngxBreadcrumbConfigFeature` from `@cngx/ui/breadcrumb` so the consumer's
 * mental model is one across feature areas.
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export type CngxSidenavConfigFeature =
  | {
      readonly kind: 'dimensions';
      readonly payload: NonNullable<CngxSidenavConfig['dimensions']>;
    }
  | {
      readonly kind: 'hover';
      readonly payload: NonNullable<CngxSidenavConfig['hover']>;
    }
  | {
      readonly kind: 'responsive';
      readonly payload: { readonly responsive: string };
    }
  | {
      readonly kind: 'shortcut';
      readonly payload: { readonly shortcut: string };
    };

/**
 * Reduces a list of feature objects into a partial config - last write wins
 * per sub-tree. The nested `dimensions` / `hover` sub-trees are spread-merged
 * so partial overrides compose cleanly with prior writes.
 *
 * @internal
 */
function reduceFeatures(
  features: readonly CngxSidenavConfigFeature[],
): Partial<CngxSidenavConfig> {
  const out: {
    dimensions?: NonNullable<CngxSidenavConfig['dimensions']>;
    hover?: NonNullable<CngxSidenavConfig['hover']>;
    responsive?: string;
    shortcut?: string;
  } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'dimensions':
        out.dimensions = { ...out.dimensions, ...f.payload };
        break;
      case 'hover':
        out.hover = { ...out.hover, ...f.payload };
        break;
      case 'responsive':
        out.responsive = f.payload.responsive;
        break;
      case 'shortcut':
        out.shortcut = f.payload.shortcut;
        break;
    }
  }
  return out;
}

/**
 * Two-level deep merge: the nested sub-tree keys (`dimensions` / `hover`) are
 * spread-merged so the partial fills in missing keys without nuking unrelated
 * config sub-trees; the flat top-level scalars (`responsive` / `shortcut`) take
 * the partial when present, else the base. Inner objects are flat (one level),
 * so a single spread per key suffices. Invariant: a config key nested more than
 * one level deep would shallow-merge silently here - if the config ever grows a
 * deeper sub-tree, add a dedicated spread for it rather than relying on this
 * pass.
 *
 * @internal
 */
function mergeConfig(
  base: CngxSidenavConfig,
  partial: Partial<CngxSidenavConfig>,
): CngxSidenavConfig {
  return {
    dimensions: { ...base.dimensions, ...partial.dimensions },
    hover: { ...base.hover, ...partial.hover },
    responsive: partial.responsive ?? base.responsive,
    shortcut: partial.shortcut ?? base.shortcut,
  };
}

/**
 * Application-root configuration cascade for the sidenav family. Pass any
 * combination of `withSidenavDimensions`, `withSidenavResponsive`,
 * `withSidenavShortcut`, and (Phase 2) `withSidenavHoverDwell` features in
 * `bootstrapApplication`'s providers array.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding.
 *   2. `provideSidenavConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideSidenavConfig(...)` at the application root.
 *   4. Library defaults (`CNGX_SIDENAV_DEFAULTS`).
 *
 * The provider deep-merges supplied features with the library defaults so
 * consumers only declare keys they want to override.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideSidenavConfig(
 *       withSidenavDimensions({ width: '320px' }),
 *       withSidenavShortcut('mod+b'),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export function provideSidenavConfig(
  ...features: CngxSidenavConfigFeature[]
): EnvironmentProviders {
  // Empty-features: skip the override so the root factory's
  // CNGX_SIDENAV_DEFAULTS reference flows through untouched. A fresh
  // mergeConfig(...) would allocate identical content under a new reference and
  // bust downstream identity comparisons.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  const partial = reduceFeatures(features);
  return makeEnvironmentProviders([
    {
      provide: CNGX_SIDENAV_CONFIG,
      useValue: mergeConfig(CNGX_SIDENAV_DEFAULTS, partial),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the sidenav family. Pass any
 * combination of feature factories in a parent component's `viewProviders`
 * array.
 *
 * Unlike `provideSidenavConfig` (root-only), `provideSidenavConfigAt` injects
 * the parent injector's `CNGX_SIDENAV_CONFIG` value (resolves through the
 * priority chain - root provider, library defaults, or another
 * `provideSidenavConfigAt` further up) and deep-merges the supplied features on
 * top. Descendant sidenav instances see the merged config; sibling sub-trees
 * keep the inherited value untouched.
 *
 * ```ts
 * @Component({
 *   viewProviders: [
 *     provideSidenavConfigAt(withSidenavDimensions({ width: '320px' })),
 *   ],
 *   template: '<cngx-sidenav>...</cngx-sidenav>',
 * })
 * class Section {}
 * ```
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export function provideSidenavConfigAt(
  ...features: CngxSidenavConfigFeature[]
): Provider[] {
  // Empty-features call: parent value flows through untouched. Skipping the
  // factory preserves reference identity through the sub-tree.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_SIDENAV_CONFIG,
      useFactory: () => {
        const parent = inject(CNGX_SIDENAV_CONFIG, { skipSelf: true });
        return mergeConfig(parent, partial);
      },
    },
  ];
}
