import { Directive, inject, TemplateRef } from '@angular/core';

// ── Content projection markers ──────────────────────────────────

/** Marks the header content inside `cngx-popover-panel`. */
@Directive({ selector: '[cngxPopoverHeader]', standalone: true })
export class CngxPopoverHeader {}

/** Marks the body content inside `cngx-popover-panel`. */
@Directive({ selector: '[cngxPopoverBody]', standalone: true })
export class CngxPopoverBody {}

/** Marks the footer content inside `cngx-popover-panel`. */
@Directive({ selector: '[cngxPopoverFooter]', standalone: true })
export class CngxPopoverFooter {}

/**
 * Custom close button template. Overrides the default close button.
 *
 * @usageNotes
 * ```html
 * <ng-template cngxPopoverClose>
 *   <button mat-icon-button (click)="panel.popover.hide()">
 *     <mat-icon>close</mat-icon>
 *   </button>
 * </ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[cngxPopoverClose]', standalone: true })
export class CngxPopoverClose {
  readonly templateRef = inject(TemplateRef);
}

// ── Content state templates ─────────────────────────────────────

/** Template shown while panel content is loading. */
@Directive({ selector: 'ng-template[cngxPopoverLoading]', standalone: true })
export class CngxPopoverLoading {
  readonly templateRef = inject(TemplateRef);
}

/** Template shown when panel content is empty. */
@Directive({ selector: 'ng-template[cngxPopoverEmpty]', standalone: true })
export class CngxPopoverEmpty {
  readonly templateRef = inject(TemplateRef);
}

/** Template shown when panel content failed to load. Context: `$implicit` = error. */
@Directive({ selector: 'ng-template[cngxPopoverError]', standalone: true })
export class CngxPopoverError {
  readonly templateRef = inject(TemplateRef);
}
