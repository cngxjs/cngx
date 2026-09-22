import { inject, InjectionToken, type Provider } from '@angular/core';

import type { FeedbackFeature } from './feedback-config';

/**
 * Feedback i18n surface. Library defaults are English; consumers override via
 * {@link withFeedbackI18nLabels} inside `provideFeedback()`, or with
 * {@link provideFeedbackI18n} when they compose their own language file.
 * Sibling to `CNGX_STEPPER_I18N`, `CNGX_TABS_I18N` and `CNGX_CHART_I18N`.
 *
 * Two keys, both region names: the alert stack and the toast outlet are the
 * only feedback surfaces that name a landmark. The banner outlet carries no
 * region `aria-label`, so it gets no key - a key with no Wirkungsort is
 * configuration for its own sake.
 *
 * @category ui/feedback/i18n
 */
export interface CngxFeedbackI18n {
  /** Accessible name of the `role="region"` host on `CngxAlertStack`. */
  readonly alertsRegionLabel: string;
  /** Accessible name of the `role="region"` host on `CngxToastOutlet`. */
  readonly notificationsRegionLabel: string;
}

const FEEDBACK_I18N_DEFAULTS: CngxFeedbackI18n = {
  alertsRegionLabel: 'Alerts',
  notificationsRegionLabel: 'Notifications',
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
export function withFeedbackI18nLabels(overrides: Partial<CngxFeedbackI18n>): FeedbackFeature {
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
export function provideFeedbackI18n(overrides: Partial<CngxFeedbackI18n>): Provider {
  return {
    provide: CNGX_FEEDBACK_I18N,
    useValue: { ...FEEDBACK_I18N_DEFAULTS, ...overrides },
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
