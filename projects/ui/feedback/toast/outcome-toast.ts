import type { CngxErrorDetailFn } from '../config/feedback-config';
import type { CngxFeedbackI18n } from '../config/feedback-i18n';
import type { ToastConfig } from './toast.service';

/**
 * The toast inputs `CngxToastOn` and `CngxActionToast` share, read as
 * signals by `resolveOutcomeToast`.
 *
 * @internal
 */
export interface CngxOutcomeToastInputs {
  readonly toastSuccess: () => string | undefined;
  readonly toastError: () => string | undefined;
  readonly toastErrorDetail: () => boolean;
  readonly toastSuccessDuration: () => number | undefined;
  readonly toastErrorDuration: () => number | 'persistent' | undefined;
}

/**
 * The toast one `success` / `error` outcome shows, or `undefined` when the
 * outcome has no message. The error toast appends the mapped error detail
 * through `errorWithDetail` when `toastErrorDetail` is set. An unbound
 * duration stays `undefined` so `CngxToaster` resolves it.
 *
 * Only the show path is shared: `CngxToastOn` fires on a state transition,
 * `CngxActionToast` once per action outcome, and each keeps its trigger.
 *
 * @internal
 */
export function resolveOutcomeToast(
  inputs: CngxOutcomeToastInputs,
  status: 'success' | 'error',
  error: unknown,
  detailOf: CngxErrorDetailFn,
  i18n: Pick<CngxFeedbackI18n, 'errorWithDetail'>,
): ToastConfig | undefined {
  if (status === 'success') {
    const message = inputs.toastSuccess();
    return message
      ? { message, severity: 'success', duration: inputs.toastSuccessDuration() }
      : undefined;
  }
  const message = inputs.toastError();
  if (!message) {
    return undefined;
  }
  const detail = inputs.toastErrorDetail() && error != null ? detailOf(error) : undefined;
  return {
    message: detail ? i18n.errorWithDetail(message, detail) : message,
    severity: 'error',
    duration: inputs.toastErrorDuration(),
  };
}
