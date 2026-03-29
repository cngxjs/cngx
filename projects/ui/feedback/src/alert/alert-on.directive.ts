import { Directive, effect, inject, input } from '@angular/core';
import type { AsyncStatus, CngxAsyncState } from '@cngx/core/utils';

import { CngxAlerter } from './alerter.service';

/**
 * Declarative state-to-alert bridge for scoped alert stacks.
 *
 * Place on any element inside a `CngxAlertStack` subtree — fires an alert
 * when the bound `CngxAsyncState` transitions to `error` (or optionally `success`).
 * Only fires on actual transitions, not on initial `idle` state.
 *
 * @usageNotes
 *
 * ```html
 * <cngx-alert-stack scope="form" />
 *
 * <button [cngxAsyncClick]="save"
 *   [cngxAlertOn]="saveState"
 *   alertError="Save failed"
 *   [alertErrorDetail]="true">
 *   Save
 * </button>
 * ```
 *
 * @category feedback
 */
@Directive({
  selector: '[cngxAlertOn]',
  standalone: true,
})
export class CngxAlertOn {
  private readonly alerter = inject(CngxAlerter, { optional: true });

  /** The async state to watch. */
  readonly state = input.required<CngxAsyncState<unknown>>({ alias: 'cngxAlertOn' });

  /** Alert message on success. If not set, no success alert fires. */
  readonly alertSuccess = input<string | undefined>(undefined);

  /** Alert message on error. If not set, no error alert fires. */
  readonly alertError = input<string | undefined>(undefined);

  /** Include the error detail message in the alert body. */
  readonly alertErrorDetail = input<boolean>(false);

  /** Scope for the alert — matches against `CngxAlertStack`'s `[scope]` input. */
  readonly alertScope = input<string | undefined>(undefined);

  constructor() {
    if (!this.alerter) {
      throw new Error(
        '[cngxAlertOn] CngxAlerter not found. ' +
          'Place inside a CngxAlertStack subtree or add withAlerts() to provideFeedback().',
      );
    }
    const alerter = this.alerter;

    let previousStatus: AsyncStatus = 'idle';

    effect(() => {
      const s = this.state();
      const status = s.status();

      if (status === previousStatus) {
        return;
      }
      previousStatus = status;

      if (status === 'success') {
        const msg = this.alertSuccess();
        if (msg) {
          alerter.show({
            message: msg,
            severity: 'success',
            persistent: false,
            scope: this.alertScope(),
          });
        }
      }

      if (status === 'error') {
        const msg = this.alertError();
        if (msg) {
          const err = s.error();
          const detail =
            this.alertErrorDetail() && err != null
              ? err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : undefined
              : undefined;
          alerter.show({
            message: detail ? `${msg}: ${detail}` : msg,
            severity: 'error',
            scope: this.alertScope(),
          });
        }
      }
    });
  }
}
