/**
 * @module @cngx/ui/feedback
 */

export { CngxLoadingIndicator, type LoadingIndicatorVariant } from './src/loading-indicator';
export { CngxLoadingOverlay } from './src/loading-overlay';
export { CngxProgress, type ProgressVariant } from './src/progress';
export { CngxAlert, CngxAlertIcon, type AlertSeverity } from './src/alert';
export {
  CNGX_FEEDBACK_CONFIG,
  type FeedbackConfig,
  type FeedbackFeature,
  provideFeedback,
  withSpinnerTemplate,
  withAlertIcons,
  withLoadingDefaults,
  withCloseIcon,
  withToasts,
} from './src/feedback-config';
export {
  CngxToaster,
  provideToasts,
  type ToastConfig,
  type ToastRef,
} from './src/toast/toast.service';
export { CngxToastOutlet, type ToastPosition } from './src/toast/toast-outlet';
export { CngxToastOn } from './src/toast/toast-on.directive';
export {
  CngxAsyncContainer,
  CngxAsyncSkeletonTpl,
  CngxAsyncContentTpl,
  CngxAsyncEmptyTpl,
  CngxAsyncErrorTpl,
} from './src/async-container/async-container';
