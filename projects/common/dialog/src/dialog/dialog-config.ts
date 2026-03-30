import { InjectionToken } from '@angular/core';

/** Injection token for data passed to a programmatically opened dialog via `CngxDialogOpener.open()`. */
export const CNGX_DIALOG_DATA = new InjectionToken<unknown>('CngxDialogData');

/**
 * Configuration for programmatically opened dialogs.
 *
 * @category dialog
 */
export interface CngxDialogConfig<D = unknown> {
  /** Data to inject via `CNGX_DIALOG_DATA` inside the dialog component. */
  data?: D;
  /** Whether the dialog opens as modal (`showModal()`) or non-modal (`show()`). Default: `true`. */
  modal?: boolean;
  /** Whether clicking the backdrop dismisses the dialog. Default: `true`. */
  closeOnBackdropClick?: boolean;
  /** Whether pressing Escape dismisses the dialog. Default: `true`. */
  closeOnEscape?: boolean;
  /** Focus strategy on open. Default: `'first-focusable'`. */
  autoFocus?: 'first-focusable' | 'none' | (string & {});
}
