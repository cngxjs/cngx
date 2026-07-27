import type { CngxLoadingTreatment } from '@cngx/core/utils';

import type { CngxStatCardConfig } from './stat-card.config';
import type { CngxStatCardConfigFeature } from './provide-stat-card-config';

/**
 * Override the stat-card's string fallbacks - the busy announcement, the
 * first-load error message, and the stale-data note. Per-instance
 * `[busyLabel]` / `[errorText]` / `[staleText]` bindings still win.
 *
 * Library defaults are English; this is the hook a localised app uses.
 *
 * ```ts
 * provideStatCardConfig(
 *   withStatCardAriaLabels({ busy: 'Lädt', errorFallback: 'Nicht verfügbar' }),
 * );
 * ```
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export function withStatCardAriaLabels(
  labels: NonNullable<CngxStatCardConfig['ariaLabels']>,
): CngxStatCardConfigFeature {
  return { kind: 'ariaLabels', payload: labels };
}

/**
 * Move the cascade default for what a tile renders while it loads. `'auto'`
 * (the library default) picks spinner vs skeleton from the latency the tile
 * observed; `'spinner'` and `'skeleton'` pin it app-wide. Per-instance
 * `[loadingTreatment]` still wins.
 *
 * @category ui/stat-card
 * @since 0.1.0
 */
export function withStatCardLoadingTreatment(
  treatment: CngxLoadingTreatment,
): CngxStatCardConfigFeature {
  return { kind: 'loadingTreatment', payload: { loadingTreatment: treatment } };
}
