import { inject, type Signal } from '@angular/core';
import { createFilledOverrideMerge } from '@cngx/core/utils';

import { injectSidenavSiteLabels } from '../i18n/sidenav-i18n';
import type { CngxSidenavConfig, CngxSidenavLabels } from './sidenav.config';
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

/**
 * The resolved sidenav labels in scope, as a Signal that follows a runtime
 * language switch: the `sidenav` section of the active pack formatted for the
 * locale of the reading injector, with the `CNGX_SIDENAV_CONFIG` labels on
 * top. A key the config sets wins; a key it leaves unset, `null` or
 * `undefined` reads the section. Runs in injection context; read it inside a
 * `computed()`, a template or a handler.
 *
 * @category ui/sidenav
 * @since 0.1.0
 * @relatedTo withSidenavLabels
 */
export function injectSidenavLabels(): Signal<CngxSidenavLabels> {
  return createFilledOverrideMerge(injectSidenavSiteLabels(), injectSidenavConfig().labels);
}
