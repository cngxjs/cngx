import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { createNestedLanguageSection, createSectionBundle, formatMessage } from '@cngx/core/i18n';
import { createNestedOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_FEEDBACK_LANGUAGE_EN,
  type CngxFeedbackLanguageSection,
} from '../i18n/feedback-language-section';
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
  /**
   * Accessible name of the alert-stack overflow trigger. Receives the hidden
   * count. Must contain the visible label from
   * {@link CngxFeedbackAnnouncements.alertOverflowVisible} for the same count
   * (WCAG 2.5.3 Label in Name, compared case-insensitively): a speech-input
   * user says what they see. A dev-mode warning fires when a translated pair
   * breaks containment.
   */
  readonly alertOverflow: (count: number) => string;
  /**
   * Visible text of the alert-stack overflow trigger. Receives the hidden
   * count; its output must be contained in
   * {@link CngxFeedbackAnnouncements.alertOverflow} for the same count.
   */
  readonly alertOverflowVisible: (count: number) => string;
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
 * Feedback i18n surface. The defaults come from the `feedback` section of the
 * language pack (English without one); {@link withFeedbackI18nLabels} inside
 * `provideFeedback()` or {@link provideFeedbackI18n} override single keys on top.
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
  /** Accessible name of the dismiss button on alerts, stacked alerts, toasts and banners. */
  readonly dismissLabel: string;
  /** Shown in the banner's `role="alert"` slot when its action rejects. */
  readonly bannerActionFailed: string;
  /** Visible repeat marker on a toast raised more than once. Receives the repeat count. */
  readonly toastRepeatCount: (count: number) => string;
  /**
   * Default accessible name of `CngxLoadingIndicator` and `CngxLoadingOverlay`
   * while their `label` input is unbound.
   */
  readonly loadingLabel: string;
  /** Default accessible name of `CngxProgress` while its `label` input is unbound. */
  readonly progressLabel: string;
  /**
   * `aria-valuetext` of a determinate `CngxProgress`. Receives the rounded
   * percent (0-100) and that value already formatted as a percent in the app
   * locale; the default returns the formatted string.
   */
  readonly progressValueText: (percent: number, formatted: string) => string;
  /**
   * The message a state bridge (`CngxAlertOn`, `CngxToastOn`, `CngxBannerOn`)
   * and `CngxActionButton` show for a failure with a detail: the bound error
   * message followed by the detail `withErrorDetail` mapped from the error.
   * One message, so a locale owns the joiner and the order.
   */
  readonly errorWithDetail: (message: string, detail: string) => string;
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

/** @internal Turns a feedback section into the token's keys for a locale. */
function feedbackBundleFrom(
  section: CngxFeedbackLanguageSection,
  locale: string,
): CngxFeedbackI18n {
  const announcements = section.announcements;
  return {
    alertsRegionLabel: section.alertsRegionLabel,
    notificationsRegionLabel: section.notificationsRegionLabel,
    dismissLabel: section.dismissLabel,
    bannerActionFailed: section.bannerActionFailed,
    toastRepeatCount: (count) => formatMessage(section.toastRepeatCount, { count }, locale),
    loadingLabel: section.loadingLabel,
    progressLabel: section.progressLabel,
    progressValueText: (percent, value) =>
      formatMessage(section.progressValueText, { percent, value }, locale),
    errorWithDetail: (message, detail) =>
      formatMessage(section.errorWithDetail, { message, detail }, locale),
    announcements: {
      alertDismissed: announcements.alertDismissed,
      alertOverflow: (count) => formatMessage(announcements.alertOverflow, { count }, locale),
      alertOverflowVisible: (count) =>
        formatMessage(announcements.alertOverflowVisible, { count }, locale),
      asyncLoading: announcements.asyncLoading,
      asyncLoaded: announcements.asyncLoaded,
      asyncError: announcements.asyncError,
      asyncRefreshing: announcements.asyncRefreshing,
      asyncRefreshed: announcements.asyncRefreshed,
      asyncRefreshFailed: announcements.asyncRefreshFailed,
    },
  };
}

