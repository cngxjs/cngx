// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The menu-button section of a {@link CngxLanguagePack}. Same keys as
 * {@link CngxMenuButtonI18n}: the names the menu buttons fall back to when
 * the consumer sets none.
 *
 * @since 0.1.0
 * @relatedTo CngxIconMenuButton, CngxSplitButton
 */
export interface CngxMenuButtonLanguageSection {
  /**
   * Accessible name of an icon menu button inside a split button, the caret
   * that opens the alternative actions. Outside a split button the consumer
   * names the icon menu button.
   */
  readonly splitToggle: string;
}

/**
 * The English menu-button section: the single source of the menu buttons'
 * English copy. `CNGX_MENU_BUTTON_I18N` defaults to it, and the shipped
 * English pack is built from it.
 *
 * @since 0.1.0
 * @relatedTo CNGX_MENU_BUTTON_I18N
 */
export const CNGX_MENU_BUTTON_LANGUAGE_EN: CngxMenuButtonLanguageSection = {
  splitToggle: 'More options',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly menuButton: CngxMenuButtonLanguageSection;
  }
}
