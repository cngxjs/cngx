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
 * `input ?? fixed ?? group ?? config ?? default`, high to low:
 *
 * 1. The per-instance input: `cngxButton="outline"`, `[tone]`, `[size]`.
 * 2. The axes the host pins through `provideButtonHost(..., { fixed })`. The close button pins
 *    `ghost`, `sm` and `neutral`.
 * 3. A surrounding button group (`CNGX_BUTTON_GROUP`), for variant and size. Tone skips it.
 * 4. `provideButtonConfigAt(...)` in a parent component's `viewProviders`.
 * 5. `provideButtonConfig(...)` at the application root.
 * 6. The host default: its `defaultVariant`, `neutral` and `md`. `CngxIconButton` and
 *    `CngxIconMenuButton` default their variant to `ghost`.
 *
 * Every key is optional. An unset key falls through to the host default, which is how the icon
 * buttons keep `ghost` unless the app picks a variant for the whole family.
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
 * `provideCngxButton` drops one without it ([`CNGX1041`](/error-codes/cngx1041.md)).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 */
export interface CngxButtonConfigFeature {
  readonly _target: 'config';
  readonly config: CngxButtonConfig;
}

/**
 * Default emphasis for every button in scope. Pass it to `provideButtonConfig`,
 * `provideButtonConfigAt` or `provideCngxButton(At)`. It fills the config step of the
 * resolution order in `CngxButtonConfig`, so an input, a pinned axis or a group still wins.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, provideCngxButton
 */
export function withButtonVariant(variant: CngxButtonVariant): CngxButtonConfigFeature {
  return { _target: 'config', config: { variant } };
}

/**
 * Default intent for every button in scope. Pass it to `provideButtonConfig`,
 * `provideButtonConfigAt` or `provideCngxButton(At)`. An input or a pinned tone still wins, so
 * the close button stays `neutral`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, provideCngxButton
 */
export function withButtonTone(tone: CngxButtonTone): CngxButtonConfigFeature {
  return { _target: 'config', config: { tone } };
}

/**
 * Default size for every button in scope. Pass it to `provideButtonConfig`,
 * `provideButtonConfigAt` or `provideCngxButton(At)`. An input, a pinned size or a group still
 * wins.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo provideButtonConfig, provideCngxButton
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
 * Reads the button config resolved for the current injector. For custom hosts and segments
 * that size themselves like a button, as `CngxButtonGroupAddon` does. Runs in an injection
 * context.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button-config.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CONFIG, provideButtonConfig
 */
export function injectButtonConfig(): CngxButtonConfig {
  return inject(CNGX_BUTTON_CONFIG);
}
