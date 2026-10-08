import { inject, type Signal } from '@angular/core';
import { createFilledOverrideMerge } from '@cngx/core/utils';

import { injectTocSiteCopy } from '../i18n/toc-i18n';
import type { CngxTocAriaLabels, CngxTocConfig } from './toc.config';
import { CNGX_TOC_CONFIG } from './toc.config.defaults';

/**
 * Convenience accessor for the toc configuration cascade. Runs in injection
 * context; resolves through the priority chain (per-instance Input ->
 * `provideTocConfigAt` -> `provideTocConfig` -> library defaults). Equivalent
 * to `inject(CNGX_TOC_CONFIG)` - the helper exists so consumers don't import
 * the token directly. Mirrors `injectBreadcrumbConfig`.
 *
 * ```ts
 * export class CngxToc {
 *   private readonly cfg = injectTocConfig();
 *   protected readonly navLabel = computed(() => this.cfg.ariaLabels?.nav ?? 'On this page');
 * }
 * ```
 *
 * @category ui/toc
 * @since 0.1.0
 */
export function injectTocConfig(): CngxTocConfig {
  return inject(CNGX_TOC_CONFIG);
}

/**
 * The resolved accessible names of the toc config in scope, every key the
 * config leaves unset (also a key an override sets to `undefined`) filled from
 * the `toc` section of the active pack, as a Signal that follows a runtime
 * language switch. Runs in injection context; read it inside a `computed()`, a template
 * or a handler.
 *
 * @category ui/toc
 * @since 0.1.0
 */
export function injectTocAriaLabels(): Signal<Required<CngxTocAriaLabels>> {
  return createFilledOverrideMerge(injectTocSiteCopy(), injectTocConfig().ariaLabels);
}
