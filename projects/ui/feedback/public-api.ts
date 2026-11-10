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
  type CngxErrorDetailFn,
  provideFeedback,
  withSpinnerTemplate,
  withAlertIcons,
  withLoadingDefaults,
  withCloseIcon,
  withToasts,
  withAlerts,
  withBanners,
  withErrorDetail,
  injectErrorDetail,
} from './config/feedback-config';
export {
  CNGX_FEEDBACK_I18N,
  type CngxFeedbackI18n,
  type CngxFeedbackI18nOverrides,
  type CngxFeedbackAnnouncements,
  withFeedbackI18nLabels,
  provideFeedbackI18n,
  injectFeedbackI18n,
} from './config/feedback-i18n';
export {
  CNGX_FEEDBACK_LANGUAGE_EN,
  type CngxFeedbackLanguageSection,
  type CngxFeedbackAnnouncementsLanguage,
} from './i18n/feedback-language-section';
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
  type ToastState,
} from './toast/toast.service';
// The hold-source and segment types of the `@internal` timer members on
// `CngxToaster` / `CngxAlerter`, exported so the shipped d.ts can name them.
// Each declaration carries its own `@internal` tag.
export { type TimerHoldSource, type TimerSegment } from './internal/pausable-timer';
export { CngxToastOutlet, type ToastPosition } from './toast/toast-outlet';
export { CngxToastOn } from './toast/toast-on.directive';
// `@internal`: the show path `CngxToastOn` shares with `CngxActionToast` in
// `@cngx/ui/action-button`, exported because ng-packagr has no cross-entry
// private surface. The declarations carry the tag, so docs skip them.
export { resolveOutcomeToast, type CngxOutcomeToastInputs } from './toast/outcome-toast';
export { CngxToast } from './toast/toast.component';
export {
  CngxAsyncContainer,
  CngxAsyncSkeletonTpl,
  CngxAsyncContentTpl,
  CngxAsyncEmptyTpl,
  CngxAsyncErrorTpl,
} from './async-container/async-container';
