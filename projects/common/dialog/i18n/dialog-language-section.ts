// Pulls the augmented module into the program; ng-packagr rejects `declare module` (TS2664) otherwise.
import type {} from '@cngx/core/i18n';

/**
 * The dialog section of a {@link CngxLanguagePack}: the interaction strings
 * the dialog family renders on its own behalf. {@link CngxDialogLabels} is
 * this shape; it feeds the `labels` of `CNGX_DIALOG_DEFAULTS`.
 *
 * @category common/dialog/i18n
 * @since 0.1.0
 * @relatedTo CNGX_DIALOG_DEFAULTS
 */
export interface CngxDialogLanguageSection {
  /** Implicit accessible name of `CngxDialogClose` when the trigger carries no text. */
  readonly close: string;
  /** Live-region text when a dialog error carries no message of its own. */
  readonly errorFallback: string;
  /** `aria-label` set on a promoted drag handle. */
  readonly dragHandle: string;
  /** `aria-roledescription` set on a promoted drag handle. */
  readonly dragHandleRoleDescription: string;
  /** Visually hidden keyboard-drag instruction the handle is described by. */
  readonly dragInstructions: string;
}

/**
 * The English dialog section: the single source of the dialog family's
 * English copy. The `CNGX_DIALOG_DEFAULTS` labels default to it.
 *
 * @category common/dialog/i18n
 * @since 0.1.0
 * @relatedTo CNGX_DIALOG_DEFAULTS
 */
export const CNGX_DIALOG_LANGUAGE_EN: CngxDialogLanguageSection = {
  close: 'Close dialog',
  errorFallback: 'An error occurred',
  dragHandle: 'Move dialog',
  dragHandleRoleDescription: 'draggable',
  dragInstructions: 'Use arrow keys to move the dialog; Shift for larger steps',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly dialog: CngxDialogLanguageSection;
  }
}
