/**
 * The accordion section of a {@link CngxLanguagePack}: the copy
 * `CngxAccordionItem` speaks on its own behalf. It feeds the copy keys of
 * `CNGX_ACCORDION_CONFIG`; a key set through `withAccordionLabels` or a bound
 * `[disabledReason]` / `[errorMessage]` still wins.
 *
 * @category ui/accordion/i18n
 * @since 0.1.0
 * @relatedTo CNGX_ACCORDION_CONFIG, withAccordionLabels
 */
export interface CngxAccordionLanguageSection {
  /** Reason announced when an item is disabled. */
  readonly disabledReason: string;
  /** Announced through `role="alert"` when an item's state is error. */
  readonly errorMessage: string;
}

/**
 * The English accordion section: the single source of the accordion's English
 * copy. The `CNGX_ACCORDION_CONFIG` copy keys default to it.
 *
 * @category ui/accordion/i18n
 * @since 0.1.0
 * @relatedTo CNGX_ACCORDION_CONFIG
 */
export const CNGX_ACCORDION_LANGUAGE_EN: CngxAccordionLanguageSection = {
  disabledReason: 'This section is currently unavailable.',
  errorMessage: 'This section could not be loaded.',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly accordion: CngxAccordionLanguageSection;
  }
}
