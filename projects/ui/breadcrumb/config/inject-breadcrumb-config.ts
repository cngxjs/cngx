import { inject } from '@angular/core';

import type { CngxBreadcrumbConfig } from './breadcrumb.config';
import { CNGX_BREADCRUMB_CONFIG } from './breadcrumb.config.defaults';

/**
 * Convenience accessor for the breadcrumb configuration cascade. Runs in
 * injection context; resolves through the priority chain (per-instance Input
 * -> `provideBreadcrumbConfigAt` -> `provideBreadcrumbConfig` -> library
 * defaults). Equivalent to `inject(CNGX_BREADCRUMB_CONFIG)` - the helper
 * exists so consumers don't import the token directly. Mirrors
 * `injectTagConfig` in `@cngx/common/display`.
 *
 * ```ts
 * export class CngxBreadcrumbBar {
 *   private readonly cfg = injectBreadcrumbConfig();
 *   readonly label = input<string>(this.cfg.ariaLabels?.bar ?? 'Breadcrumb');
 * }
 * ```
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export function injectBreadcrumbConfig(): CngxBreadcrumbConfig {
  return inject(CNGX_BREADCRUMB_CONFIG);
}
