import { Directive, effect, inject, input } from '@angular/core';
import type { AsyncStatus, CngxAsyncState } from '@cngx/core/utils';

import { CngxToastService } from './toast.service';

/**
 * Declarative state-to-toast bridge.
 *
 * Place on any element — fires a toast when the bound `CngxAsyncState`
 * transitions to `success` or `error`. Only fires on actual transitions,
 * not on initial `idle` state.
 *
 * @usageNotes
 *
 * ### On a button
 * ```html
 * <button [cngxAsyncClick]="save"
 *   [cngxToastOn]="saveState"
 *   toastSuccess="Saved"
 *   toastError="Save failed">
 *   Save
 * </button>
 * ```
 *
 * ### On a form
 * ```html
 * <form [cngxToastOn]="submitState"
 *   toastSuccess="Form submitted"
 *   toastError="Submission failed"
 *   [toastErrorDetail]="true">
 *   ...
 * </form>
 * ```
 *
 * @category feedback
 */
@Directive({
  selector: '[cngxToastOn]',
  standalone: true,
})
export class CngxToastOn {
  private readonly toast = inject(CngxToastService);

  /** The async state to watch. */
  readonly state = input.required<CngxAsyncState<unknown>>({ alias: 'cngxToastOn' });

  /** Toast message on success. If not set, no success toast fires. */
  readonly toastSuccess = input<string | undefined>(undefined);

  /** Toast message on error. If not set, no error toast fires. */
  readonly toastError = input<string | undefined>(undefined);

  /** Include the error detail message in the toast body. */
  readonly toastErrorDetail = input<boolean>(false);

  /** Duration for success toasts in ms. */
  readonly toastSuccessDuration = input<number>(3000);

  /** Duration for error toasts — `'persistent'` means manual dismiss only. */
  readonly toastErrorDuration = input<number | 'persistent'>('persistent');

  constructor() {
    let previousStatus: AsyncStatus = 'idle';

    effect(() => {
      const s = this.state();
      const status = s.status();

      // Only fire on actual transitions, not initial state
      if (status === previousStatus) {
        return;
      }
      previousStatus = status;

      if (status === 'success') {
        const msg = this.toastSuccess();
        if (msg) {
          this.toast.show({
            message: msg,
            severity: 'success',
            duration: this.toastSuccessDuration(),
          });
        }
      }

      if (status === 'error') {
        const msg = this.toastError();
        if (msg) {
          const err = s.error();
          const detail =
            this.toastErrorDetail() && err != null
              ? err instanceof Error
                ? err.message
                : `${err as string}`
              : undefined;
          this.toast.show({
            message: detail ? `${msg}: ${detail}` : msg,
            severity: 'error',
            duration: this.toastErrorDuration(),
          });
        }
      }
    });
  }
}
