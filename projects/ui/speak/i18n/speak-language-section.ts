/**
 * The speak section of a {@link CngxLanguagePack}: the accessible names of
 * `CngxSpeakButton`. It feeds `CNGX_SPEAK_I18N`; a key set through
 * `withSpeakI18nLabels` still wins.
 *
 * @category ui/speak/i18n
 * @since 0.1.0
 * @relatedTo CNGX_SPEAK_I18N, withSpeakI18nLabels
 */
export interface CngxSpeakLanguageSection {
  /** Accessible name of the speak button while idle. */
  readonly readAloud: string;
  /** Accessible name of the speak button while speaking. */
  readonly stopSpeaking: string;
}

/**
 * The English speak section: the single source of the speak button's English
 * copy. `CNGX_SPEAK_I18N` defaults to it.
 *
 * @category ui/speak/i18n
 * @since 0.1.0
 * @relatedTo CNGX_SPEAK_I18N
 */
export const CNGX_SPEAK_LANGUAGE_EN: CngxSpeakLanguageSection = {
  readAloud: 'Read aloud',
  stopSpeaking: 'Stop speaking',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly speak: CngxSpeakLanguageSection;
  }
}
