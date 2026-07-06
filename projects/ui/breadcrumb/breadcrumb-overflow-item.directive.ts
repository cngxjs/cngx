import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxBreadcrumbItem } from '@cngx/common/interactive';

/**
 * Context for the `*cngxBreadcrumbOverflowItem` template. Replaces the default
 * `crumb.resolvedLabel()` text inside the overflow menu; the surrounding
 * `<li cngxMenuItem>` shell (role, highlight, activation) stays library-owned.
 *
 * @category ui/breadcrumb
 */
export interface CngxBreadcrumbOverflowItemContext {
  /** Convenience alias for `crumb` - usable as the `let-crumb` shorthand. */
  readonly $implicit: CngxBreadcrumbItem;
  /** The collapsed crumb the row represents. */
  readonly crumb: CngxBreadcrumbItem;
  /** Row index inside `collapsedItems()`, starting at 0. */
  readonly index: number;
}

/**
 * Structural slot for the per-row body inside the {@link CngxBreadcrumbOverflow}
 * menu. Replaces the default label row so a consumer can render a navigable
 * crumb (an `<a href>` or `[routerLink]`); the `<li cngxMenuItem>` shell stays
 * library-owned.
 *
 * ```html
 * <cngx-breadcrumb-overflow>
 *   <ng-template cngxBreadcrumbOverflowItem let-crumb>
 *     <a [href]="hrefFor(crumb)">{{ crumb.resolvedLabel() }}</a>
 *   </ng-template>
 * </cngx-breadcrumb-overflow>
 * ```
 *
 * @category ui/breadcrumb
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-overflow-item.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbOverflow, CngxBreadcrumbBar
 * <example-url>http://localhost:4200/#/ui/breadcrumb/overflow/custom-overflow-row</example-url>
 */
@Directive({
  selector: 'ng-template[cngxBreadcrumbOverflowItem]',
  exportAs: 'cngxBreadcrumbOverflowItem',
  standalone: true,
})
export class CngxBreadcrumbOverflowItem {
  readonly templateRef = inject<TemplateRef<CngxBreadcrumbOverflowItemContext>>(TemplateRef);

  /** Narrows `let-` bindings to {@link CngxBreadcrumbOverflowItemContext} under strict templates. */
  static ngTemplateContextGuard(
    _dir: CngxBreadcrumbOverflowItem,
    _ctx: unknown,
  ): _ctx is CngxBreadcrumbOverflowItemContext {
    return true;
  }
}
