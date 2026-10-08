import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The sidenav section of a {@link CngxLanguagePack}: the copy of `CngxSidenav`.
 * It feeds the `labels` of `CNGX_SIDENAV_CONFIG`; a key set through
 * `withSidenavLabels` still wins. Messages use `{name}` placeholders, numbers
 * are formatted for the locale.
 *
 * @category ui/sidenav/i18n
 * @since 0.1.0
 * @relatedTo CNGX_SIDENAV_CONFIG, withSidenavLabels
 */
export interface CngxSidenavLanguageSection {
  /** Accessible name of the resize separator while `[resizeLabel]` is unbound. */
  readonly resizeHandle: string;
  /**
   * `{value}` (the separator position as a percent of its min-max range,
   * formatted in the locale, `40%`), `{percent}` (the rounded number): the
   * separator's `aria-valuetext`.
   */
  readonly resizeValueText: CngxMessage;
}

/**
 * The English sidenav section: the single source of the sidenav's English
 * copy. The `CNGX_SIDENAV_CONFIG` labels default to it.
 *
 * @category ui/sidenav/i18n
 * @since 0.1.0
 * @relatedTo CNGX_SIDENAV_CONFIG
 */
export const CNGX_SIDENAV_LANGUAGE_EN: CngxSidenavLanguageSection = {
  resizeHandle: 'Resize navigation',
  resizeValueText: '{value}',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly sidenav: CngxSidenavLanguageSection;
  }
}
