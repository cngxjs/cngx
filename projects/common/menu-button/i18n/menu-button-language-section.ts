// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The `menuButton` section of a `CngxLanguagePack`: the copy a split caret falls back to
 * when the consumer sets none.
 *
 * @since 0.1.0
 * @relatedTo CngxIconMenuButton, CngxSplitButton
 */
export interface CngxMenuButtonLanguageSection {
  /** Accessible name of a split caret. An `aria-label` on the caret wins. */
  readonly splitToggle: string;
  /**
   * Description of the split caret while the main action runs, referenced through
   * `aria-describedby`, never part of the name.
   */
  readonly splitMainBusy: string;
}

/**
 * The English `menuButton` section. `CNGX_MENU_BUTTON_I18N` defaults to it, and the shipped
 * English pack is built from it.
 *
 * @since 0.1.0
 * @relatedTo CNGX_MENU_BUTTON_I18N
 */
export const CNGX_MENU_BUTTON_LANGUAGE_EN: CngxMenuButtonLanguageSection = {
  splitToggle: 'More options',
  splitMainBusy: 'The main action is running',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly menuButton: CngxMenuButtonLanguageSection;
  }
}
