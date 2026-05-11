import {
  type EnvironmentProviders,
  InjectionToken,
  type Provider,
  type Type,
  makeEnvironmentProviders,
} from '@angular/core';

import { CNGX_CLOSE_ICON } from '@cngx/common/interactive';

import type { AlertSeverity } from '../alert/alert';
import { CngxAlerter } from '../alert/alerter.service';
import { CngxBanner } from '../banner/banner.service';
import { CngxToaster } from '../toast/toast.service';

/**
 * Global configuration for all feedback components.
 * Provided via `provideFeedback()` with `with*` features.
 *
 * @category configuration
 */
export interface FeedbackConfig {
  /** Custom spinner component to replace the built-in SVG spinner. */
  spinnerComponent?: Type<unknown>;

  /** Custom icon components per alert severity. Replaces built-in SVG icons. */
  alertIcons?: Partial<Record<AlertSeverity, Type<unknown>>>;

  /** Default delay in ms before showing loading indicators. */
  loadingDelay?: number;

  /** Default minimum display time in ms for loading indicators. */
  loadingMinDuration?: number;

  /** Custom close/dismiss icon component — replaces default X SVG globally. */
  closeIconComponent?: Type<unknown>;

  /** Default auto-dismiss duration for toasts in ms. */
  toastDefaultDuration?: number;

  /** Dedup window for identical toasts in ms. */
  toastDedupWindow?: number;

  /** Default auto-dismiss duration for scoped alerts in ms. `undefined` = persistent. */
  alertDefaultDuration?: number;

  /** Dedup window for identical alerts in ms. */
  alertDedupWindow?: number;

  /** Default max visible alerts per stack. */
  alertMaxVisible?: number;
}

/**
 * Injection token for the global feedback configuration.
 * Components read this with `inject(CNGX_FEEDBACK_CONFIG, { optional: true })`.
 *
 * @category tokens
 */
export const CNGX_FEEDBACK_CONFIG = new InjectionToken<FeedbackConfig>('CngxFeedbackConfig');

/** A feature configuration function returned by `withXxx()` helpers. */
export interface FeedbackFeature {
  /** @internal */
  readonly _apply: (config: FeedbackConfig) => FeedbackConfig;
  /** @internal — additional providers contributed by this feature. */
  readonly _providers?: Provider[];
}

/**
 * Register global defaults for all feedback components.
 *
 * @usageNotes
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideFeedback(
 *       withSpinnerTemplate(MyLucideSpinner),
 *       withAlertIcons({ error: MyErrorIcon, warning: MyWarningIcon }),
 *       withLoadingDefaults({ delay: 300, minDuration: 600 }),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category configuration
 */
export function provideFeedback(...features: FeedbackFeature[]): EnvironmentProviders {
  let config: FeedbackConfig = {};
  const extraProviders: Provider[] = [];

  for (const f of features) {
    config = f._apply(config);
    if (f._providers) {
      extraProviders.push(...f._providers);
    }
  }

  return makeEnvironmentProviders([
    { provide: CNGX_FEEDBACK_CONFIG, useValue: config },
    ...extraProviders,
  ]);
}

/**
 * Replace the built-in SVG spinner in `CngxLoadingIndicator` and `CngxLoadingOverlay`.
 *
 * The component receives no inputs — it should be a self-contained spinner
 * (e.g. a Lucide `<loader-2>` with CSS animation, or a Material `<mat-spinner>`).
 *
 * @example
 * ```ts
 * provideFeedback(withSpinnerTemplate(MatProgressSpinner))
 * ```
 */
export function withSpinnerTemplate(component: Type<unknown>): FeedbackFeature {
  return { _apply: (c) => ({ ...c, spinnerComponent: component }) };
}

/**
 * Replace the built-in SVG icons in `CngxAlert` per severity.
 *
 * Each component receives no inputs — it should render a single icon.
 * Only specified severities are replaced; others keep the built-in SVG.
 *
 * @example
 * ```ts
 * provideFeedback(withAlertIcons({
 *   error: MyErrorIcon,
 *   warning: MyWarningIcon,
 *   success: MyCheckIcon,
 *   info: MyInfoIcon,
 * }))
 * ```
 */
