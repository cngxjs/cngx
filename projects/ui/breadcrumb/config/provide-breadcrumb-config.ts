import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxBreadcrumbConfig } from './breadcrumb.config';
import {
  CNGX_BREADCRUMB_CONFIG,
  CNGX_BREADCRUMB_DEFAULTS,
} from './breadcrumb.config.defaults';

/**
 * Discriminated-union shape returned by `withBreadcrumbAriaLabels` /
 * `withBreadcrumbDataKey`. The reducer in `provideBreadcrumbConfig` /
 * `provideBreadcrumbConfigAt` matches on `kind` and merges `payload` into the
 * corresponding config sub-tree. Mirrors `CngxTagConfigFeature` from
 * `@cngx/common/display` so the consumer's mental model is one across feature
 * areas.
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export type CngxBreadcrumbConfigFeature =
  | {
      readonly kind: 'ariaLabels';
      readonly payload: NonNullable<CngxBreadcrumbConfig['ariaLabels']>;
    }
  | {
      readonly kind: 'router';
      readonly payload: NonNullable<CngxBreadcrumbConfig['router']>;
    }
  | {
      readonly kind: 'skin';
      readonly payload: { readonly skin: NonNullable<CngxBreadcrumbConfig['skin']> };
    };

/**
 * Reduces a list of feature objects into a partial config - last write wins
 * per sub-tree. Inner objects are spread-merged so partial overrides compose
 * cleanly with prior writes.
 *
 * @internal
 */
function reduceFeatures(
  features: readonly CngxBreadcrumbConfigFeature[],
): Partial<CngxBreadcrumbConfig> {
  const out: {
    ariaLabels?: NonNullable<CngxBreadcrumbConfig['ariaLabels']>;
    router?: NonNullable<CngxBreadcrumbConfig['router']>;
    skin?: NonNullable<CngxBreadcrumbConfig['skin']>;
  } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'ariaLabels':
        out.ariaLabels = { ...out.ariaLabels, ...f.payload };
        break;
      case 'router':
        out.router = { ...out.router, ...f.payload };
        break;
      case 'skin':
        out.skin = f.payload.skin;
        break;
    }
  }
  return out;
}

/**
 * Two-level deep merge: nested sub-tree keys (`ariaLabels` / `router`) are
 * spread-merged so the partial fills in missing keys without nuking unrelated
 * config sub-trees; the flat top-level scalar `skin` takes the partial when
 * present, else the base. Inner objects are flat (one level), so a single
 * spread per key suffices. Invariant: a config key nested more than one level
 * deep would shallow-merge silently here - if the config ever grows a nested
 * sub-tree, add a dedicated spread for it rather than relying on this pass.
 *
 * @internal
 */
function mergeConfig(
  base: CngxBreadcrumbConfig,
  partial: Partial<CngxBreadcrumbConfig>,
): CngxBreadcrumbConfig {
  return {
    ariaLabels: { ...base.ariaLabels, ...partial.ariaLabels },
    router: { ...base.router, ...partial.router },
    skin: partial.skin ?? base.skin,
  };
}

/**
 * Application-root configuration cascade for the breadcrumb family. Pass any
 * combination of `withBreadcrumbAriaLabels` / `withBreadcrumbDataKey` features
 * in `bootstrapApplication`'s providers array.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding.
 *   2. `provideBreadcrumbConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideBreadcrumbConfig(...)` at the application root.
 *   4. Library defaults (`CNGX_BREADCRUMB_DEFAULTS`).
 *
 * The provider deep-merges supplied features with the library defaults so
 * consumers only declare keys they want to override.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideBreadcrumbConfig(
 *       withBreadcrumbAriaLabels({ bar: 'Navigation trail' }),
 *       withBreadcrumbDataKey('crumb'),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export function provideBreadcrumbConfig(
  ...features: CngxBreadcrumbConfigFeature[]
): EnvironmentProviders {
  // Empty-features: skip the override so the root factory's
  // CNGX_BREADCRUMB_DEFAULTS reference flows through untouched. A fresh
  // mergeConfig(...) would allocate identical content under a new reference
  // and bust downstream identity comparisons.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  const partial = reduceFeatures(features);
  return makeEnvironmentProviders([
    {
      provide: CNGX_BREADCRUMB_CONFIG,
      useValue: mergeConfig(CNGX_BREADCRUMB_DEFAULTS, partial),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the breadcrumb family. Pass any
 * combination of feature factories in a parent component's `viewProviders`
 * array.
 *
 * Unlike `provideBreadcrumbConfig` (root-only), `provideBreadcrumbConfigAt`
 * injects the parent injector's `CNGX_BREADCRUMB_CONFIG` value (resolves
 * through the priority chain - root provider, library defaults, or another
 * `provideBreadcrumbConfigAt` further up) and deep-merges the supplied
 * features on top. Descendant breadcrumb instances see the merged config;
 * sibling sub-trees keep the inherited value untouched.
 *
 * ```ts
 * @Component({
 *   viewProviders: [
 *     provideBreadcrumbConfigAt(withBreadcrumbAriaLabels({ bar: 'Trail' })),
 *   ],
 *   template: '<cngx-breadcrumb [items]="crumbs" />',
 * })
 * class Section {}
 * ```
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export function provideBreadcrumbConfigAt(
  ...features: CngxBreadcrumbConfigFeature[]
): Provider[] {
  // Empty-features call: parent value flows through untouched. Skipping the
  // factory preserves reference identity through the sub-tree.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_BREADCRUMB_CONFIG,
      useFactory: () => {
        const parent = inject(CNGX_BREADCRUMB_CONFIG, { skipSelf: true });
        return mergeConfig(parent, partial);
      },
    },
  ];
}
