// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The popover section of a {@link CngxLanguagePack}: the copy of
 * `CngxPopoverPanel`. `providePopoverPanel(withPopoverPanelLabels(...))`
 * overrides single keys on top of it.
 *
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel, withPopoverPanelLabels
 */
export interface CngxPopoverLanguageSection {
  /** Accessible name of the built-in close button. */
  readonly close: string;
  /**
   * Text of the loading view. A projected `*cngxPopoverLoading` template
   * replaces it.
   */
  readonly loading: string;
  /**
   * Text of the error view, and the panel's description there. A projected
   * `*cngxPopoverError` template replaces it.
   */
  readonly error: string;
  /**
   * Text of the empty view, and the panel's description there. A projected
   * `*cngxPopoverEmpty` template replaces it.
   */
  readonly empty: string;
}

/**
 * The English popover section: the single source of the popover panel's
 * English copy.
 *
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel
 */
export const CNGX_POPOVER_LANGUAGE_EN: CngxPopoverLanguageSection = {
  close: 'Close',
  loading: 'Loading',
  error: 'Could not load',
  empty: 'Nothing to show',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly popover: CngxPopoverLanguageSection;
  }
}
