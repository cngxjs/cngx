import { Directive, inject, TemplateRef } from '@angular/core';

import type { ArrowEdge } from './popover.types';

/**
 * Context object passed to a `*cngxPopoverArrow` template.
 *
 * The consumer's glyph receives the resolved panel edge (`top` / `bottom` /
 * `left` / `right`) and the inline-axis offset in CSS pixels that the
 * library would have placed the default diamond at. Either can be used to
 * rotate, translate, or theme the custom glyph so it tracks the trigger.
 */
export interface CngxPopoverArrowContext {
  /** Primary edge of the panel facing the trigger. */
  readonly edge: ArrowEdge;
  /**
   * Inline-axis offset from the panel edge to the trigger's centre, in
   * CSS pixels. `null` before the first geometry read (the consumer
   * should treat `null` as "centre the glyph" - the default diamond
   * falls back to `50%` in the same case).
   */
  readonly offsetPx: number | null;
}

/**
 * Marks the header content inside `cngx-popover-panel`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel, CngxPopoverBody, CngxPopoverFooter
 */
@Directive({ selector: '[cngxPopoverHeader]', standalone: true })
export class CngxPopoverHeader {}

/**
 * Marks the body content inside `cngx-popover-panel`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel, CngxPopoverHeader, CngxPopoverFooter
 */
@Directive({ selector: '[cngxPopoverBody]', standalone: true })
export class CngxPopoverBody {}

/**
 * Marks the footer content inside `cngx-popover-panel`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel, CngxPopoverHeader, CngxPopoverBody, CngxPopoverAction
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
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel
 */
@Directive({ selector: 'ng-template[cngxPopoverClose]', standalone: true })
export class CngxPopoverClose {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Context passed to a `*cngxPopoverLoading` or `*cngxPopoverEmpty` template:
 * the copy the panel would render without the template, resolved from the
 * `[loadingText]` / `[emptyText]` input, then `withPopoverPanelLabels(...)`,
 * then the `popover` section of the active language pack. A template that
 * only restyles the state can print it instead of carrying its own string.
 *
 * @since 0.1.0
 */
export interface CngxPopoverStateCopyContext {
  /** The resolved default copy of the state view. */
  readonly $implicit: string;
  /** Same value as `$implicit`, for a named `let-text="text"`. */
  readonly text: string;
}

/**
 * Context passed to a `*cngxPopoverError` template.
 *
 * `$implicit` stays the raw error (from `[error]` or the bound `[state]`),
 * `text` is the copy the panel would render without the template, resolved
 * from `[errorText]`, then `withPopoverPanelLabels(...)`, then the language
 * pack.
 *
 * @since 0.1.0
 */
export interface CngxPopoverErrorContext {
  /** The raw error behind the error view. */
  readonly $implicit: unknown;
  /** Same value as `$implicit`, for a named `let-error="error"`. */
  readonly error: unknown;
  /** The resolved default error copy. */
  readonly text: string;
}

/**
 * Template shown while panel content is loading. Context:
 * `CngxPopoverStateCopyContext` (`$implicit` / `text` = resolved loading copy).
 *
 * ```html
 * <ng-template cngxPopoverLoading let-text>
 *   <span class="brand-spinner" aria-hidden="true"></span> {{ text }}
 * </ng-template>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel, CngxPopoverEmpty, CngxPopoverError
 */
@Directive({ selector: 'ng-template[cngxPopoverLoading]', standalone: true })
export class CngxPopoverLoading {
  readonly templateRef = inject<TemplateRef<CngxPopoverStateCopyContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxPopoverLoading,
    ctx: unknown,
  ): ctx is CngxPopoverStateCopyContext {
    return true;
  }
}

/**
 * Template shown when panel content is empty. Context:
 * `CngxPopoverStateCopyContext` (`$implicit` / `text` = resolved empty copy).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel, CngxPopoverLoading, CngxPopoverError
 */
@Directive({ selector: 'ng-template[cngxPopoverEmpty]', standalone: true })
export class CngxPopoverEmpty {
  readonly templateRef = inject<TemplateRef<CngxPopoverStateCopyContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxPopoverEmpty,
    ctx: unknown,
  ): ctx is CngxPopoverStateCopyContext {
    return true;
  }
}

/**
 * Template shown when panel content failed to load. Context:
 * `CngxPopoverErrorContext` (`$implicit` / `error` = the raw error, `text` =
 * resolved error copy).
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel, CngxPopoverLoading, CngxPopoverEmpty
 */
@Directive({ selector: 'ng-template[cngxPopoverError]', standalone: true })
export class CngxPopoverError {
  readonly templateRef = inject<TemplateRef<CngxPopoverErrorContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxPopoverError,
    ctx: unknown,
  ): ctx is CngxPopoverErrorContext {
    return true;
  }
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
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-panel-slots.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverPanel, CngxPopover
 */
@Directive({ selector: 'ng-template[cngxPopoverArrow]', standalone: true })
export class CngxPopoverArrow {
  readonly templateRef = inject<TemplateRef<CngxPopoverArrowContext>>(TemplateRef);
}
