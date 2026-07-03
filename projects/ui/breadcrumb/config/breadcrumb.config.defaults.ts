import { InjectionToken } from '@angular/core';

import type { CngxBreadcrumbConfig } from './breadcrumb.config';

/**
 * Library defaults for the breadcrumb configuration cascade. English by
 * default per `feedback_en_default_locale`; locale overrides ride the
 * `withBreadcrumbAriaLabels` feature. The values are byte-identical to the
 * per-instance input defaults the components shipped before the cascade, so
 * an un-configured consumer sees no change.
 *
 * Exported for intra-lib consumers (`provideBreadcrumbConfig` deep-merges with
 * this base) but **NOT** re-exported from `public-api.ts` - downstream
 * consumers reach the defaults via `inject(CNGX_BREADCRUMB_CONFIG)` so
 * `provideBreadcrumbConfig` / `provideBreadcrumbConfigAt` overrides take
 * precedence.
 *
 * @internal
 */
export const CNGX_BREADCRUMB_DEFAULTS: CngxBreadcrumbConfig = {
  ariaLabels: {
    bar: 'Breadcrumb',
    overflowTrigger: 'Show collapsed breadcrumbs',
    overflowMenu: 'Collapsed breadcrumbs',
    siblingsTrigger: 'Show sibling pages',
    siblingsMenu: 'Sibling pages',
  },
  router: {
    dataKey: 'breadcrumb',
  },
};

/**
 * App-wide configuration cascade for the breadcrumb family. Resolves in
 * priority order:
 *
 *   1. Per-instance Input binding.
 *   2. `provideBreadcrumbConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideBreadcrumbConfig(...)` at the application root.
 *   4. Library defaults (this token's `factory`).
 *
 * `providedIn: 'root'` with a default factory means consumers never need to
 * provide the token explicitly - `inject(CNGX_BREADCRUMB_CONFIG)` always
 * resolves. Consumers who want overrides call `provideBreadcrumbConfig(...)`
 * in `bootstrapApplication` providers (root cascade) or
 * `provideBreadcrumbConfigAt(...)` in a component's `viewProviders`
 * (sub-tree cascade).
 *
 * @category ui/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/config/breadcrumb.config.defaults.ts
 * @since 0.1.0
 */
export const CNGX_BREADCRUMB_CONFIG = new InjectionToken<CngxBreadcrumbConfig>(
  'CNGX_BREADCRUMB_CONFIG',
  {
    providedIn: 'root',
    factory: () => CNGX_BREADCRUMB_DEFAULTS,
  },
);
