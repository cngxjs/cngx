import { Directive, inject, TemplateRef } from '@angular/core';

import type { ArrowEdge } from './popover.types';

/**
 * Context object passed to a `*cngxPopoverArrow` template.
 *
 * The consumer's glyph receives the resolved panel edge (`top` / `bottom` /
 * `left` / `right`) and the inline-axis offset in CSS pixels that the
 * library would have placed the default diamond at. Either can be used to
 * rotate, translate, or theme the custom glyph so it tracks the trigger.
 *
 * @category common/popover
 */
export interface CngxPopoverArrowContext {
  /** Primary edge of the panel facing the trigger. */
  readonly edge: ArrowEdge;
  /**
   * Inline-axis offset from the panel edge to the trigger's centre, in
   * CSS pixels. `null` before the first geometry read (the consumer
   * should treat `null` as "centre the glyph" — the default diamond
   * falls back to `50%` in the same case).
   */
  readonly offsetPx: number | null;
}

/**
 * Marks the header content inside `cngx-popover-panel`.
 *
 * @category common/popover
 */
@Directive({ selector: '[cngxPopoverHeader]', standalone: true })
export class CngxPopoverHeader {}

/**
 * Marks the body content inside `cngx-popover-panel`.
 *
 * @category common/popover
 */
@Directive({ selector: '[cngxPopoverBody]', standalone: true })
export class CngxPopoverBody {}

/**
 * Marks the footer content inside `cngx-popover-panel`.
 *
 * @category common/popover
 */
@Directive({ selector: '[cngxPopoverFooter]', standalone: true })
export class CngxPopoverFooter {}

/**
 * Custom close button template. Overrides the default close button.
 *
 * ```html
 * <ng-template cngxPopoverClose>
 *   <button mat-icon-button (click)="panel.popover.hide()">
 *     <mat-icon>close</mat-icon>
 *   </button>
 * </ng-template>
 * ```
 *
 * @category common/popover
 */
@Directive({ selector: 'ng-template[cngxPopoverClose]', standalone: true })
export class CngxPopoverClose {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Template shown while panel content is loading.
 *
 * @category common/popover
 */
@Directive({ selector: 'ng-template[cngxPopoverLoading]', standalone: true })
export class CngxPopoverLoading {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Template shown when panel content is empty.
 *
 * @category common/popover
 */
@Directive({ selector: 'ng-template[cngxPopoverEmpty]', standalone: true })
export class CngxPopoverEmpty {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Template shown when panel content failed to load. Context: `$implicit` = error.
 *
 * @category common/popover
 */
@Directive({ selector: 'ng-template[cngxPopoverError]', standalone: true })
export class CngxPopoverError {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Custom arrow ornament template. Overrides the default rotated-diamond
 * arrow when projected as a child of `<cngx-popover-panel>`. The library
 * routes the resolved panel edge and the live inline-axis offset to the
 * template via `CngxPopoverArrowContext`.
 *
 * ```html
 * <cngx-popover-panel #pop [showArrow]="true">
 *   <ng-template cngxPopoverArrow let-edge="edge" let-offsetPx="offsetPx">
 *     <svg class="brand-arrow" [attr.data-edge]="edge"
 *          [style.--offset]="offsetPx ? offsetPx + 'px' : '50%'">
 *       <use href="#arrow-glyph" />
 *     </svg>
 *   </ng-template>
 * </cngx-popover-panel>
 * ```
 *
 * @category common/popover
 */
@Directive({ selector: 'ng-template[cngxPopoverArrow]', standalone: true })
export class CngxPopoverArrow {
  readonly templateRef = inject<TemplateRef<CngxPopoverArrowContext>>(TemplateRef);
}
