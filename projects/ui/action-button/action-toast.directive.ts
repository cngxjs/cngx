import { afterNextRender, Directive, inject, input, untracked } from '@angular/core';
import {
  CNGX_ACTION_STATUS,
  CNGX_ANNOUNCEMENT_COVER,
  type CngxActionOutcome,
  type CngxAnnouncementCover,
} from '@cngx/common/interactive';
import {
  CngxToastOn,
  CngxToaster,
  injectErrorDetail,
  injectFeedbackI18n,
  resolveOutcomeToast,
} from '@cngx/ui/feedback';
import { cngxDevWarn } from '@cngx/utils';

/**
 * Raises one toast per outcome of an action host on `CngxActionStatusBrain`: each own settle
 * and each `success` / `error` edge of a bound `[externalState]`, read from
 * `CNGX_ACTION_STATUS.outcome`. Two settles before one render are two toasts.
 *
 * A selector-less host directive. `CngxActionButton` co-hosts it; an ejected action host lists
 * it in its `hostDirectives`. It needs a `CngxToaster` (`provideFeedback(withToasts())` or
 * `provideToasts()`) and does nothing without one.
 *
 * A shown toast already announces its outcome, so the directive provides
 * `CNGX_ANNOUNCEMENT_COVER` and the live region next to the host stays empty for that outcome,
 * unless the brain's `autoAnnounce` is `true`.
 *
 * Do not combine it with `[cngxToastOn]` on the same element. Both toast the same outcome, and
 * development builds warn [`CNGX3008`](/error-codes/cngx3008.md).
 *
 * ```ts
 * hostDirectives: [
 *   // ...button brain, async click, action status brain
 *   { directive: CngxActionToast, inputs: ['toastSuccess', 'toastError'] },
 * ],
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/action-button/action-toast.directive.ts
 * @since 0.1.0
 * @relatedTo CngxActionButton, CngxActionStatusBrain, CNGX_ANNOUNCEMENT_COVER, CngxToaster
 * <example-url>/#/ui/action-button/async-button/random-outcome</example-url>
 * @axis level molecule
 */
@Directive({
  standalone: true,
  exportAs: 'cngxActionToast',
  providers: [{ provide: CNGX_ANNOUNCEMENT_COVER, useExisting: CngxActionToast, multi: true }],
})
export class CngxActionToast implements CngxAnnouncementCover {
  private readonly status = inject(CNGX_ACTION_STATUS);
  private readonly toaster = inject(CngxToaster, { optional: true });
  private readonly errorDetail = injectErrorDetail();
  private readonly feedbackI18n = injectFeedbackI18n();
  private readonly externalToastOn = inject(CngxToastOn, { self: true, optional: true });

  /**
   * Toast message on success. Repeats inside the toaster's dedup window
   * (`withToasts({ dedupWindow })`, 1000 ms by default) merge into one toast with a count.
   */
  readonly toastSuccess = input<string | undefined>(undefined);

  /** Toast message on error. */
  readonly toastError = input<string | undefined>(undefined);

  /**
   * Appends the error detail to the error toast message. The detail comes from
   * `provideFeedback(withErrorDetail(...))`. Without a mapping, development builds append the
   * raw error message and warn once ([`CNGX3004`](/error-codes/cngx3004.md)); production builds
   * append nothing.
   */
  readonly toastErrorDetail = input<boolean>(false);

  /**
   * Duration for success toasts in ms. Unbound, `CngxToaster` resolves it:
   * `withToasts({ defaultDuration })`, else 5000 ms.
   */
  readonly toastSuccessDuration = input<number | undefined>(undefined);

  /**
   * Duration for error toasts in ms, or `'persistent'` for manual dismiss only. Unbound, the
   * toaster keeps an error toast until it is dismissed.
   */
  readonly toastErrorDuration = input<number | 'persistent' | undefined>(undefined);

  constructor() {
    // Double-toast guard, consumer placed [cngxToastOn] on the same element.
    // After the first render: template-bound inputs are unset in the constructor.
    if (typeof ngDevMode !== 'undefined' && ngDevMode && this.externalToastOn) {
      afterNextRender(() => {
        if (this.toastSuccess() || this.toastError()) {
          cngxDevWarn(
            'CNGX3008',
            '[cngxActionToast] [toastSuccess]/[toastError] inputs and [cngxToastOn] ' +
              'on the same element will fire duplicate toasts. Use one or the other.',
          );
        }
      });
    }

    this.status.outcome.subscribe((outcome) => untracked(() => this.showToast(outcome)));
  }

  /**
   * `true` when a shown toast already announces this outcome, unless the
   * brain's `[autoAnnounce]` is `true`.
   */
  covers(status: 'success' | 'error'): boolean {
    return untracked(() => this.status.autoAnnounce() !== true && this.toastCovers(status));
  }

  private toastCovers(status: 'success' | 'error'): boolean {
    if (!this.toaster) {
      return false;
    }
    return status === 'success' ? !!this.toastSuccess() : !!this.toastError();
  }

  private showToast({ status, error }: CngxActionOutcome): void {
    if (!this.toaster) {
      return;
    }
    const toast = resolveOutcomeToast(this, status, error, this.errorDetail, this.feedbackI18n());
    if (toast) {
      this.toaster.show(toast);
    }
  }
}
