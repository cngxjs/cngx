import { inject } from '@angular/core';

import type { CngxTocConfig } from './toc.config';
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
