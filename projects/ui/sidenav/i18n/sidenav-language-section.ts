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
  /** `{width}`: the rail width in CSS pixels, spoken as the separator's value. */
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
  resizeValueText: '{width} pixels',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly sidenav: CngxSidenavLanguageSection;
  }
}
