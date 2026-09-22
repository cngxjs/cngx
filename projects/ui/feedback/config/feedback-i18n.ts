import { inject, InjectionToken, type Provider } from '@angular/core';

import type { FeedbackFeature } from './feedback-config';

/**
 * Live-region copy the feedback family announces on its own behalf. Separate
 * from the region names: these describe a transition rather than naming a
 * landmark, so they change on a different cadence and a consumer usually
 * translates them as one block.
 *
 * @category ui/feedback/i18n
 */
export interface CngxFeedbackAnnouncements {
  /** Announced when a user dismisses an alert. */
  readonly alertDismissed: string;
  /** Accessible name of the alert-stack overflow trigger. Receives the hidden count. */
  readonly alertOverflow: (count: number) => string;
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
 * Feedback i18n surface. Library defaults are English; consumers override via
 * {@link withFeedbackI18nLabels} inside `provideFeedback()`, or with
 * {@link provideFeedbackI18n} when they compose their own language file.
 * Sibling to `CNGX_STEPPER_I18N`, `CNGX_TABS_I18N` and `CNGX_CHART_I18N`.
 *
 * Two region names and one announcement sub-bundle. The banner outlet carries
 * no region `aria-label`, so it gets no key - a key with no Wirkungsort is
 * configuration for its own sake.
 *
 * @category ui/feedback/i18n
 */
export interface CngxFeedbackI18n {
  /** Accessible name of the `role="region"` host on `CngxAlertStack`. */
  readonly alertsRegionLabel: string;
  /** Accessible name of the `role="region"` host on `CngxToastOutlet`. */
  readonly notificationsRegionLabel: string;
  /** Live-region copy - see {@link CngxFeedbackAnnouncements}. */
  readonly announcements: CngxFeedbackAnnouncements;
}

/**
 * Override shape: every top-level key optional, and `announcements` overridable
 * key by key rather than all-or-nothing.
 *
 * @category ui/feedback/i18n
 */
export type CngxFeedbackI18nOverrides = Partial<Omit<CngxFeedbackI18n, 'announcements'>> & {
  readonly announcements?: Partial<CngxFeedbackAnnouncements>;
};

const FEEDBACK_I18N_DEFAULTS: CngxFeedbackI18n = {
  alertsRegionLabel: 'Alerts',
  notificationsRegionLabel: 'Notifications',
  announcements: {
    alertDismissed: 'Alert dismissed',
    alertOverflow: (count) => `Show ${count} more alerts`,
    asyncLoading: 'Loading content',
    asyncLoaded: 'Content loaded',
    asyncError: 'Error loading content',
    asyncRefreshing: 'Refreshing content',
    asyncRefreshed: 'Content refreshed',
    asyncRefreshFailed: 'Refresh failed',
  },
};

/**
 * DI token for the feedback i18n bundle. `providedIn: 'root'` with English
 * defaults, so a consumer who provides nothing still gets named regions.
 *
 * @category ui/feedback/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/config/feedback-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxAlertStack, CngxToastOutlet
 */
export const CNGX_FEEDBACK_I18N = new InjectionToken<CngxFeedbackI18n>('CngxFeedbackI18n', {
  providedIn: 'root',
  factory: () => FEEDBACK_I18N_DEFAULTS,
});

/**
 * Override the feedback region names from inside `provideFeedback()`. Unset
 * keys keep the English default.
 *
 * ```ts
 * provideFeedback(
 *   withToasts(),
 *   withAlerts(),
 *   withFeedbackI18nLabels({ alertsRegionLabel: 'Hinweise' }),
 * )
 * ```
 *
 * Contributes the token through the feature's `_providers`, so - like
 * {@link withCloseIcon} - a second call in the same `provideFeedback()` wins
 * over the first rather than merging with it. Pass every key in one call.
 *
 * @category ui/feedback/i18n
 */
export function withFeedbackI18nLabels(overrides: CngxFeedbackI18nOverrides): FeedbackFeature {
  return {
    _apply: (config) => config,
    _providers: [provideFeedbackI18n(overrides)],
  };
}

/**
 * Provider for the feedback i18n bundle on its own, without the rest of
 * `provideFeedback()`. This is the entry point a consumer-composed language
 * file uses - `provideFeedback()` replaces the whole `CNGX_FEEDBACK_CONFIG`
 * value, so routing a translation through it would reset unrelated feedback
 * defaults the app set elsewhere.
 *
 * ```ts
 * export const DE_LOCALE: Provider[] = [
 *   provideFeedbackI18n({ alertsRegionLabel: 'Hinweise', notificationsRegionLabel: 'Meldungen' }),
 *   provideTabsI18n(withTabsI18nLabels({ tabsLabel: 'Reiter' })),
 * ];
 * ```
 *
 * @category ui/feedback/i18n
 */
export function provideFeedbackI18n(overrides: CngxFeedbackI18nOverrides): Provider {
  return {
    provide: CNGX_FEEDBACK_I18N,
    useValue: {
      ...FEEDBACK_I18N_DEFAULTS,
      ...overrides,
      announcements: {
        ...FEEDBACK_I18N_DEFAULTS.announcements,
        ...overrides.announcements,
      },
    },
  };
}

/**
 * Inject the resolved feedback i18n bundle.
 *
 * @category ui/feedback/i18n
 */
export function injectFeedbackI18n(): CngxFeedbackI18n {
  return inject(CNGX_FEEDBACK_I18N);
}
