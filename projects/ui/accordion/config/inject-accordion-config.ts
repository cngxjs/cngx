import { inject } from '@angular/core';

import type { CngxAccordionConfig } from './accordion.config';
import { CNGX_ACCORDION_CONFIG } from './accordion.config.defaults';

/**
 * Convenience accessor for the accordion configuration cascade. Runs in
 * injection context; resolves through the priority chain (per-instance Input
 * -> `provideAccordionConfigAt` -> `provideAccordionConfig` -> library
 * defaults). Equivalent to `inject(CNGX_ACCORDION_CONFIG)` - the helper exists
 * so consumers don't import the token directly. Mirrors `injectBreadcrumbConfig`
 * in `@cngx/ui/breadcrumb`.
 *
 * ```ts
 * export class CngxAccordionItem {
 *   private readonly config = injectAccordionConfig();
 *   readonly disabledReason = input<string>(this.config.disabledReason);
 * }
 * ```
 *
 * @category ui/accordion
 * @since 0.1.0
 */
export function injectAccordionConfig(): CngxAccordionConfig {
  return inject(CNGX_ACCORDION_CONFIG);
}
