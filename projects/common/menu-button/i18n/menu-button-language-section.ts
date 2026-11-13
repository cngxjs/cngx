// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The `menuButton` section of a `CngxLanguagePack`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/i18n/menu-button-language-section.ts
 * @since 0.1.0
 * @relatedTo CNGX_MENU_BUTTON_I18N, CNGX_MENU_BUTTON_LANGUAGE_EN
 */
export interface CngxMenuButtonLanguageSection {
  /** Accessible name of a split caret. An `aria-label` on the caret wins. */
  readonly splitToggle: string;
  /** Description of the split caret while the main action runs, never part of its name. */
  readonly splitMainBusy: string;
}

/**
 * The English `menuButton` section, the default of `CNGX_MENU_BUTTON_I18N`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/i18n/menu-button-language-section.ts
 * @since 0.1.0
 * @relatedTo CNGX_MENU_BUTTON_I18N, CngxMenuButtonLanguageSection
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
