import { InjectionToken, type Signal } from '@angular/core';

// Type-only edge: erased at compile time (isolatedModules), so no runtime
// module cycle forms. The only runtime edge is item -> token (inject).
import type { CngxBreadcrumbItem } from './breadcrumb-item.directive';

/**
 * Contract a {@link CngxBreadcrumb} provides to its items and to a drop-in
 * overflow via DI. Item-keyed queries stay methods; the collapse set is
 * exposed as signals so a decoupled overflow can derive off them without
 * injecting the concrete coordinator class.
 */
export interface CngxBreadcrumbHost {
  /** Whether this item is the terminal crumb (gets `aria-current="page"`). */
  isTerminal(item: CngxBreadcrumbItem): boolean;
  /** Whether this item is collapsed into the overflow menu (hidden in the trail). */
  isCollapsed(item: CngxBreadcrumbItem): boolean;
  /** The crumbs currently collapsed into the overflow, in DOM order. */
  readonly collapsedItems: Signal<readonly CngxBreadcrumbItem[]>;
  /** Whether any crumb is collapsed (drives the overflow trigger's visibility). */
  readonly hasCollapsed: Signal<boolean>;
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
