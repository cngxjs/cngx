import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxTagConfig } from './tag.config';
import {
  CNGX_TAG_CONFIG,
  CNGX_TAG_DEFAULTS,
} from './tag.config.defaults';

/**
 * Discriminated-union shape returned by `withTagDefaults` /
 * `withTagGroupDefaults` / `withTagColors` / `withTagSlots`. The
 * reducer in `provideTagConfig` / `provideTagConfigAt` matches on
 * `kind` and merges `payload` into the corresponding config sub-tree.
 *
 * Mirrors the `CngxSelectConfigFeature` discriminated-union shape
 * from `@cngx/forms/select` so the consumer's mental model is one
 * across feature areas.
 *
 * @category display
 */
export type CngxTagConfigFeature =
  | {
      readonly kind: 'defaults';
      readonly payload: NonNullable<CngxTagConfig['defaults']>;
    }
  | {
      readonly kind: 'groupDefaults';
      readonly payload: NonNullable<CngxTagConfig['groupDefaults']>;
    }
  | {
      readonly kind: 'colors';
      readonly payload: NonNullable<CngxTagConfig['colors']>;
    }
  | {
      readonly kind: 'templates';
      readonly payload: NonNullable<CngxTagConfig['templates']>;
    };

/**
 * Reduces a list of feature objects into a partial config — last
 * write wins per sub-tree. Inner objects are spread-merged so
 * partial overrides (e.g. just `variant` without `color`) compose
 * cleanly with prior writes.
 *
 * @internal
 */
function reduceFeatures(
  features: readonly CngxTagConfigFeature[],
): Partial<CngxTagConfig> {
  const out: {
    defaults?: NonNullable<CngxTagConfig['defaults']>;
    groupDefaults?: NonNullable<CngxTagConfig['groupDefaults']>;
    colors?: NonNullable<CngxTagConfig['colors']>;
    templates?: NonNullable<CngxTagConfig['templates']>;
  } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'defaults':
        out.defaults = { ...out.defaults, ...f.payload };
        break;
      case 'groupDefaults':
        out.groupDefaults = { ...out.groupDefaults, ...f.payload };
        break;
      case 'colors':
        out.colors = { ...out.colors, ...f.payload };
        break;
      case 'templates':
        out.templates = { ...out.templates, ...f.payload };
        break;
    }
  }
  return out;
}

/**
 * Two-level deep merge: top-level keys (`defaults`/`groupDefaults`/
 * `colors`/`templates`/`ariaLabels`) are spread-merged so the
 * partial fills in missing keys without nuking unrelated config
 * sub-trees. Inner objects are flat (no nested objects beyond one
 * level) so a single spread per key is sufficient.
 *
 * @internal
 */
function mergeConfig(
  base: CngxTagConfig,
  partial: Partial<CngxTagConfig>,
): CngxTagConfig {
  return {
    defaults: { ...base.defaults, ...partial.defaults },
    groupDefaults: { ...base.groupDefaults, ...partial.groupDefaults },
    colors: { ...base.colors, ...partial.colors },
    templates: { ...base.templates, ...partial.templates },
  };
}

/**
 * Application-root configuration cascade for the tag family. Pass
 * any combination of `withTagDefaults` / `withTagGroupDefaults` /
 * `withTagColors` / `withTagSlots` features in
 * `bootstrapApplication`'s providers array.
 *
 * Resolution priority (high → low):
 *   1. Per-instance Input binding.
 *   2. `provideTagConfigAt(...)` in a parent component's
 *      `viewProviders`.
 *   3. `provideTagConfig(...)` at the application root.
 *   4. Library defaults (`CNGX_TAG_DEFAULTS`).
 *
 * The provider deep-merges supplied features with the library
 * defaults so consumers only declare keys they want to override.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTagConfig(
 *       withTagDefaults({ variant: 'subtle' }),
 *       withTagColors({
 *         'my-brand': {
 *           bg: '#4f46e5',
 *           color: '#ffffff',
 *           border: 'transparent',
 *         },
 *       }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category display
 */
export function provideTagConfig(
  ...features: CngxTagConfigFeature[]
): EnvironmentProviders {
  // Empty-features call: don't override the token. The root factory
  // already returns `CNGX_TAG_DEFAULTS` — re-providing a fresh
  // `mergeConfig(...)` would allocate identical content under a new
  // reference and bust downstream identity comparisons that consumers
  // of `injectTagConfig()` may rely on.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  const partial = reduceFeatures(features);
  return makeEnvironmentProviders([
    {
      provide: CNGX_TAG_CONFIG,
      useValue: mergeConfig(CNGX_TAG_DEFAULTS, partial),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the tag family. Pass
 * any combination of feature factories in a parent component's
 * `viewProviders` array.
 *
 * Unlike `provideTagConfig` (root-only), `provideTagConfigAt` injects
 * the parent injector's `CNGX_TAG_CONFIG` value (resolves through
 * the priority chain — root provider, library defaults, or another
 * `provideTagConfigAt` further up) and deep-merges the supplied
 * features on top. This produces cumulative cascade behaviour:
 * descendant tag instances see the merged config, sibling sub-trees
 * keep the inherited value untouched.
 *
 * @example
 * ```ts
 * @Component({
 *   selector: 'admin-section',
 *   viewProviders: [
 *     provideTagConfigAt(
 *       withTagDefaults({ size: 'sm' }),
 *     ),
 *   ],
 *   template: '<span cngxTag>Compact</span>',
 * })
 * class AdminSection {}
 * ```
 *
 * @category display
 */
export function provideTagConfigAt(
  ...features: CngxTagConfigFeature[]
): Provider[] {
  // Empty-features call: parent value flows through untouched.
  // Skipping the factory preserves reference identity through the
  // sub-tree.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_TAG_CONFIG,
      useFactory: () => {
        const parent = inject(CNGX_TAG_CONFIG, { skipSelf: true });
        return mergeConfig(parent, partial);
      },
    },
  ];
}