export function withAlertIcons(
  icons: Partial<Record<AlertSeverity, Type<unknown>>>,
): FeedbackFeature {
  return {
    _apply: (c) => ({
      ...c,
      alertIcons: { ...c.alertIcons, ...icons },
    }),
  };
}

/**
 * Set default timing for all loading indicators and overlays.
 *
 * Individual components can still override via their `[delay]` and `[minDuration]` inputs.
 *
 * @example
 * ```ts
 * provideFeedback(withLoadingDefaults({ delay: 300, minDuration: 600 }))
 * ```
 */
export function withLoadingDefaults(opts: {
  delay?: number;
  minDuration?: number;
}): FeedbackFeature {
  return {
    _apply: (c) => ({
      ...c,
      loadingDelay: opts.delay ?? c.loadingDelay,
      loadingMinDuration: opts.minDuration ?? c.loadingMinDuration,
    }),
  };
}

/**
 * Replace the built-in X SVG in all close/dismiss buttons globally.
 *
 * The component receives no inputs — it should render a single icon.
 * Per-instance override via content projection on `CngxCloseButton` takes precedence.
 *
 * @example
 * ```ts
 * provideFeedback(withCloseIcon(MyLucideXIcon))
 * ```
 */
export function withCloseIcon(component: Type<unknown>): FeedbackFeature {
  return {
    _apply: (c) => ({ ...c, closeIconComponent: component }),
    _providers: [{ provide: CNGX_CLOSE_ICON, useValue: component }],
  };
}

/**
 * Enable the toast system within `provideFeedback()`.
 *
 * Provides `CngxToaster` at the environment level.
 * Without this feature, `CngxToastOn` and `CngxToastOutlet` will throw
 * a `NullInjectorError` at runtime.
 *
 * @param opts Optional toast defaults.
 *
 * @example
 * ```ts
 * provideFeedback(
 *   withToasts(),
 *   withAlertIcons({ error: MyErrorIcon }),
 * )
 * ```
 */
export function withToasts(opts?: {
  /** Default auto-dismiss duration in ms. */
  defaultDuration?: number;
  /** Dedup window in ms. */
  dedupWindow?: number;
}): FeedbackFeature {
  return {
    _apply: (c) => ({
      ...c,
      toastDefaultDuration: opts?.defaultDuration,
      toastDedupWindow: opts?.dedupWindow,
    }),
    _providers: [CngxToaster],
  };
}

/**
 * Enable the scoped alert system within `provideFeedback()`.
 *
 * Provides `CngxAlerter` at the environment level for root-level injection.
 * Without this feature, `CngxAlerter` is only available via `CngxAlertStack`'s
 * `viewProviders` (scoped injection).
 *
 * The token is opaque — always use `provideFeedback()` with feature functions,
 * never construct the config object manually.
 *
 * @param opts Optional alert defaults.
 *
 * @example
 * ```ts
 * provideFeedback(
 *   withToasts(),
 *   withAlerts(),
 * )
 * ```
 */
export function withAlerts(opts?: {
  /** Default auto-dismiss duration in ms. `undefined` = persistent. */
  defaultDuration?: number;
  /** Dedup window in ms. */
  dedupWindow?: number;
  /** Default max visible alerts per stack. */
  maxVisible?: number;
}): FeedbackFeature {
  return {
    _apply: (c) => ({
      ...c,
      alertDefaultDuration: opts?.defaultDuration,
      alertDedupWindow: opts?.dedupWindow ?? c.alertDedupWindow,
      alertMaxVisible: opts?.maxVisible ?? c.alertMaxVisible,
    }),
    _providers: [CngxAlerter],
  };
}

/**
 * Enable the global banner system within `provideFeedback()`.
 *
 * Provides `CngxBanner` at the environment level.
 * Without this feature, `CngxBannerOutlet` will throw a `NullInjectorError`.
 *
 * Banners are always persistent — no `duration`. Dismiss programmatically
 * via `banner.dismiss(id)` when the condition resolves.
 *
 * @example
 * ```ts
 * provideFeedback(
 *   withToasts(),
 *   withAlerts(),
 *   withBanners(),
 * )
 * ```
 */
export function withBanners(): FeedbackFeature {
  return {
    _apply: (c) => c,
    _providers: [CngxBanner],
  };
}
