import { inject } from '@angular/core';

import type { CngxSidenavConfig } from './sidenav.config';
import { CNGX_SIDENAV_CONFIG } from './sidenav.config.defaults';

/**
 * Convenience accessor for the sidenav configuration cascade. Runs in injection
 * context; resolves through the priority chain (per-instance Input ->
 * `provideSidenavConfigAt` -> `provideSidenavConfig` -> library defaults).
 * Equivalent to `inject(CNGX_SIDENAV_CONFIG)` - the helper exists so consumers
 * don't import the token directly. Mirrors `injectBreadcrumbConfig` in
 * `@cngx/ui/breadcrumb`.
 *
 * ```ts
 * export class CngxSidenav {
 *   private readonly cfg = injectSidenavConfig();
 *   readonly width = model<string>(this.cfg.dimensions?.width ?? '280px');
 * }
 * ```
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export function injectSidenavConfig(): CngxSidenavConfig {
  return inject(CNGX_SIDENAV_CONFIG);
}
