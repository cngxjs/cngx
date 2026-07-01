import { InjectionToken } from '@angular/core';

// Type-only edge: erased at compile time (isolatedModules), so no runtime
// module cycle forms. The only runtime edge is item -> token (inject).
import type { CngxBreadcrumbItem } from './breadcrumb-item.directive';

/** Contract a {@link CngxBreadcrumb} provides to its items via DI. */
export interface CngxBreadcrumbHost {
  /** Whether this item is the terminal crumb (gets `aria-current="page"`). */
  isTerminal(item: CngxBreadcrumbItem): boolean;
  /** Whether this item is collapsed into the overflow menu (hidden in the trail). */
  isCollapsed(item: CngxBreadcrumbItem): boolean;
}

/**
 * DI token for the {@link CngxBreadcrumbHost} contract. {@link CngxBreadcrumb}
 * provides it via `useExisting`; each {@link CngxBreadcrumbItem} injects it.
 *
 * @category common/interactive/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/breadcrumb/breadcrumb.token.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, CngxBreadcrumbItem
 */
export const CNGX_BREADCRUMB = new InjectionToken<CngxBreadcrumbHost>('CNGX_BREADCRUMB');
