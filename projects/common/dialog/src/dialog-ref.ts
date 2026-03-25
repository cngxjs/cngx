import { InjectionToken, type Signal } from '@angular/core';

/** Lifecycle states of a dialog. */
export type DialogState = 'closed' | 'opening' | 'open' | 'closing';

/**
 * Signal-based dialog reference.
 *
 * - **Outside** (parent template): access via `exportAs` — `#dlg="cngxDialog"`
 * - **Inside** (dialog content): access via DI — `inject(DIALOG_REF)`
 */
export interface DialogRef<T = unknown> {
  /** Current lifecycle state of the dialog. */
  readonly state: Signal<DialogState>;

  /**
   * The typed result of the dialog.
   *
   * - `undefined` before the dialog closes (reset on each `open()`)
   * - `'dismissed'` when dismissed via Escape or backdrop click
   * - `T` when closed with an explicit value
   */
  readonly result: Signal<T | 'dismissed' | undefined>;

  /** Unique ID of this dialog instance. */
  readonly id: Signal<string>;

  /** Close the dialog with a typed result value. */
  close(value: T): void;

  /** Dismiss the dialog without a result (Escape / backdrop). */
  dismiss(): void;
}

/** Injection token to access the nearest `DialogRef` from inside a dialog. */
export const DIALOG_REF = new InjectionToken<DialogRef>('CngxDialogRef');
