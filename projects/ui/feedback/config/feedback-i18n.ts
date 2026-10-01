import { inject, InjectionToken, type Provider, type Signal } from '@angular/core';
import { coerceSignal, createNestedOverrideMerge, createOverrideMerge } from '@cngx/core/utils';

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
   * Optional for compatibility with full bundles written before it existed;
   * the English default applies when absent.
   */
  readonly alertOverflowVisible?: (count: number) => string;
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
  /**
   * Accessible name of the dismiss button on alerts, stacked alerts, toasts and
   * banners. Optional for compatibility with full bundles written before it
   * existed; the English default applies when absent.
   */
  readonly dismissLabel?: string;
  /**
   * Shown in the banner's `role="alert"` slot when its action rejects. Optional
   * for the same compatibility reason as {@link CngxFeedbackI18n.dismissLabel}.
   */
  readonly bannerActionFailed?: string;
  /**
   * Visible repeat marker on a toast raised more than once. Receives the repeat
   * count. Optional for the same compatibility reason as
   * {@link CngxFeedbackI18n.dismissLabel}.
   */
  readonly toastRepeatCount?: (count: number) => string;
  /**
   * Default accessible name of `CngxLoadingIndicator` and `CngxLoadingOverlay`
   * while their `label` input is unbound. Optional for the same compatibility
   * reason as {@link CngxFeedbackI18n.dismissLabel}.
   */
  readonly loadingLabel?: string;
  /**
   * Default accessible name of `CngxProgress` while its `label` input is
   * unbound. Optional for the same compatibility reason as
   * {@link CngxFeedbackI18n.dismissLabel}.
   */
  readonly progressLabel?: string;
  /**
   * `aria-valuetext` of a determinate `CngxProgress`. Receives the rounded
   * percent (0-100) and that value already formatted as a percent in the app
   * locale; the default returns the formatted string. Optional for the same
   * compatibility reason as {@link CngxFeedbackI18n.dismissLabel}.
   */
  readonly progressValueText?: (percent: number, formatted: string) => string;
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

/** @internal - English defaults, also the fallback for optional keys a full bundle omits. */
export const FEEDBACK_I18N_DEFAULTS: Required<CngxFeedbackI18n> & {
  readonly announcements: Required<CngxFeedbackAnnouncements>;
} = {
  alertsRegionLabel: 'Alerts',
  notificationsRegionLabel: 'Notifications',
  dismissLabel: 'Dismiss',
  bannerActionFailed: 'Action failed',
  toastRepeatCount: (count) => `(x${count})`,
  loadingLabel: 'Loading',
  progressLabel: 'Progress',
  progressValueText: (_percent, formatted) => formatted,
  announcements: {
    alertDismissed: 'Alert dismissed',
    alertOverflow: (count) => `+ ${count} more alerts`,
    alertOverflowVisible: (count) => `+ ${count} more`,
    asyncLoading: 'Loading content',
    asyncLoaded: 'Content loaded',
    asyncError: 'Error loading content',
    asyncRefreshing: 'Refreshing content',
    asyncRefreshed: 'Content refreshed',
    asyncRefreshFailed: 'Refresh failed',
  },
};

/**
 * DI token for the feedback i18n bundle, a `Signal` so region names, labels
 * and announcements follow a runtime language switch. `providedIn: 'root'`
 * with English defaults, so a consumer who provides nothing still gets named
 * regions.
 *
 * @category ui/feedback/i18n
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/config/feedback-i18n.ts
 * @since 0.1.0
 * @relatedTo CngxAlertStack, CngxToastOutlet
 */
export const CNGX_FEEDBACK_I18N = new InjectionToken<Signal<CngxFeedbackI18n>>(
  'CngxFeedbackI18n',
  {
    providedIn: 'root',
    factory: () => coerceSignal<CngxFeedbackI18n>(FEEDBACK_I18N_DEFAULTS),
  },
);

/**
 * Override the feedback region names from inside `provideFeedback()`. Unset
 * keys keep the English default, and `announcements` merges key by key. Pass
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
 * defaults the app set elsewhere. Unset keys keep the English default,
 * `announcements` merges key by key, and a `Signal` switches the language at
 * runtime.
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
      createNestedOverrideMerge<CngxFeedbackI18n, 'announcements'>(
        FEEDBACK_I18N_DEFAULTS,
        overrides,
        'announcements',
      ),
  };
}

/**
 * Inject the resolved feedback i18n bundle.
 *
 * @category ui/feedback/i18n
 */
export function injectFeedbackI18n(): Signal<CngxFeedbackI18n> {
  return inject(CNGX_FEEDBACK_I18N);
}

/**
 * @internal - the feedback bundle as a shared signal with every optional key
 * filled from the English defaults. One `computed()` per injected bundle, so
 * row-level readers (alerts, toasts, banners) allocate nothing after the first.
 */
export function injectResolvedFeedbackI18n(): Signal<Required<CngxFeedbackI18n>> {
  return createOverrideMerge<Required<CngxFeedbackI18n>>(
    FEEDBACK_I18N_DEFAULTS,
    injectFeedbackI18n(),
  );
}
