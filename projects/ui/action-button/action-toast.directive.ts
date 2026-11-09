import { afterNextRender, Directive, inject, input, untracked } from '@angular/core';
import {
  CNGX_ACTION_STATUS,
  CNGX_ANNOUNCEMENT_COVER,
  type CngxActionOutcome,
  type CngxAnnouncementCover,
} from '@cngx/common/interactive';
import { CngxToastOn, CngxToaster, injectErrorDetail, injectFeedbackI18n } from '@cngx/ui/feedback';
import { cngxDevWarn } from '@cngx/utils';

/**
 * Per-outcome toasts for an action host on `CngxActionStatusBrain`: one
 * toast per own settle and one per `success` / `error` edge of a bound
 * `[externalState]`, read from `CNGX_ACTION_STATUS.outcome`. Two settles
 * before one render are two toasts. A selector-less host directive;
 * `CngxActionButton` co-hosts it, an ejected action host lists it in its
 * `hostDirectives`.
 *
 * Needs `CngxToaster` (`provideFeedback(withToasts())` or `provideToasts()`);
 * without one it does nothing. A shown toast already announces its
 * outcome, so the directive provides `CNGX_ANNOUNCEMENT_COVER` and the
 * runner's region next to the host stays empty for it, unless the brain's
 * `[autoAnnounce]` is `true`.
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
  providers: [{ provide: CNGX_ANNOUNCEMENT_COVER, useExisting: CngxActionToast }],
})
export class CngxActionToast implements CngxAnnouncementCover {
  private readonly status = inject(CNGX_ACTION_STATUS);
  private readonly toaster = inject(CngxToaster, { optional: true });
  private readonly errorDetail = injectErrorDetail();
  private readonly feedbackI18n = injectFeedbackI18n();
  private readonly externalToastOn = inject(CngxToastOn, { self: true, optional: true });

  /**
   * Toast message on success. Silently ignored when no `CngxToaster` is
   * provided. `toastSuccessDuration` should be >= `feedbackDuration` to
   * avoid rapid re-fire on repeated clicks that floods the SR queue.
   */
  readonly toastSuccess = input<string | undefined>(undefined);

  /** Toast message on error. */
  readonly toastError = input<string | undefined>(undefined);

  /** Include the error detail message in the error toast body. */
  readonly toastErrorDetail = input<boolean>(false);

  /** Duration for success toasts in ms. */
  readonly toastSuccessDuration = input<number>(3000);

  /** Duration for error toasts - `'persistent'` means manual dismiss only. */
  readonly toastErrorDuration = input<number | 'persistent'>('persistent');

  constructor() {
    // Double-toast guard, consumer placed [cngxToastOn] on the same element.
    // After the first render: template-bound inputs are unset in the constructor.
    if (typeof ngDevMode !== 'undefined' && ngDevMode && this.externalToastOn) {
      afterNextRender(() => {
        if (this.toastSuccess() || this.toastError()) {
          cngxDevWarn(
            'CNGX3008',
            '[cngxActionButton] [toastSuccess]/[toastError] inputs and [cngxToastOn] ' +
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
    if (status === 'success') {
      const msg = this.toastSuccess();
      if (msg) {
        this.toaster.show({
          message: msg,
          severity: 'success',
          duration: this.toastSuccessDuration(),
        });
      }
      return;
    }
    const msg = this.toastError();
    if (!msg) {
      return;
    }
    const detail = this.toastErrorDetail() && error != null ? this.errorDetail(error) : undefined;
    this.toaster.show({
      message: detail ? this.feedbackI18n().errorWithDetail(msg, detail) : msg,
      severity: 'error',
      duration: this.toastErrorDuration(),
    });
  }
}
