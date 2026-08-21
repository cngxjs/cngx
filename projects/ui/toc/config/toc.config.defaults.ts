import { InjectionToken } from '@angular/core';

import type { CngxTocConfig } from './toc.config';

/**
 * Library defaults for the toc configuration cascade. English by default per
 * `feedback_en_default_locale`; locale overrides ride the `withTocAriaLabels`
 * feature. The spy defaults (`rootMargin` / `threshold`) mirror
 * `CngxScrollSpy`'s own input defaults so an un-configured toc tracks
 * scrolling identically to a hand-wired spy.
 *
 * Exported for intra-lib consumers (`provideTocConfig` deep-merges with this
 * base) but **NOT** re-exported from `public-api.ts` - downstream consumers
 * reach the defaults via `inject(CNGX_TOC_CONFIG)` so `provideTocConfig` /
 * `provideTocConfigAt` overrides take precedence.
 *
 * @internal
 */
export const CNGX_TOC_DEFAULTS: CngxTocConfig = {
  ariaLabels: {
    nav: 'On this page',
  },
  scrollBehavior: 'smooth',
  spy: {
    rootMargin: '0px',
    threshold: 0.3,
  },
};

/**
 * App-wide configuration cascade for the table-of-contents organism. Resolves
 * in priority order:
 *
 *   1. Per-instance Input binding.
 *   2. `provideTocConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideTocConfig(...)` at the application root.
 *   4. Library defaults (this token's `factory`).
 *
 * `providedIn: 'root'` with a default factory means consumers never need to
 * provide the token explicitly - `inject(CNGX_TOC_CONFIG)` always resolves.
 * Consumers who want overrides call `provideTocConfig(...)` in
 * `bootstrapApplication` providers (root cascade) or `provideTocConfigAt(...)`
 * in a component's `viewProviders` (sub-tree cascade).
 *
 * @category ui/toc
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/toc/config/toc.config.defaults.ts
 * @since 0.1.0
 */
export const CNGX_TOC_CONFIG = new InjectionToken<CngxTocConfig>('CNGX_TOC_CONFIG', {
  providedIn: 'root',
  factory: () => CNGX_TOC_DEFAULTS,
});