/** @internal The English feedback section with the active pack's feedback section on top. */
const injectFeedbackLanguage = createNestedLanguageSection(
  'feedback',
  CNGX_FEEDBACK_LANGUAGE_EN,
  'announcements',
);

/** @internal Builds and reads the token, formatted for the reading locale. */
const feedbackBundle = createSectionBundle<CngxFeedbackLanguageSection, CngxFeedbackI18n>({
  section: injectFeedbackLanguage,
  toBundle: feedbackBundleFrom,
});

/**
 * DI token for the feedback i18n bundle, a `Signal` so region names, labels
 * and announcements follow a runtime language switch. `providedIn: 'root'`:
 * the feedback section of the active language pack over the English
 * defaults, formatted for the app locale, so a consumer who provides nothing
 * still gets named regions.
 *
 * @category ui/feedback/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/config/feedback-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxAlertStack, CngxToastOutlet
 */
export const CNGX_FEEDBACK_I18N = new InjectionToken<Signal<CngxFeedbackI18n>>('CngxFeedbackI18n', {
  providedIn: 'root',
  factory: () => feedbackBundle.build(),
});

/**
 * Override the feedback region names from inside `provideFeedback()`. Unset
 * keys keep the language pack's copy, or the English default, and
 * `announcements` merges key by key. Pass
 * a `Signal` to switch the language at runtime.
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
export function withFeedbackI18nLabels(
  overrides: CngxFeedbackI18nOverrides | Signal<CngxFeedbackI18nOverrides>,
): FeedbackFeature {
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
 * defaults the app set elsewhere. Unset keys keep the language pack's copy,
 * or the English default, `announcements` merges key by key, and a `Signal`
 * switches the language at runtime. For a whole language prefer the
 * `feedback` section of a language pack (`provideCngxI18n` from
 * `@cngx/core/i18n`); this provider overrides single keys on top of it.
 *
 * @example
 * ```ts
 * // src/i18n/de.ts - the app's language file: every per-lib provider it uses,
 * // composed in one const. See the "Localisation" core-concepts page for the
 * // full recipe and the per-area entry points.
 * export const DE: Provider[] = [
 *   provideFeedbackI18n({
 *     alertsRegionLabel: 'Hinweise',
 *     notificationsRegionLabel: 'Meldungen',
 *     announcements: { alertDismissed: 'Hinweis verworfen' },
 *   }),
 *   provideTabsI18n(withTabsI18nLabels({ tabsLabel: 'Reiter' })),
 *   provideCardI18n(withCardI18nLabels({ selected: 'Ausgewählt' })),
 * ];
 *
 * bootstrapApplication(App, { providers: [...DE] });
 * ```
 *
 * @category ui/feedback/i18n
 * @since 0.1.0
 */
export function provideFeedbackI18n(
  overrides: CngxFeedbackI18nOverrides | Signal<CngxFeedbackI18nOverrides>,
): Provider {
  return {
    provide: CNGX_FEEDBACK_I18N,
    useFactory: () =>
      feedbackBundle.build([
        (bundle) =>
          createNestedOverrideMerge<CngxFeedbackI18n, 'announcements'>(
            bundle,
            overrides,
            'announcements',
          ),
      ]),
  };
}

/**
 * Inject the resolved feedback i18n bundle in an injection context: every key
 * left at its default follows the locale of the reading site (a
 * `provideLocaleAt` subtree), every key an override set stays. Read it inside
 * a `computed()`, template or handler so a language switch reaches the label.
 * One Signal per injector, bundle and locale, so row-level readers (alerts,
 * toasts, banners) share it.
 *
 * @category ui/feedback/i18n
 */
export function injectFeedbackI18n(): Signal<CngxFeedbackI18n> {
  return feedbackBundle.resolve(inject(CNGX_FEEDBACK_I18N));
}
