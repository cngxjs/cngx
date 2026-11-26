import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
  type Signal,
} from '@angular/core';

import { createOverrideMerge } from '@cngx/core/utils';

import type { CngxSidenavConfig, CngxSidenavLabels } from './sidenav.config';
import { CNGX_SIDENAV_CONFIG, CNGX_SIDENAV_DEFAULTS } from './sidenav.config.defaults';

const NO_LABELS: Partial<CngxSidenavLabels> = {};

/**
 * Discriminated-union shape returned by the six sidenav config features -
 * `withSidenavDimensions`, `withSidenavShortcut`, `withSidenavHoverDwell`,
 * `withSidenavRouterSync`, `withSidenavLabels` and `withSidenavPersistence`.
 * The reducer in `provideSidenavConfig` / `provideSidenavConfigAt` matches on
 * `kind`: `dimensions`, `hover`, `routerSync` and `labels` merge per key,
 * `shortcut` and `persistence` replace. Mirrors `CngxBreadcrumbConfigFeature` from
 * `@cngx/ui/breadcrumb` (nested-sub-tree style; the stepper family uses flat
 * scalar keys instead).
 *
 * @since 0.3.0
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
      readonly kind: 'routerSync';
      readonly payload: NonNullable<CngxSidenavConfig['routerSync']>;
    }
  | {
      readonly kind: 'shortcut';
      readonly payload: { readonly shortcut: string };
    }
  | {
      readonly kind: 'persistence';
      readonly payload: NonNullable<CngxSidenavConfig['persistence']>;
    }
  | {
      readonly kind: 'labels';
      readonly payload: {
        readonly labels: Partial<CngxSidenavLabels> | Signal<Partial<CngxSidenavLabels>>;
      };
    };

/**
 * Reduces a list of feature objects into a partial config - last write wins
 * per sub-tree. The nested `dimensions` / `hover` sub-trees are spread-merged
 * so partial overrides compose cleanly with prior writes.
 *
 * @internal
 */
function reduceFeatures(features: readonly CngxSidenavConfigFeature[]): Partial<CngxSidenavConfig> {
  const out: {
    dimensions?: NonNullable<CngxSidenavConfig['dimensions']>;
    hover?: NonNullable<CngxSidenavConfig['hover']>;
    routerSync?: NonNullable<CngxSidenavConfig['routerSync']>;
    shortcut?: string;
    labels?: CngxSidenavConfig['labels'];
    persistence?: CngxSidenavConfig['persistence'];
  } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'dimensions':
        out.dimensions = { ...out.dimensions, ...f.payload };
        break;
      case 'hover':
        out.hover = { ...out.hover, ...f.payload };
        break;
      case 'routerSync':
        out.routerSync = { ...out.routerSync, ...f.payload };
        break;
      case 'shortcut':
        out.shortcut = f.payload.shortcut;
        break;
      case 'labels':
        out.labels = createOverrideMerge(out.labels ?? NO_LABELS, f.payload.labels);
        break;
      case 'persistence':
        out.persistence = f.payload;
        break;
    }
  }
  return out;
}

/**
 * Two-level merge: `dimensions`, `hover` and `routerSync` are spread-merged per
 * key, `labels` merges per key through `createOverrideMerge` (it may be a
 * `Signal`); `shortcut` and `persistence` take the partial when present, else
 * the base. Inner objects are flat (one level),
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
    routerSync: { ...base.routerSync, ...partial.routerSync },
    shortcut: partial.shortcut ?? base.shortcut,
    labels: createOverrideMerge(base.labels ?? NO_LABELS, partial.labels),
    persistence: partial.persistence ?? base.persistence,
  };
}

/**
 * Application-root configuration cascade for the sidenav family. Pass any
 * combination of the `withSidenav*` features in `bootstrapApplication`'s
 * providers array.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding.
 *   2. `provideSidenavConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideSidenavConfig(...)` at the application root.
 *   4. Library defaults.
 *
 * `dimensions`, `hover`, `routerSync` and `labels` merge per key with the
 * library defaults; `shortcut` and `persistence` replace them.
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
 * @since 0.3.0
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
 * `provideSidenavConfigAt` further up) and applies the supplied features on
 * top: `dimensions`, `hover`, `routerSync` and `labels` merge per key,
 * `shortcut` and `persistence` replace. Descendant sidenav instances see the
 * result; sibling sub-trees keep the inherited value untouched. Pass only the
 * keys you set: an explicit `undefined` inside a merged sub-tree overrides
 * the parent.
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
 * @since 0.3.0
 */
export function provideSidenavConfigAt(...features: CngxSidenavConfigFeature[]): Provider[] {
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
