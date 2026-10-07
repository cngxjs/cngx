/**
 * The toc section of a {@link CngxLanguagePack}: the accessible names of
 * `CngxToc`. It feeds the `ariaLabels` of `CNGX_TOC_CONFIG`; a key set through
 * `withTocAriaLabels` still wins.
 *
 * @category ui/toc/i18n
 * @since 0.1.0
 * @relatedTo CNGX_TOC_CONFIG, withTocAriaLabels
 */
export interface CngxTocLanguageSection {
  /** Accessible name of the `nav` landmark. */
  readonly nav: string;
}

/**
 * The English toc section: the single source of the toc's English copy. The
 * `CNGX_TOC_CONFIG` labels default to it.
 *
 * @category ui/toc/i18n
 * @since 0.1.0
 * @relatedTo CNGX_TOC_CONFIG
 */
export const CNGX_TOC_LANGUAGE_EN: CngxTocLanguageSection = {
  nav: 'On this page',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly toc: CngxTocLanguageSection;
  }
}
