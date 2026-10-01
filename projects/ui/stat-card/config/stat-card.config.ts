import type { Signal } from '@angular/core';
import type { CngxLoadingTreatment } from '@cngx/core/utils';

/**
 * String fallbacks for the stat-card's non-content states. Every key is
 * optional; an unset key keeps the English default (`errorDescription` has
 * none and is omitted when unset).
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export interface CngxStatCardAriaLabels {
  /** Accessible name announced while the tile is loading. */
  readonly busy?: string;
  /** Headline of the error state shown instead of the stat when the first load failed. */
  readonly errorFallback?: string;
  /** Supporting detail under the error headline. Omitted when unset. */
  readonly errorDescription?: string;
  /** Note shown below stale numbers when a refresh failed. */
  readonly staleFallback?: string;
  /** Headline of the empty state shown when a load settled with no data. */
  readonly emptyFallback?: string;
}

/**
 * The resolved stat-card strings: every key with an English default is set.
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export type CngxStatCardResolvedAriaLabels = CngxStatCardAriaLabels &
  Required<Pick<CngxStatCardAriaLabels, 'busy' | 'errorFallback' | 'staleFallback' | 'emptyFallback'>>;

/**
 * App-wide cascade for the stat-card's ARIA/message strings and its default
 * loading treatment.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (e.g. `[errorText]`, `[loadingTreatment]`).
 *   2. `provideStatCardConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideStatCardConfig(...)` at the application root.
 *   4. Library defaults (English; merged in via `CNGX_STAT_CARD_DEFAULTS`).
 *
 * Every key is optional - partial overrides deep-merge with the library
 * defaults, so consumers declare only the keys they want to override.
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export interface CngxStatCardConfig {
  /**
   * String fallbacks for the tile's non-content states. Per-instance
   * `[busyLabel]` / `[errorText]` / `[staleText]` bindings still win. Accepts
   * a `Signal` so the strings follow a runtime language switch; read the
   * resolved bundle through {@link injectStatCardAriaLabels}.
   */
  readonly ariaLabels?: CngxStatCardAriaLabels | Signal<CngxStatCardAriaLabels>;

  /**
   * App-wide default loading treatment. Per-instance `[loadingTreatment]`
   * still wins; this only moves the cascade default. A flat top-level scalar,
   * not a nested sub-tree.
   */
  readonly loadingTreatment?: CngxLoadingTreatment;
}
