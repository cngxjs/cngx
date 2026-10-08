import { inject, type Signal } from '@angular/core';
import { createFilledOverrideMerge } from '@cngx/core/utils';

import { injectBreadcrumbSiteCopy } from '../i18n/breadcrumb-i18n';
import type { CngxBreadcrumbAriaLabels, CngxBreadcrumbConfig } from './breadcrumb.config';
import { CNGX_BREADCRUMB_CONFIG } from './breadcrumb.config.defaults';

/**
 * Convenience accessor for the breadcrumb configuration cascade. Runs in
 * injection context; resolves through the priority chain (per-instance Input
 * -> `provideBreadcrumbConfigAt` -> `provideBreadcrumbConfig` -> library
 * defaults). Equivalent to `inject(CNGX_BREADCRUMB_CONFIG)` - the helper
 * exists so consumers don't import the token directly. Mirrors
 * `injectTagConfig` in `@cngx/common/display`.
 *
 * `ariaLabels` may hold a `Signal`; read the resolved bundle through
 * {@link injectBreadcrumbAriaLabels}.
 *
 * ```ts
 * export class MyTrail {
 *   private readonly cfg = injectBreadcrumbConfig();
 *   protected readonly skin = computed(() => this.cfg.skin ?? 'classic');
 * }
 * ```
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export function injectBreadcrumbConfig(): CngxBreadcrumbConfig {
  return inject(CNGX_BREADCRUMB_CONFIG);
}

/**
 * The resolved accessible names of the breadcrumb config in scope, every key
 * the config leaves unset (also a key an override sets to `undefined`) filled
 * from the `breadcrumb` section of the active pack, as a Signal that follows a
 * runtime language switch. Runs in injection context; read it inside a `computed()`,
 * a template or a handler.
 *
 * ```ts
 * export class MyTrail {
 *   private readonly labels = injectBreadcrumbAriaLabels();
 *   protected readonly name = computed(() => this.labels().bar);
 * }
 * ```
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 */
export function injectBreadcrumbAriaLabels(): Signal<Required<CngxBreadcrumbAriaLabels>> {
  return createFilledOverrideMerge(injectBreadcrumbSiteCopy(), injectBreadcrumbConfig().ariaLabels);
}
