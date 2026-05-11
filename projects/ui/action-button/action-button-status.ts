import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Template shown while the async action is executing.
 *
 * @example
 * ```html
 * <cngx-action-button [action]="save">
 *   Save
 *   <ng-template cngxPending><mat-spinner diameter="18" /> Saving...</ng-template>
 * </cngx-action-button>
 * ```
 */
@Directive({ selector: 'ng-template[cngxPending]', standalone: true })
export class CngxPending {
  /** @internal Used by `CngxActionButton` to render the pending state. */
  readonly templateRef = inject(TemplateRef);
}

/**
 * Template shown after the async action succeeds (for `feedbackDuration` ms).
 *
 * @example
 * ```html
 * <ng-template cngxSucceeded>Saved!</ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[cngxSucceeded]', standalone: true })
export class CngxSucceeded {
  /** @internal Used by `CngxActionButton` to render the succeeded state. */
  readonly templateRef = inject(TemplateRef);
}

/**
 * Template shown after the async action fails (for `feedbackDuration` ms).
 *
 * @example
 * ```html
 * <ng-template cngxFailed let-err>Failed: {{ err }}</ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[cngxFailed]', standalone: true })
export class CngxFailed {
  /** @internal Used by `CngxActionButton` to render the failed state. */
  readonly templateRef = inject(TemplateRef);
}
