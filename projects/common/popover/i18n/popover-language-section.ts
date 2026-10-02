// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The popover section of a {@link CngxLanguagePack}: the copy of
 * `CngxPopoverPanel`. `providePopoverPanel(withPopoverPanelLabels(...))`
 * overrides single keys on top of it.
 *
 * @category common/popover
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel, withPopoverPanelLabels
 */
export interface CngxPopoverLanguageSection {
  /** Accessible name of the built-in close button. */
  readonly close: string;
}

/**
 * The English popover section: the single source of the popover panel's
 * English copy.
 *
 * @category common/popover
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel
 */
export const CNGX_POPOVER_LANGUAGE_EN: CngxPopoverLanguageSection = {
  close: 'Close',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly popover: CngxPopoverLanguageSection;
  }
}
