import { DOCUMENT } from '@angular/common';
import { inject, InjectionToken } from '@angular/core';

import type { CngxSidenavConfig } from './sidenav.config';

/**
 * Library defaults for the sidenav configuration cascade. The values are
 * byte-identical to the per-instance input defaults `CngxSidenav` shipped
 * before the cascade (`width '280px'`, `miniWidth '56px'`, `minWidth '120px'`,
 * `maxWidth '600px'`, `enterDelay 120`, `leaveDelay 0`; `shortcut` omitted =
 * `undefined`), so an un-configured consumer sees no change.
 *
 * The `leaveDelay 0` default is kept deliberately (instant collapse, asymmetric
 * with the 120ms enter): the dwell becomes tunable via `[leaveDelay]` /
 * `withSidenavHoverDwell(...)`, not silently changed - the breadcrumb
 * "un-configured consumer sees no change" principle.
 *
 * Exported for intra-lib consumers (`provideSidenavConfig` deep-merges with
 * this base) but **NOT** re-exported from `public-api.ts` - downstream
 * consumers reach the defaults via `inject(CNGX_SIDENAV_CONFIG)` so
 * `provideSidenavConfig` / `provideSidenavConfigAt` overrides take precedence.
 *
 * @internal
 */
export const CNGX_SIDENAV_DEFAULTS: CngxSidenavConfig = {
  dimensions: {
    width: '280px',
    miniWidth: '56px',
    minWidth: '120px',
    maxWidth: '600px',
  },
  hover: {
    enterDelay: 120,
    leaveDelay: 0,
  },
  // Empty so an un-configured consumer keeps the `'nav'` literal the directive
  // resolves at its use-site - byte-identical to no config.
  routerSync: {},
};

/**
 * App-wide configuration cascade for the sidenav family. Resolves in priority
 * order:
 *
 *   1. Per-instance Input binding.
 *   2. `provideSidenavConfigAt(...)` in a parent component's `viewProviders`.
 *   3. `provideSidenavConfig(...)` at the application root.
 *   4. Library defaults (this token's `factory`).
 *
 * `providedIn: 'root'` with a default factory means consumers never need to
 * provide the token explicitly - `inject(CNGX_SIDENAV_CONFIG)` always resolves.
 * Consumers who want overrides call `provideSidenavConfig(...)` in
 * `bootstrapApplication` providers (root cascade) or `provideSidenavConfigAt(...)`
 * in a component's `viewProviders` (sub-tree cascade).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/config/sidenav.config.defaults.ts
 * @since 0.1.0
 */
export const CNGX_SIDENAV_CONFIG = new InjectionToken<CngxSidenavConfig>('CNGX_SIDENAV_CONFIG', {
  providedIn: 'root',
  factory: () => CNGX_SIDENAV_DEFAULTS,
});

/**
 * Storage backend of `withSidenavPersistence()`. Defaults to the browser
 * `localStorage`, `null` on the server (nothing is persisted). Override it to
 * persist elsewhere (`sessionStorage`, a server-backed `Storage` shim):
 *
 * ```ts
 * providers: [{ provide: CNGX_SIDENAV_STORAGE, useFactory: () => sessionStorage }];
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/sidenav/config/sidenav.config.defaults.ts
 * @since 0.1.0
 * @relatedTo withSidenavPersistence
 */
export const CNGX_SIDENAV_STORAGE = new InjectionToken<Storage | null>('CNGX_SIDENAV_STORAGE', {
  providedIn: 'root',
  factory: () => inject(DOCUMENT).defaultView?.localStorage ?? null,
});
