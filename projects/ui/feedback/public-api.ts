/**
 * @module @cngx/ui/feedback
 */

export { CngxLoadingIndicator, type LoadingIndicatorVariant } from './loading/loading-indicator';
export { CngxLoadingOverlay } from './loading/loading-overlay';
export { CngxProgress, type ProgressVariant } from './loading/progress';
export {
  CngxAlert,
  CngxAlertIcon,
  CngxAlertAction,
  type AlertSeverity,
  type AlertVisibilityPhase,
} from './alert/alert';
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
} from './config/feedback-config';
export {
  CngxAlerter,
  type AlertConfig,
  type AlertRef,
  type AlertState,
} from './alert/alerter.service';
export { CngxAlertStack } from './alert/alert-stack';
export { CngxAlertOn } from './alert/alert-on.directive';
export {
  CngxBanner,
  type BannerConfig,
  type BannerRef,
  type BannerState,
} from './banner/banner.service';
export { CngxBannerOutlet } from './banner/banner-outlet';
export { CngxBannerOn } from './banner/banner-on.directive';
export { CngxBannerTrigger } from './banner/banner-trigger';
export {
  CngxToaster,
  provideToasts,
  type ToastConfig,
  type ToastRef,
} from './toast/toast.service';
export { CngxToastOutlet, type ToastPosition } from './toast/toast-outlet';
export { CngxToastOn } from './toast/toast-on.directive';
export { CngxToast } from './toast/toast.component';
export {
  CngxAsyncContainer,
  CngxAsyncSkeletonTpl,
  CngxAsyncContentTpl,
  CngxAsyncEmptyTpl,
  CngxAsyncErrorTpl,
} from './async-container/async-container';
