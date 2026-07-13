import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxBreadcrumbCrumb } from './breadcrumb.types';

/**
 * Context for the `*cngxBreadcrumbIcon` template. Renders a per-crumb icon
 * inside the {@link CngxBreadcrumbBar} crumb link (`<a>`), leading its label.
 * The `crumb` carries the opaque {@link CngxBreadcrumbCrumb.icon} token so the
 * slot can render it with any icon system.
 *
 * @category ui/breadcrumb
 */
export interface CngxBreadcrumbIconContext {
  /** Convenience alias for `crumb` - usable as the `let-crumb` shorthand. */
  readonly $implicit: CngxBreadcrumbCrumb;
  /** The crumb the icon belongs to. Read `crumb.icon` for the opaque token. */
  readonly crumb: CngxBreadcrumbCrumb;
  /** Crumb index inside the trail, starting at 0. */
  readonly index: number;
}

/**
 * Structural slot for a leading per-crumb icon inside the {@link CngxBreadcrumbBar}
 * trail. Projected once, it renders inside every crumb's link (`<a>`), *before*
 * the label span - the counterpart to the trailing
 * {@link CngxBreadcrumbItemAccessory} slot, which cannot lead because it renders
 * after the link and is siblings-owned. cngx never interprets the icon: it hands
 * the crumb's opaque {@link CngxBreadcrumbCrumb.icon} token to this template and
 * the consumer renders it with whatever system they use - `<mat-icon>`, an icon
 * font, inline SVG, or an `<app-icon>` component. cngx ships no icon set.
 *
 * ```html
 * <cngx-breadcrumb [items]="crumbs" skin="iconlabel">
 *   <ng-template cngxBreadcrumbIcon let-crumb>
 *     <mat-icon aria-hidden="true">{{ crumb.icon }}</mat-icon>
 *   </ng-template>
 * </cngx-breadcrumb>
 * ```
 *
 * The content skins style consumer markup projected here by class:
 * `shell` paints a leading root `.product-mark`, `record` a mono `.rec-id`;
 * `record` additionally styles a `.status-dot` / `.status-label` projected
 * through the trailing accessory slot. Those classes are the public markup
 * contract those skins paint against.
 *
 * @category ui/breadcrumb
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-icon.directive.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbBar, CngxBreadcrumbItemAccessory
 * <example-url>http://localhost:4200/#/ui/breadcrumb/skins/iconlabel</example-url>
 */
@Directive({
  selector: 'ng-template[cngxBreadcrumbIcon]',
  exportAs: 'cngxBreadcrumbIcon',
  standalone: true,
})
export class CngxBreadcrumbIcon {
  readonly templateRef = inject<TemplateRef<CngxBreadcrumbIconContext>>(TemplateRef);

  /** Narrows `let-` bindings to {@link CngxBreadcrumbIconContext} under strict templates. */
  static ngTemplateContextGuard(
    _dir: CngxBreadcrumbIcon,
    _ctx: unknown,
  ): _ctx is CngxBreadcrumbIconContext {
    return true;
  }
}
