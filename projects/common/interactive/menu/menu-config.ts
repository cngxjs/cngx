import {
  computed,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  Optional,
  type EnvironmentProviders,
  type Provider,
  type Signal,
  SkipSelf,
} from '@angular/core';
import { injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import { CNGX_MENU_LANGUAGE_EN, type CngxMenuLanguageSection } from '../i18n/menu-language-section';

/**
 * Localised UI strings the menu announces or otherwise renders. English by
 * default; consumers override via {@link withAriaLabels}. The same shape as
 * the menu section of a language pack, declared once as
 * {@link CngxMenuLanguageSection}.
 *
 * @category common/interactive/menu
 */
export type CngxMenuAriaLabels = CngxMenuLanguageSection;

/**
 * Resolved configuration consumed by every menu directive in the family.
 * Default values live in {@link DEFAULT_MENU_CONFIG}; override at app
 * scope via {@link provideMenuConfig} or per-component via
 * {@link provideMenuConfigAt}.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuConfig {
  readonly ariaLabels: CngxMenuAriaLabels | Signal<CngxMenuAriaLabels>;
  readonly typeaheadDebounce: number;
  /** Hover dwell (ms) before a hovered submenu parent opens. Default `0`. */
  readonly submenuOpenDelay: number;
  /**
   * Hover dwell (ms) before a hover-opened submenu closes once the pointer
   * has left both the parent item and the popover. Default `150`.
   */
  readonly submenuCloseDelay: number;
  readonly closeOnSelect: boolean;
  /**
   * Whether `pointerdown` outside both the menu's popover and the
   * trigger host dismisses the menu. Native context menus, browser
   * right-click menus, and major web apps all close on outside click.
   * Default `true`.
   */
  readonly dismissOnOutsideClick: boolean;
  /**
   * Whether window `scroll` while the menu is open dismisses it. Default
   * `false` - consumers with scrollable menu panels (long lists,
   * treeselect-style) often want the menu to remain anchored during
   * scroll. Opt in via {@link withDismissOnScroll}.
   */
  readonly dismissOnScroll: boolean;
  /**
   * Whether the "context lost" bundle dismisses the menu. The bundle
   * covers BOTH window `blur` (system notification, OS-native menu
   * overlaying, tab switch) AND document `pointercancel` outside the
   * popover and trigger host (palm rejection on touch devices,
   * gesture cancelled by the browser). The two sources share one
   * toggle by design; consumers needing one without the other replace
   * the entire handler via {@link CNGX_MENU_DISMISS_HANDLER_FACTORY}.
   * Default `true`.
   */
  readonly dismissOnBlur: boolean;
}

/**
 * Single feature-flag function consumed by {@link provideMenuConfig} and
 * {@link provideCngxMenu}. Carries a hidden `_target` discriminator so
 * future config surfaces (e.g. submenu-only or announcer overrides) can
 * compose through the same `provideCngxMenu` aggregator without breaking
 * the public API of existing `with*` features.
 *
 * @category common/interactive/menu
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
 * Library-default menu configuration with the English labels. The token's
 * default reads `ariaLabels` from the menu section of the active language
 * pack instead; `withAriaLabels` overrides single labels on top.
 *
 * @category common/interactive/menu
 */
export const DEFAULT_MENU_CONFIG: CngxMenuConfig = {
  ariaLabels: CNGX_MENU_LANGUAGE_EN,
  typeaheadDebounce: 300,
  submenuOpenDelay: 0,
  submenuCloseDelay: 150,
  closeOnSelect: true,
  dismissOnOutsideClick: true,
  dismissOnScroll: false,
  dismissOnBlur: true,
};

const NO_SECTION: Partial<CngxMenuLanguageSection> = {};

/**
 * @internal {@link DEFAULT_MENU_CONFIG} with `ariaLabels` read from the menu
 * section of the active language pack. Runs in an injection context.
 */
function menuConfigDefaultsFromPack(): CngxMenuConfig {
  const pack = injectLanguageSection('menu');
  return {
    ...DEFAULT_MENU_CONFIG,
    ariaLabels: createOverrideMerge(
      CNGX_MENU_LANGUAGE_EN,
      computed(() => pack() ?? NO_SECTION),
    ),
  };
}

/**
 * DI token carrying the resolved {@link CngxMenuConfig}. Defaults to
 * {@link DEFAULT_MENU_CONFIG} with the language pack's labels at root;
 * override via {@link provideMenuConfig} (app-wide) or
 * {@link provideMenuConfigAt} (component scope via `viewProviders`).
 *
 * @category common/interactive/menu
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-config.ts
 * @since 0.1.0
 */
export const CNGX_MENU_CONFIG = new InjectionToken<CngxMenuConfig>('CngxMenuConfig', {
  providedIn: 'root',
  factory: menuConfigDefaultsFromPack,
});

/** @internal */
function applyFeatures(
  base: CngxMenuConfig,
  features: readonly CngxMenuConfigFeature[],
): CngxMenuConfig {
  return features.reduce((cfg, feature) => feature(cfg), base);
}

/**
 * Provide a menu configuration at app root. Each feature is a partial
 * override produced by `with*` helpers (see `menu-config-features.ts`).
 *
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
 * @category common/interactive/menu
 */
export function provideMenuConfig(...features: CngxMenuConfigFeature[]): EnvironmentProviders {
  return makeEnvironmentProviders([
    {
      provide: CNGX_MENU_CONFIG,
      useFactory: () => applyFeatures(menuConfigDefaultsFromPack(), features),
    },
  ]);
}

/**
 * Component-scoped menu configuration override. Pass into a directive or
 * component's `viewProviders`; features merge on top of the parent
 * config (root or an enclosing scope).
 *
 * @category common/interactive/menu
 */
export function provideMenuConfigAt(...features: CngxMenuConfigFeature[]): Provider[] {
  return [
    {
      provide: CNGX_MENU_CONFIG,
      useFactory: (parent: CngxMenuConfig | null) =>
        applyFeatures(parent ?? menuConfigDefaultsFromPack(), features),
      deps: [[new SkipSelf(), new Optional(), CNGX_MENU_CONFIG]],
    },
  ];
}

/**
 * Resolves the {@link CngxMenuConfig} from the current injection scope.
 * Must run inside an injection context.
 *
 * @category common/interactive/menu
 */
export function injectMenuConfig(): CngxMenuConfig {
  return inject(CNGX_MENU_CONFIG);
}
