import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxBreadcrumbCrumb } from './breadcrumb.types';

/**
 * Context for the `*cngxBreadcrumbItemAccessory` template. Renders a per-crumb
 * accessory inside the {@link CngxBreadcrumbBar} crumb `<li>` (typically a
 * {@link CngxBreadcrumbSiblings} dropdown, static or router-driven). When the
 * slot is projected it owns the accessory area for every crumb - the crumb's
 * declarative `siblings` auto-render is suppressed.
 *
 * @category ui/breadcrumb
 */
export interface CngxBreadcrumbItemAccessoryContext {
  /** Convenience alias for `crumb` - usable as the `let-crumb` shorthand. */
  readonly $implicit: CngxBreadcrumbCrumb;
  /** The crumb the accessory belongs to. */
  readonly crumb: CngxBreadcrumbCrumb;
  /** Crumb index inside the trail, starting at 0. */
  readonly index: number;
}

/**
 * Structural slot for a per-crumb accessory inside the {@link CngxBreadcrumbBar}
 * trail. Projected once, it renders inside every crumb's `<li>` (after the link),
 * so a consumer can attach custom chrome or the router-driven siblings source
 * that the declarative `crumb.siblings` field cannot reach (the bar stays free of
 * `@angular/router`). When present, the slot wins globally over the declarative
 * auto-render - one predictable owner of the accessory area.
 *
 * ```html
 * <cngx-breadcrumb [items]="crumbs">
 *   <ng-template cngxBreadcrumbItemAccessory let-crumb>
 *     @if (crumb.siblings; as sibs) {
 *       <cngx-breadcrumb-siblings [siblings]="sibs" />
 *     }
 *   </ng-template>
 * </cngx-breadcrumb>
 * ```
 *
 * @category ui/breadcrumb
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-item-accessory.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbBar, CngxBreadcrumbSiblings
 * <example-url>http://localhost:4200/#/ui/breadcrumb/siblings/accessory-slot</example-url>
 */
@Directive({
  selector: 'ng-template[cngxBreadcrumbItemAccessory]',
  exportAs: 'cngxBreadcrumbItemAccessory',
  standalone: true,
})
export class CngxBreadcrumbItemAccessory {
  readonly templateRef = inject<TemplateRef<CngxBreadcrumbItemAccessoryContext>>(TemplateRef);

  /** Narrows `let-` bindings to {@link CngxBreadcrumbItemAccessoryContext} under strict templates. */
  static ngTemplateContextGuard(
    _dir: CngxBreadcrumbItemAccessory,
    _ctx: unknown,
  ): _ctx is CngxBreadcrumbItemAccessoryContext {
    return true;
  }
}
