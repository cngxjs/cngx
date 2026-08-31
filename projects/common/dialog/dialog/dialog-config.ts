import { InjectionToken } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';
import type { Observable } from 'rxjs';

/**
 * Injection token for data passed to a programmatically opened dialog via `CngxDialogOpener.open()`.
 *
 * @category common/dialog
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/dialog/dialog/dialog-config.ts
 * @since 0.1.0
 */
export const CNGX_DIALOG_DATA = new InjectionToken<unknown>('CngxDialogData');

/**
 * Configuration for programmatically opened dialogs.
 *
 * Mirrors the declarative `CngxDialog` input surface - everything a
 * template-driven dialog can bind is also reachable through
 * `CngxDialogOpener.open()`.
 *
 * @category common/dialog
 */
export interface CngxDialogConfig<D = unknown, T = unknown> {
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
  /**
   * Async action executed when the dialog closes with a value. Same contract
   * as the declarative `[submitAction]` input: on success the dialog
   * auto-closes, on error it stays open with the error announced. The submit
   * lifecycle is exposed on `CngxDialogRef.submitState`.
   */
  submitAction?: (value: T) => Promise<unknown> | Observable<unknown>;
  /**
   * External async state driving pending/error, same contract as the
   * declarative `[state]` input. Takes precedence over `submitAction`.
   */
  state?: CngxAsyncState<unknown>;
  /** Initial error flag, same contract as the declarative `[error]` input. */
  error?: boolean;
  /**
   * Fallback element to focus when the trigger element is gone by the time
   * the dialog closes, same contract as the declarative `[focusFallback]`.
   */
  focusFallback?: HTMLElement;
}
