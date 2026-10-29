/**
 * @module @cngx/common/menu-button
 */
export { CngxMenuButton } from './menu-button.component';
export { CngxIconMenuButton } from './icon-menu-button.component';
export { CngxSplitButton } from './split-button.directive';
export { CNGX_SPLIT_BUTTON, type CngxSplitButtonContext } from './split-button.token';
export { CNGX_BUTTON_CARET_ICON } from './caret-icon.token';
export {
  CNGX_MENU_BUTTON_I18N,
  type CngxMenuButtonI18n,
  type CngxMenuButtonI18nFeature,
  withMenuButtonI18nLabels,
  provideMenuButtonI18n,
  injectMenuButtonI18n,
} from './i18n/menu-button-i18n';
export {
  CNGX_MENU_BUTTON_LANGUAGE_EN,
  type CngxMenuButtonLanguageSection,
} from './i18n/menu-button-language-section';
