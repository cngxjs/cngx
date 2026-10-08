import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The live-region words of the feedback section: transitions the feedback
 * family announces on its own behalf.
 *
 * @category ui/feedback/i18n
 * @since 0.1.0
 */
export interface CngxFeedbackAnnouncementsLanguage {
  /** Announced when a user dismisses an alert. */
  readonly alertDismissed: string;
  /**
   * Plural on `{count}`: accessible name of the alert-stack overflow trigger.
   * Must contain {@link CngxFeedbackAnnouncementsLanguage.alertOverflowVisible}
   * for the same count (WCAG 2.5.3 Label in Name).
   */
  readonly alertOverflow: CngxMessage;
  /** `{count}`: visible text of the alert-stack overflow trigger. */
  readonly alertOverflowVisible: CngxMessage;
  /** `idle -> loading` on `CngxAsyncContainer`. */
  readonly asyncLoading: string;
  /** `loading -> success`. */
  readonly asyncLoaded: string;
  /** `loading -> error`. */
  readonly asyncError: string;
  /** Entering `refreshing`. */
  readonly asyncRefreshing: string;
  /** `refreshing -> success`. */
  readonly asyncRefreshed: string;
  /** `refreshing -> error`. */
  readonly asyncRefreshFailed: string;
}

/**
 * The feedback section of a {@link CngxLanguagePack}: the copy of
 * `@cngx/ui/feedback` (alerts, toasts, banners, loading surfaces, the async
 * container and the state bridges). It feeds `CNGX_FEEDBACK_I18N`. Messages
 * use `{name}` placeholders; a plural message picks its form from `{count}`.
 *
 * @category ui/feedback/i18n
 * @since 0.1.0
 * @relatedTo CNGX_FEEDBACK_I18N
 */
export interface CngxFeedbackLanguageSection {
  /** Accessible name of the alert-stack region. */
  readonly alertsRegionLabel: string;
  /** Accessible name of the toast-outlet region. */
  readonly notificationsRegionLabel: string;
  /** Accessible name of every dismiss button. */
  readonly dismissLabel: string;
  /** Shown in the banner's alert slot when its action rejects. */
  readonly bannerActionFailed: string;
  /** `{count}`: visible repeat marker on a toast raised more than once. */
  readonly toastRepeatCount: CngxMessage;
  /** Default accessible name of the loading indicator and overlay. */
  readonly loadingLabel: string;
  /** Default accessible name of `CngxProgress`. */
  readonly progressLabel: string;
  /**
   * `{value}` (the percent formatted in the locale, `42%`), `{percent}` (the
   * rounded number): `aria-valuetext` of a determinate `CngxProgress`.
   */
  readonly progressValueText: CngxMessage;
  /**
   * `{message}`, `{detail}`: an error message of a state bridge followed by
   * the mapped error detail.
   */
  readonly errorWithDetail: CngxMessage;
  readonly announcements: CngxFeedbackAnnouncementsLanguage;
}

/**
 * The English feedback section: the single source of the feedback family's
 * English copy. `CNGX_FEEDBACK_I18N` defaults to it.
 *
 * @category ui/feedback/i18n
 * @since 0.1.0
 * @relatedTo CNGX_FEEDBACK_I18N
 */
export const CNGX_FEEDBACK_LANGUAGE_EN: CngxFeedbackLanguageSection = {
  alertsRegionLabel: 'Alerts',
  notificationsRegionLabel: 'Notifications',
  dismissLabel: 'Dismiss',
  bannerActionFailed: 'Action failed',
  toastRepeatCount: '(x{count})',
  loadingLabel: 'Loading',
  progressLabel: 'Progress',
  progressValueText: '{value}',
  errorWithDetail: '{message}: {detail}',
  announcements: {
    alertDismissed: 'Alert dismissed',
    alertOverflow: { one: '+{count} more alert', other: '+{count} more alerts' },
    alertOverflowVisible: '+{count} more',
    asyncLoading: 'Loading content',
    asyncLoaded: 'Content loaded',
    asyncError: 'Error loading content',
    asyncRefreshing: 'Refreshing content',
    asyncRefreshed: 'Content refreshed',
    asyncRefreshFailed: 'Refresh failed',
  },
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly feedback: CngxFeedbackLanguageSection;
  }
}
