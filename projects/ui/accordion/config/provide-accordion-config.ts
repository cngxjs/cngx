import {
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxAccordionConfig, CngxAccordionSkin } from './accordion.config';
import { CNGX_ACCORDION_CONFIG, CNGX_ACCORDION_DEFAULTS } from './accordion.config.defaults';

/**
 * Discriminated-union shape returned by `withAccordionLabels` /
 * `withDefaultHeadingLevel`. The reducer in `provideAccordionConfig` /
 * `provideAccordionConfigAt` matches on `kind` and writes `payload` onto the
 * corresponding config key. Mirrors `CngxBreadcrumbConfigFeature` from
 * `@cngx/ui/breadcrumb` so the consumer's mental model is one across feature
 * areas.
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export type CngxAccordionConfigFeature =
  | {
      readonly kind: 'labels';
      readonly payload: { readonly disabledReason?: string; readonly errorMessage?: string };
    }
  | { readonly kind: 'headingLevel'; readonly payload: { readonly headingLevel: number } }
  | { readonly kind: 'skin'; readonly payload: { readonly skin: CngxAccordionSkin } }
  | { readonly kind: 'templates'; readonly payload: NonNullable<CngxAccordionConfig['templates']> };

/**
 * Reduces a list of feature objects into a partial config - last write wins per
 * key. `templates` is spread-merged so partial template overrides compose.
 *
 * @internal
 */
function reduceFeatures(
  features: readonly CngxAccordionConfigFeature[],
): Partial<CngxAccordionConfig> {
  const out: {
    disabledReason?: string;
    errorMessage?: string;
    headingLevel?: number;
    skin?: CngxAccordionSkin;
    templates?: NonNullable<CngxAccordionConfig['templates']>;
  } = {};
  for (const f of features) {
    switch (f.kind) {
      case 'labels':
        if (f.payload.disabledReason !== undefined) {
          out.disabledReason = f.payload.disabledReason;
        }
        if (f.payload.errorMessage !== undefined) {
          out.errorMessage = f.payload.errorMessage;
        }
        break;
      case 'headingLevel':
        out.headingLevel = f.payload.headingLevel;
        break;
      case 'skin':
        out.skin = f.payload.skin;
        break;
      case 'templates':
        out.templates = { ...out.templates, ...f.payload };
        break;
    }
  }
  return out;
}

/**
 * Merges a partial config onto a base. Scalars take the partial when present;
 * `templates` is a one-level spread so a partial that sets only some template
 * keys keeps the base's other keys.
 *
 * @internal
 */
function mergeConfig(
  base: CngxAccordionConfig,
  partial: Partial<CngxAccordionConfig>,
): CngxAccordionConfig {
  return {
    disabledReason: partial.disabledReason ?? base.disabledReason,
    errorMessage: partial.errorMessage ?? base.errorMessage,
    headingLevel: partial.headingLevel ?? base.headingLevel,
    skin: partial.skin ?? base.skin,
    templates: { ...base.templates, ...partial.templates },
  };
}

/**
 * Application-root configuration cascade for the accordion. Pass any
 * combination of `withAccordionLabels` / `withDefaultHeadingLevel` features in
 * `bootstrapApplication`'s providers array.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding.
 *   2. `provideAccordionConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideAccordionConfig(...)` at the application root.
 *   4. Library defaults (`CNGX_ACCORDION_DEFAULTS`).
 *
 * The provider merges supplied features with the library defaults so consumers
 * only declare keys they want to override.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideAccordionConfig(
 *       withAccordionLabels({ disabledReason: 'Dieser Abschnitt ist gesperrt.' }),
 *       withDefaultHeadingLevel(2),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function provideAccordionConfig(
  ...features: CngxAccordionConfigFeature[]
): EnvironmentProviders {
  // Empty-features: skip the override so the root factory's
  // CNGX_ACCORDION_DEFAULTS reference flows through untouched. A fresh merge
  // would allocate identical content under a new reference and bust downstream
  // identity comparisons.
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  const partial = reduceFeatures(features);
  return makeEnvironmentProviders([
    {
      provide: CNGX_ACCORDION_CONFIG,
      useValue: mergeConfig(CNGX_ACCORDION_DEFAULTS, partial),
    },
  ]);
}

/**
 * Component-scoped configuration cascade for the accordion. Pass any
 * combination of feature factories in a parent component's `viewProviders`
 * array.
 *
 * Unlike `provideAccordionConfig` (root-only), `provideAccordionConfigAt`
 * injects the parent injector's `CNGX_ACCORDION_CONFIG` value (resolves through
 * the priority chain - root provider, library defaults, or another
 * `provideAccordionConfigAt` further up) and merges the supplied features on
 * top. Descendant accordion instances see the merged config; sibling sub-trees
 * keep the inherited value untouched.
 *
 * ```ts
 * @Component({
 *   viewProviders: [
 *     provideAccordionConfigAt(withAccordionLabels({ disabledReason: 'Locked.' })),
 *   ],
 *   template: '<cngx-accordion-group>...</cngx-accordion-group>',
 * })
 * class Section {}
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function provideAccordionConfigAt(
  ...features: CngxAccordionConfigFeature[]
): Provider[] {
  // Empty-features call: parent value flows through untouched. Skipping the
  // factory preserves reference identity through the sub-tree.
  if (features.length === 0) {
    return [];
  }
  const partial = reduceFeatures(features);
  return [
    {
      provide: CNGX_ACCORDION_CONFIG,
      useFactory: () => {
        const parent = inject(CNGX_ACCORDION_CONFIG, { skipSelf: true });
        return mergeConfig(parent, partial);
      },
    },
  ];
}
