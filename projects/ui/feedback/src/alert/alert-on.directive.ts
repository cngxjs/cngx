import {
  afterNextRender,
  Directive,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  untracked,
} from '@angular/core';
import {
  CNGX_STATEFUL,
  createTransitionTracker,
  type CngxAsyncState,
} from '@cngx/core/utils';

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
  private readonly statefulFallback = inject(CNGX_STATEFUL, { optional: true });

  /**
   * The async state to watch. Optional — when omitted, falls back to
   * `CNGX_STATEFUL` from an ancestor/self component. A bare `cngxAlertOn`
   * attribute is treated as "no input bound".
   */
  readonly state = input<CngxAsyncState<unknown> | undefined, CngxAsyncState<unknown> | '' | undefined>(
    undefined,
    {
      alias: 'cngxAlertOn',
      transform: (v) => (typeof v === 'string' ? undefined : v),
    },
  );

  /** Effective state — input wins over ancestor `CNGX_STATEFUL`. */
  private readonly effectiveState = computed<CngxAsyncState<unknown> | undefined>(
    () => this.state() ?? this.statefulFallback?.state,
  );

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

    if (isDevMode()) {
      // One-shot post-binding check — runs once after inputs are bound. Uses
      // afterNextRender instead of an effect so we don't leave a dead node in
      // the reactive graph for the lifetime of the directive.
      afterNextRender(() => {
        if (this.state() === undefined && !this.statefulFallback) {
          console.error(
            '[cngxAlertOn] No state source. Bind [cngxAlertOn]="state" explicitly or ' +
              'place inside a component that provides CNGX_STATEFUL.',
          );
        }
      });
    }

    const tracker = createTransitionTracker(() => this.effectiveState()?.status() ?? 'idle');

    effect(() => {
      // Only tracker is tracked. All other signal reads happen inside untracked()
      // below to keep the effect's dependency graph flat.
      const status = tracker.current();
      const previous = tracker.previous();

      if (status === previous) {
        return;
      }

      untracked(() => {
        const s = this.effectiveState();
        if (!s) {
          return;
        }

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
    });
  }
}
