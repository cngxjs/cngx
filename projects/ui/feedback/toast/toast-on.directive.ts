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

import { CngxToaster } from './toast.service';

/**
 * Declarative state-to-toast bridge.
 *
 * Place on any element — fires a toast when the bound `CngxAsyncState`
 * transitions to `success` or `error`. Only fires on actual transitions,
 * not on initial `idle` state.
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
 * @category ui/feedback/toast
 *
 * <example-url>http://localhost:4200/#/ui/feedback/toast/custom-component-body</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/declarative-cngx-toast</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/programmatic-cngxtoaster</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/state-bridge-cngxtoaston</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/title-description</example-url>
 * <example-url>http://localhost:4200/#/ui/tabs/tab-commit-action/optimistic-pessimistic-commits-with-bridge-directives</example-url>
 */
@Directive({
  selector: '[cngxToastOn]',
  standalone: true,
})
export class CngxToastOn {
  private readonly toast = inject(CngxToaster, { optional: true });
  private readonly statefulFallback = inject(CNGX_STATEFUL, { optional: true });

  // Validated non-null ref — constructor throws if missing
  private readonly toastService: CngxToaster;

  /**
   * The async state to watch. Optional — when omitted, the bridge falls back
   * to `CNGX_STATEFUL` injected from the host component (for example
   * `CngxSelect.commitState`). A bare `cngxToastOn` attribute (empty string)
   * is treated as "no input bound" so the fallback kicks in.
   */
  readonly state = input<CngxAsyncState<unknown> | undefined, CngxAsyncState<unknown> | '' | undefined>(
    undefined,
    {
      alias: 'cngxToastOn',
      transform: (v) => (typeof v === 'string' ? undefined : v),
    },
  );

  /** Effective state — input wins over ancestor `CNGX_STATEFUL`. */
  private readonly effectiveState = computed<CngxAsyncState<unknown> | undefined>(
    () => this.state() ?? this.statefulFallback?.state,
  );

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
    if (!this.toast) {
      throw new Error(
        '[cngxToastOn] CngxToaster not found. ' +
          'Add withToasts() to provideFeedback() or call provideToasts() in your providers.',
      );
    }
    this.toastService = this.toast;

    if (isDevMode()) {
      // afterNextRender, not effect — one-shot post-binding check, no dead
      // node in the reactive graph for the directive's lifetime.
      afterNextRender(() => {
        if (this.state() === undefined && !this.statefulFallback) {
          console.error(
            '[cngxToastOn] No state source. Bind [cngxToastOn]="state" explicitly or ' +
              'place inside a component that provides CNGX_STATEFUL.',
          );
        }
      });
    }

    const tracker = createTransitionTracker(() => this.effectiveState()?.status() ?? 'idle');

    effect(() => {
      // Flat graph — only the tracker is tracked; option reads stay inside
      // untracked() so message/duration changes don't re-fire the bridge.
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
          const msg = this.toastSuccess();
          if (msg) {
            this.toastService.show({
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
                  : typeof err === 'string'
                    ? err
                    : undefined
                : undefined;
            this.toastService.show({
              message: detail ? `${msg}: ${detail}` : msg,
              severity: 'error',
              duration: this.toastErrorDuration(),
            });
          }
        }
      });
    });
  }
}
