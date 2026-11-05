import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxButtonSize, CngxButtonTone, CngxButtonVariant } from './button.types';

/**
 * App-wide defaults for the button family: every host on
 * `CngxButtonBrain` (`CngxButton`, `CngxIconButton`, `CngxCloseButton`,
 * `CngxMenuButton`, `CngxIconMenuButton`, `CngxActionButton` and custom
 * hosts).
 *
 * Resolution priority for every axis (high -> low):
 *   1. Per-instance input (`cngxButton="outline"`, `[tone]`, `[size]`).
 *   2. The axes the host pins (`provideButtonHost(..., { fixed })`); the
 *      close button pins `ghost` / `sm` / `neutral`, so it never takes the
 *      group or the config.
 *   3. A surrounding button group (`CNGX_BUTTON_GROUP`, variant and size;
 *      tone skips the group).
 *   4. `provideButtonConfigAt(...)` in a parent component's `viewProviders`.
 *   5. `provideButtonConfig(...)` at the application root.
 *   6. The host default (`defaultVariant` of the host, `neutral`, `md`;
 *      `CngxIconButton` and `CngxIconMenuButton` default their variant to
 *      `ghost`).
 *
 * Every key is optional: an unset key falls through to the host default,
 * which is how the icon buttons keep their own `ghost` default unless the
 * app picks a variant for the whole family.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, provideButtonConfigAt, injectButtonConfig
 */
export interface CngxButtonConfig {
  /** Default emphasis when no input or group sets one. */
  readonly variant?: CngxButtonVariant;
  /** Default intent when no input sets one. */
  readonly tone?: CngxButtonTone;
  /** Default size when no input or group sets one. */
  readonly size?: CngxButtonSize;
}

/**
 * DI token carrying the resolved {@link CngxButtonConfig}. Defaults to an
 * empty object, so every axis falls through to the button class default.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, injectButtonConfig
 */
export const CNGX_BUTTON_CONFIG = new InjectionToken<CngxButtonConfig>('CngxButtonConfig', {
  providedIn: 'root',
  factory: (): CngxButtonConfig => ({}),
});

/**
 * Feature returned by a `withButton*` config function; merged by
 * {@link provideButtonConfig} and {@link provideButtonConfigAt}. The hidden
 * `_target: 'config'` discriminator routes it through `provideCngxButton`.
 * Build features through `withButtonVariant` / `withButtonTone` /
 * `withButtonSize`: a hand-built object needs `_target: 'config'` too, and
 * `provideCngxButton` drops one without it (`CNGX1041`).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export interface CngxButtonConfigFeature {
  readonly _target: 'config';
  readonly config: CngxButtonConfig;
}

/**
 * Default emphasis for every button in scope.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export function withButtonVariant(variant: CngxButtonVariant): CngxButtonConfigFeature {
  return { _target: 'config', config: { variant } };
}

/**
 * Default intent for every button in scope.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export function withButtonTone(tone: CngxButtonTone): CngxButtonConfigFeature {
  return { _target: 'config', config: { tone } };
}

/**
 * Default size for every button in scope.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
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
 * Register app-wide button defaults composed from `withButton*` features.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideButtonConfig(withButtonVariant('outline'), withButtonSize('sm'))],
 * });
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo withButtonVariant, withButtonTone, withButtonSize, provideButtonConfigAt
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
 * Component-scoped twin of {@link provideButtonConfig} for `viewProviders`.
 * Merges the features on top of the config inherited from the parent
 * injector, so nested scopes cascade.
 *
 * ```ts
 * @Component({
 *   selector: 'app-toolbar',
 *   viewProviders: [provideButtonConfigAt(withButtonVariant('ghost'), withButtonSize('sm'))],
 *   template: '<button cngxButton>Edit</button>',
 * })
 * class AppToolbar {}
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig
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
 * Inject the button config resolved for the current injector.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export function injectButtonConfig(): CngxButtonConfig {
  return inject(CNGX_BUTTON_CONFIG);
}
