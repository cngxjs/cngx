import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';

import type { CngxButtonSize, CngxButtonTone, CngxButtonVariant } from './button.types';

/**
 * App-wide defaults for the button family (`CngxButton`, `CngxIconButton`).
 *
 * Resolution priority for every axis (high -> low):
 *   1. Per-instance input (`cngxButton="outline"`, `[tone]`, `[size]`).
 *   2. A surrounding button group (`CNGX_BUTTON_GROUP`, variant and size).
 *   3. `provideButtonConfigAt(...)` in a parent component's `viewProviders`.
 *   4. `provideButtonConfig(...)` at the application root.
 *   5. The library default of the button class (`solid` / `neutral` / `md`;
 *      `CngxIconButton` defaults its variant to `ghost`).
 *
 * Every key is optional: an unset key falls through to the class default,
 * which is how the icon button keeps its own `ghost` default unless the app
 * picks a variant for the whole family.
 *
 * @category common/button
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
 * @category common/button
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, injectButtonConfig
 */
export const CNGX_BUTTON_CONFIG = new InjectionToken<CngxButtonConfig>('CngxButtonConfig', {
  providedIn: 'root',
  factory: (): CngxButtonConfig => ({}),
});

/**
 * Feature returned by a `withButton*` function; merged by
 * {@link provideButtonConfig} and {@link provideButtonConfigAt}.
 *
 * @category common/button
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export interface CngxButtonConfigFeature {
  readonly config: CngxButtonConfig;
}

/**
 * Default emphasis for every button in scope.
 *
 * @category common/button
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export function withButtonVariant(variant: CngxButtonVariant): CngxButtonConfigFeature {
  return { config: { variant } };
}

/**
 * Default intent for every button in scope.
 *
 * @category common/button
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export function withButtonTone(tone: CngxButtonTone): CngxButtonConfigFeature {
  return { config: { tone } };
}

/**
 * Default size for every button in scope.
 *
 * @category common/button
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export function withButtonSize(size: CngxButtonSize): CngxButtonConfigFeature {
  return { config: { size } };
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
 * @category common/button
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
 * @category common/button
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
 * @category common/button
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export function injectButtonConfig(): CngxButtonConfig {
  return inject(CNGX_BUTTON_CONFIG);
}
