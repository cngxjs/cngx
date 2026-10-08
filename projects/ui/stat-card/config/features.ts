import type { Signal } from '@angular/core';
import type { CngxLoadingTreatment } from '@cngx/core/utils';

import type { CngxStatCardAriaLabels } from './stat-card.config';
import type { CngxStatCardConfigFeature } from './provide-stat-card-config';

/**
 * Override the stat-card's string fallbacks - the busy announcement, the
 * first-load error message, and the stale-data note. Per-instance
 * `[busyLabel]` / `[errorText]` / `[staleText]` bindings still win.
 *
 * The defaults come from the `statCard` section of the language pack (English
 * without one); this overrides single keys on top of it. Pass a
 * `Signal` to switch the language at runtime; a tile with a live region speaks
 * the new language with its next state change.
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
  labels: CngxStatCardAriaLabels | Signal<CngxStatCardAriaLabels>,
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
