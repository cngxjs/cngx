import type { Signal } from '@angular/core';
import type { CngxLoadingTreatment } from '@cngx/core/utils';
import type { CngxStatCardLanguageSection } from '../i18n/stat-card-language-section';

/**
 * String fallbacks for the stat-card's non-content states: a partial of the
 * `statCard` language section (declared once there; an unset key reads the
 * section, English without a pack) plus `errorDescription`, the supporting
 * detail under the error headline, which has no default and is omitted when
 * unset.
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export interface CngxStatCardAriaLabels extends Partial<CngxStatCardLanguageSection> {
  /** Supporting detail under the error headline. Omitted when unset. */
  readonly errorDescription?: string;
}

/**
 * The resolved stat-card strings: every key of the `statCard` section is set.
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export type CngxStatCardResolvedAriaLabels = CngxStatCardAriaLabels & CngxStatCardLanguageSection;

/**
 * App-wide cascade for the stat-card's ARIA/message strings and its default
 * loading treatment.
 *
 * Resolution priority (high -> low):
 *   1. Per-instance Input binding (e.g. `[errorText]`, `[loadingTreatment]`).
 *   2. `provideStatCardConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideStatCardConfig(...)` at the application root.
 *   4. Library defaults (`CNGX_STAT_CARD_DEFAULTS`; the strings come from the
 *      `statCard` section of the language pack).
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
