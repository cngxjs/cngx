// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The menu section of a {@link CngxLanguagePack}: what the menu family
 * announces. It feeds the `ariaLabels` of `CNGX_MENU_CONFIG`.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 * @relatedTo CNGX_MENU_CONFIG
 */
export interface CngxMenuLanguageSection {
  readonly submenuOpened: string;
  readonly submenuClosed: string;
  readonly itemActivated: string;
  readonly itemDisabled: string;
  readonly menuDismissed: string;
}

/**
 * The English menu section: the single source of the menu's English copy.
 * `CNGX_MENU_CONFIG` defaults its `ariaLabels` to it.
 *
 * @category common/interactive/i18n
 * @since 0.1.0
 * @relatedTo CNGX_MENU_CONFIG
 */
export const CNGX_MENU_LANGUAGE_EN: CngxMenuLanguageSection = {
  submenuOpened: 'Submenu opened',
  submenuClosed: 'Submenu closed',
  itemActivated: 'Item activated',
  itemDisabled: 'Item disabled',
  menuDismissed: 'Menu dismissed',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly menu: CngxMenuLanguageSection;
  }
}
