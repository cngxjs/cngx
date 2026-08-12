import {
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type WritableSignal,
} from '@angular/core';

import { type CngxContrastPreference, injectContrast, provideContrast } from './contrast';
import { type CngxDensityValue, injectDensity, provideDensity } from './density';
import { type CngxMotionPreference, injectMotion, provideMotion } from './motion';
import { type CngxTextScaleValue, injectTextScale, provideTextScale } from './text-scale';

/**
 * A feature for {@link provideAccessibilityPreferences}. Each `with*`
 * helper returns one of these carrying a hidden `_target` discriminator
 * the aggregator dispatches on. This mirrors the Select-family config
 * cascade (`provideCngxSelect`), but the aggregator *reduces* the axis
 * features to one scalar per axis (last-wins on duplicates) and forwards
 * it to the single-arg `provide<Axis>(initial)` rather than bucketing
 * same-kind features.
 *
 * @category core/theming
 * @relatedTo provideAccessibilityPreferences
 * @since 0.1.0
 */
export type CngxA11yPrefFeature =
  | { readonly _target: 'density'; readonly value: CngxDensityValue }
  | { readonly _target: 'textScale'; readonly value: CngxTextScaleValue }
  | { readonly _target: 'motion'; readonly value: CngxMotionPreference }
  | { readonly _target: 'contrast'; readonly value: CngxContrastPreference };

/**
 * Set the initial density rung the aggregator installs. Omitting this
 * feature leaves density at its `comfortable` default.
 *
 * @category core/theming
 * @relatedTo provideAccessibilityPreferences
 * @since 0.1.0
 */
export function withDensity(value: CngxDensityValue): CngxA11yPrefFeature {
  return { _target: 'density', value };
}

/**
 * Set the initial text-scale rung the aggregator installs. Omitting this
 * feature leaves text-scale at its `md` (identity) default.
 *
 * @category core/theming
 * @relatedTo provideAccessibilityPreferences
 * @since 0.1.0
 */
export function withTextScale(value: CngxTextScaleValue): CngxA11yPrefFeature {
  return { _target: 'textScale', value };
}

/**
 * Set the initial motion preference the aggregator installs. Omitting
 * this feature leaves motion at its `auto` default, which follows the OS
 * `prefers-reduced-motion` query.
 *
 * @category core/theming
 * @relatedTo provideAccessibilityPreferences
 * @since 0.1.0
 */
export function withMotion(value: CngxMotionPreference): CngxA11yPrefFeature {
  return { _target: 'motion', value };
}

/**
 * Set the initial contrast preference the aggregator installs. Omitting
 * this feature leaves contrast at its `auto` default, which follows the
 * OS `prefers-contrast` query.
 *
 * @category core/theming
 * @relatedTo provideAccessibilityPreferences
 * @since 0.1.0
 */
export function withContrast(value: CngxContrastPreference): CngxA11yPrefFeature {
  return { _target: 'contrast', value };
}

/**
 * Install all four accessibility axes (density, text-scale, motion,
 * contrast) behind one call. Each axis is set from its matching `with*`
 * feature, or left at its own library default when the feature is
 * omitted. Duplicate axis features are last-wins.
 *
 * This is composition over configuration (Pillar 3): the aggregator only
 * forwards the resolved initials to the existing `provideDensity` /
 * `provideTextScale` / `provideMotion` / `provideContrast`, so no
 * reflector logic is duplicated. The accessibility panel then binds to
 * the four writable signals via {@link injectA11yPreferences}.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideAccessibilityPreferences(withTextScale('lg'), withMotion('reduced')),
 *   ],
 * });
 * ```
 *
 * @category core/theming
 * @relatedTo injectA11yPreferences
 * @relatedTo withDensity
 * @relatedTo withTextScale
 * @relatedTo withMotion
 * @relatedTo withContrast
 * @since 0.1.0
 */
export function provideAccessibilityPreferences(
  ...features: CngxA11yPrefFeature[]
): EnvironmentProviders {
  let density: CngxDensityValue | undefined;
  let textScale: CngxTextScaleValue | undefined;
  let motion: CngxMotionPreference | undefined;
  let contrast: CngxContrastPreference | undefined;

  for (const feature of features) {
    switch (feature._target) {
      case 'density':
        density = feature.value;
        break;
      case 'textScale':
        textScale = feature.value;
        break;
      case 'motion':
        motion = feature.value;
        break;
      case 'contrast':
        contrast = feature.value;
        break;
    }
  }

  // `undefined` triggers each provider's default parameter, so an omitted
  // axis keeps its own library default without re-stating it here.
  return makeEnvironmentProviders([
    provideDensity(density),
    provideTextScale(textScale),
    provideMotion(motion),
    provideContrast(contrast),
  ]);
}

/**
 * Read the four accessibility-axis signals as one bundle in an injection
 * context. Each is the same `WritableSignal` the axis token holds, so the
 * accessibility panel both reads current state and writes user choices
 * through it (`injectA11yPreferences().motion.set('reduced')`).
 *
 * @category core/theming
 * @relatedTo provideAccessibilityPreferences
 * @since 0.1.0
 */
export function injectA11yPreferences(): {
  readonly density: WritableSignal<CngxDensityValue>;
  readonly textScale: WritableSignal<CngxTextScaleValue>;
  readonly motion: WritableSignal<CngxMotionPreference>;
  readonly contrast: WritableSignal<CngxContrastPreference>;
} {
  return {
    density: injectDensity(),
    textScale: injectTextScale(),
    motion: injectMotion(),
    contrast: injectContrast(),
  };
}
