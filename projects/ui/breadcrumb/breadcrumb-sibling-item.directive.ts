import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxBreadcrumbSibling } from './breadcrumb.types';

/**
 * Context for the `*cngxBreadcrumbSiblingItem` template. Replaces the default
 * sibling row inside the {@link CngxBreadcrumbSiblings} menu; the surrounding
 * `<li cngxMenuItem>` shell (role, highlight, activation, `aria-current`) stays
 * library-owned.
 *
 * @category ui/breadcrumb
 */
export interface CngxBreadcrumbSiblingItemContext {
  /** Convenience alias for `sibling` - usable as the `let-sibling` shorthand. */
  readonly $implicit: CngxBreadcrumbSibling;
  /** The sibling the row represents. */
  readonly sibling: CngxBreadcrumbSibling;
  /** Row index inside the siblings list, starting at 0. */
  readonly index: number;
}

/**
 * Structural slot for the per-row body inside the {@link CngxBreadcrumbSiblings}
 * menu. Replaces the default sibling row so a consumer can render a richer row
 * (an icon + label, a navigable `<a href>`); the `<li cngxMenuItem>` shell stays
 * library-owned.
 *
 * ```html
 * <cngx-breadcrumb-siblings [siblings]="siblings">
 *   <ng-template cngxBreadcrumbSiblingItem let-sibling>
 *     <a [href]="sibling.href">{{ sibling.label }}</a>
 *   </ng-template>
 * </cngx-breadcrumb-siblings>
 * ```
 *
 * @category ui/breadcrumb
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-sibling-item.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbSiblings
 * <example-url>http://localhost:4200/#/ui/breadcrumb/siblings/custom-row</example-url>
 */
@Directive({
  selector: 'ng-template[cngxBreadcrumbSiblingItem]',
  exportAs: 'cngxBreadcrumbSiblingItem',
  standalone: true,
})
export class CngxBreadcrumbSiblingItem {
  readonly templateRef = inject<TemplateRef<CngxBreadcrumbSiblingItemContext>>(TemplateRef);

  /** Narrows `let-` bindings to {@link CngxBreadcrumbSiblingItemContext} under strict templates. */
  static ngTemplateContextGuard(
    _dir: CngxBreadcrumbSiblingItem,
    _ctx: unknown,
  ): _ctx is CngxBreadcrumbSiblingItemContext {
    return true;
  }
}
