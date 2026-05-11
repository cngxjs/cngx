import {
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Optional,
  type EnvironmentProviders,
  type Provider,
  SkipSelf,
} from '@angular/core';

/**
 * Localised UI strings the menu announces or otherwise renders. English by
 * default; consumers override via {@link withAriaLabels}.
 *
 * @category interactive
 */
export interface CngxMenuAriaLabels {
  readonly submenuOpened: string;
  readonly submenuClosed: string;
  readonly itemActivated: string;
  readonly itemDisabled: string;
}

/**
 * Resolved configuration consumed by every menu directive in the family.
 * Default values live in {@link DEFAULT_MENU_CONFIG}; override at app
 * scope via {@link provideMenuConfig} or per-component via
 * {@link provideMenuConfigAt}.
 *
 * @category interactive
 */
export interface CngxMenuConfig {
  readonly ariaLabels: CngxMenuAriaLabels;
  readonly typeaheadDebounce: number;
  readonly submenuOpenDelay: number;
  readonly submenuCloseDelay: number;
  readonly closeOnSelect: boolean;
}

/**
 * Single feature-flag function consumed by {@link provideMenuConfig} and
 * {@link provideCngxMenu}. Carries a hidden `_target` discriminator so
 * future config surfaces (e.g. submenu-only or announcer overrides) can
 * compose through the same `provideCngxMenu` aggregator without breaking
 * the public API of existing `with*` features.
 */
export type CngxMenuConfigFeature = ((config: CngxMenuConfig) => CngxMenuConfig) & {
  readonly _target?: 'config';
};

/**
 * Internal helper that brands a config-mutator function with the `_target`
 * discriminator. Every `with*` feature returns one of these.
 *
 * @internal
 */
export function defineMenuConfigFeature(
  fn: (config: CngxMenuConfig) => CngxMenuConfig,
): CngxMenuConfigFeature {
  return Object.assign(fn, { _target: 'config' as const });
}

/**
 * Library-default menu configuration. **English-only** — German (or any
 * other locale) is consumer-supplied via `withAriaLabels` per the
 * `feedback_en_default_locale` rule.
 */
export const DEFAULT_MENU_CONFIG: CngxMenuConfig = {
  ariaLabels: {
    submenuOpened: 'Submenu opened',
    submenuClosed: 'Submenu closed',
    itemActivated: 'Item activated',
    itemDisabled: 'Item disabled',
  },
  typeaheadDebounce: 300,
  submenuOpenDelay: 0,
  submenuCloseDelay: 150,
  closeOnSelect: true,
};

/**
 * DI token carrying the resolved {@link CngxMenuConfig}. Defaults to
 * {@link DEFAULT_MENU_CONFIG} at root; override via {@link provideMenuConfig}
 * (app-wide) or {@link provideMenuConfigAt} (component scope via
 * `viewProviders`).
 *
 * @category interactive
 */
export const CNGX_MENU_CONFIG = new InjectionToken<CngxMenuConfig>('CngxMenuConfig', {
  providedIn: 'root',
  factory: () => DEFAULT_MENU_CONFIG,
});

function applyFeatures(base: CngxMenuConfig, features: readonly CngxMenuConfigFeature[]): CngxMenuConfig {
  return features.reduce((cfg, feature) => feature(cfg), base);
}

/**
 * Provide a menu configuration at app root. Each feature is a partial
 * override produced by `with*` helpers (see `menu-config-features.ts`).
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideMenuConfig(
 *       withAriaLabels({ submenuOpened: 'Untermenü geöffnet' }),
 *       withTypeaheadDebounce(500),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export function provideMenuConfig(...features: CngxMenuConfigFeature[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CNGX_MENU_CONFIG,
      useFactory: () => applyFeatures(DEFAULT_MENU_CONFIG, features),
    },
  ]);
}

/**
 * Component-scoped menu configuration override. Pass into a directive or
 * component's `viewProviders`; features merge on top of the parent
 * config (root or an enclosing scope).
 *
 * @category interactive
 */
export function provideMenuConfigAt(...features: CngxMenuConfigFeature[]): Provider[] {
  return [
    {
      provide: CNGX_MENU_CONFIG,
      useFactory: (parent: CngxMenuConfig | null) =>
        applyFeatures(parent ?? DEFAULT_MENU_CONFIG, features),
      deps: [[new SkipSelf(), new Optional(), CNGX_MENU_CONFIG]],
    },
  ];
}

/**
 * Resolves the {@link CngxMenuConfig} from the current injection scope.
 * Must run inside an injection context.
 *
 * @category interactive
 */
export function injectMenuConfig(): CngxMenuConfig {
  return inject(CNGX_MENU_CONFIG);
}
