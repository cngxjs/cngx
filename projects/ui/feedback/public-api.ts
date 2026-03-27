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
} from './src/feedback-config';
