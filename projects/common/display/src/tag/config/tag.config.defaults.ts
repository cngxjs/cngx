import { InjectionToken } from '@angular/core';

import type { CngxTagConfig } from './tag.config';

/**
 * Library defaults for the tag-family configuration cascade. English
 * by default per `feedback_en_default_locale`; locale overrides ride
 * the future `withAriaLabels` feature once it lands.
 *
 * Exported for intra-lib consumers (`provideTagConfig` deep-merges
 * with this base) but **NOT** re-exported from `public-api.ts` —
 * downstream consumers should reach the defaults via
 * `inject(CNGX_TAG_CONFIG)` so `provideTagConfig` /
 * `provideTagConfigAt` overrides take precedence.
 *
 * @internal
 */
export const CNGX_TAG_DEFAULTS: CngxTagConfig = {
  defaults: {
    variant: 'filled',
    color: 'neutral',
    size: 'md',
    truncate: false,
    maxWidth: null,
  },
  groupDefaults: {
    gap: 'sm',
    align: 'start',
    semanticList: false,
  },
  colors: {},
  templates: {},
  ariaLabels: {},
};

/**
 * App-wide configuration cascade for the tag family. Resolves in
 * priority order:
 *
 *   1. Per-instance Input binding.
 *   2. `provideTagConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideTagConfig(...)` at the application root.
 *   4. Library defaults (this token's `factory`).
 *
 * `providedIn: 'root'` with a default factory means consumers never
 * need to provide the token explicitly — `inject(CNGX_TAG_CONFIG)`
 * always resolves. Consumers who want overrides call
 * `provideTagConfig(...features)` in `bootstrapApplication` providers
 * (root cascade) or `provideTagConfigAt(...features)` in a component's
 * `viewProviders` (sub-tree cascade).
 *
 * @category display
 */
export const CNGX_TAG_CONFIG = new InjectionToken<CngxTagConfig>(
  'CNGX_TAG_CONFIG',
  {
    providedIn: 'root',
    factory: () => CNGX_TAG_DEFAULTS,
  },
);
