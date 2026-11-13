import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxButtonSize, CngxButtonTone, CngxButtonVariant } from './button.types';

/**
 * Defaults for every host on `CngxButtonBrain`. Each axis resolves
 * `input ?? fixed ?? group ?? config ?? default` (README, "Axes"). An unset key falls through to
 * the host default, which is how the icon buttons keep `ghost` unless the app picks a variant.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, provideButtonConfigAt, injectButtonConfig
 */
export interface CngxButtonConfig {
  readonly variant?: CngxButtonVariant;
  readonly tone?: CngxButtonTone;
  readonly size?: CngxButtonSize;
}

/**
 * The resolved {@link CngxButtonConfig}. Empty by default.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, injectButtonConfig, withButtonVariant, withButtonTone, withButtonSize
 */
export const CNGX_BUTTON_CONFIG = new InjectionToken<CngxButtonConfig>('CngxButtonConfig', {
  providedIn: 'root',
  factory: (): CngxButtonConfig => ({}),
});

/**
 * Feature returned by a `withButton*` config function. A hand-built one needs
 * `_target: 'config'`, or `provideCngxButton` drops it ([`CNGX1041`](/error-codes/cngx1041.md)).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, provideButtonConfigAt
 */
export interface CngxButtonConfigFeature {
  readonly _target: 'config';
  readonly config: CngxButtonConfig;
}

/**
 * Default emphasis in scope. An input, a pinned axis or a group still wins.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, provideButtonConfigAt, provideCngxButton
 */
export function withButtonVariant(variant: CngxButtonVariant): CngxButtonConfigFeature {
  return { _target: 'config', config: { variant } };
}

/**
 * Default intent in scope. An input or a pinned tone still wins, so the close button stays
 * `neutral`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, provideButtonConfigAt, provideCngxButton
 */
export function withButtonTone(tone: CngxButtonTone): CngxButtonConfigFeature {
  return { _target: 'config', config: { tone } };
}

/**
 * Default size in scope. An input, a pinned size or a group still wins.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, provideButtonConfigAt, provideCngxButton
 */
export function withButtonSize(size: CngxButtonSize): CngxButtonConfigFeature {
  return { _target: 'config', config: { size } };
}

/** @internal */
function mergeFeatures(
  base: CngxButtonConfig,
  features: readonly CngxButtonConfigFeature[],
): CngxButtonConfig {
  return features.reduce<CngxButtonConfig>((acc, f) => ({ ...acc, ...f.config }), base);
}

/**
 * App-wide button defaults from `withButton*` features.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideButtonConfig(withButtonVariant('outline'), withButtonSize('sm'))],
 * });
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo withButtonVariant, withButtonTone, withButtonSize, provideButtonConfigAt, provideCngxButton
 */
export function provideButtonConfig(...features: CngxButtonConfigFeature[]): EnvironmentProviders {
  if (features.length === 0) {
    return makeEnvironmentProviders([]);
  }
  return makeEnvironmentProviders([
    { provide: CNGX_BUTTON_CONFIG, useValue: mergeFeatures({}, features) },
  ]);
}

/**
 * `viewProviders` twin of {@link provideButtonConfig}. Merges over the parent scope's config, so
 * nested scopes cascade.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, withButtonVariant, withButtonTone, withButtonSize
 */
export function provideButtonConfigAt(...features: CngxButtonConfigFeature[]): Provider[] {
  if (features.length === 0) {
    return [];
  }
  return [
    {
      provide: CNGX_BUTTON_CONFIG,
      useFactory: () => mergeFeatures(inject(CNGX_BUTTON_CONFIG, { skipSelf: true }), features),
    },
  ];
}

/**
 * The config resolved for the current injector. For custom hosts and segments that size
 * themselves like a button, as `CngxButtonGroupAddon` does.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CONFIG, provideButtonConfig
 */
export function injectButtonConfig(): CngxButtonConfig {
  return inject(CNGX_BUTTON_CONFIG);
}
