/**
 * @module @cngx/ui/feedback
 */

export { CngxLoadingIndicator, type LoadingIndicatorVariant } from './src/loading/loading-indicator';
export { CngxLoadingOverlay } from './src/loading/loading-overlay';
export { CngxProgress, type ProgressVariant } from './src/loading/progress';
export {
  CngxAlert,
  CngxAlertIcon,
  CngxAlertAction,
  type AlertSeverity,
  type AlertVisibilityPhase,
} from './src/alert/alert';
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
  withAlerts,
  withBanners,
} from './src/config/feedback-config';
export {
  CngxAlerter,
  type AlertConfig,
  type AlertRef,
  type AlertState,
} from './src/alert/alerter.service';
export { CngxAlertStack } from './src/alert/alert-stack';
export { CngxAlertOn } from './src/alert/alert-on.directive';
export {
  CngxBanner,
  type BannerConfig,
  type BannerRef,
  type BannerState,
} from './src/banner/banner.service';
export { CngxBannerOutlet } from './src/banner/banner-outlet';
export { CngxBannerOn } from './src/banner/banner-on.directive';
export { CngxBannerTrigger } from './src/banner/banner-trigger';
export {
  CngxToaster,
  provideToasts,
  type ToastConfig,
  type ToastRef,
} from './src/toast/toast.service';
export { CngxToastOutlet, type ToastPosition } from './src/toast/toast-outlet';
export { CngxToastOn } from './src/toast/toast-on.directive';
export { CngxToast } from './src/toast/toast.component';
export {
  CngxAsyncContainer,
  CngxAsyncSkeletonTpl,
  CngxAsyncContentTpl,
  CngxAsyncEmptyTpl,
  CngxAsyncErrorTpl,
} from './src/async-container/async-container';
