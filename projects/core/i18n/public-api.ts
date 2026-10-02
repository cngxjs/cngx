/**
 * @module @cngx/core/i18n
 */
export type {
  CngxLanguagePack,
  CngxLanguagePackMeta,
  CngxPluralMessage,
  CngxPartialSections,
  CngxPartialLanguagePack,
} from './language-pack';
export {
  formatMessage,
  type CngxMessage,
  type CngxMessageArgs,
  type CngxMessageFn,
} from './format-message';
export {
  CNGX_LANGUAGE_PACK,
  injectLanguageSection,
  provideCngxI18n,
  withPack,
  withPartialPack,
  withDocumentLanguage,
  type CngxActiveLanguagePack,
  type CngxCompleteLanguagePack,
  type CngxI18nFeature,
} from './provide-i18n';
