import {
  type EnvironmentProviders,
  InjectionToken,
  type Provider,
  type Type,
  makeEnvironmentProviders,
} from '@angular/core';
import type { AlertSeverity } from './alert';

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
