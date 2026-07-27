import { InjectionToken } from '@angular/core';

import type { CngxStatCardConfig } from './stat-card.config';

/**
 * Library defaults for the stat-card configuration cascade. English by
 * default; locale overrides ride the `withStatCardAriaLabels` feature. The
 * values are byte-identical to the per-instance input defaults the component
 * shipped before the cascade, so an un-configured consumer sees no change.
 *
 * Exported for intra-lib consumers (`provideStatCardConfig` deep-merges with
 * this base) but **NOT** re-exported from `public-api.ts` - downstream
 * consumers reach the defaults via `inject(CNGX_STAT_CARD_CONFIG)` so
 * `provideStatCardConfig` / `provideStatCardConfigAt` overrides take
 * precedence.
 *
 * @internal
 */
export const CNGX_STAT_CARD_DEFAULTS: CngxStatCardConfig = {
  ariaLabels: {
    busy: 'Loading',
    errorFallback: 'Could not load',
    staleFallback: 'Showing last known value',
  },
  loadingTreatment: 'auto',
};

/**
 * App-wide configuration cascade for the stat-card. Resolves in priority
 * order:
 *
 *   1. Per-instance Input binding.
 *   2. `provideStatCardConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideStatCardConfig(...)` at the application root.
 *   4. Library defaults (this token's `factory`).
 *
 * `providedIn: 'root'` with a default factory means consumers never need to
 * provide the token explicitly - `inject(CNGX_STAT_CARD_CONFIG)` always
 * resolves.
 *
 * @category ui/stat-card
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/stat-card/config/stat-card.config.defaults.ts
 * @since 0.1.0
 * @relatedTo provideStatCardConfig, provideStatCardConfigAt, injectStatCardConfig
 */
export const CNGX_STAT_CARD_CONFIG = new InjectionToken<CngxStatCardConfig>(
  'CNGX_STAT_CARD_CONFIG',
  {
    providedIn: 'root',
    factory: () => CNGX_STAT_CARD_DEFAULTS,
  },
);
