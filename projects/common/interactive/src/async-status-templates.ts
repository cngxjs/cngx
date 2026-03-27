import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Template shown while an async action is executing.
 *
 * Used by `CngxActionButton` and `CngxPopoverAction` to project
 * custom pending-state content.
 *
 * @usageNotes
 * ```html
 * <ng-template cngxPending>Saving...</ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[cngxPending]', standalone: true })
export class CngxPending {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Template shown after an async action succeeds (for `feedbackDuration` ms).
 *
 * @usageNotes
 * ```html
 * <ng-template cngxSucceeded>Saved!</ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[cngxSucceeded]', standalone: true })
export class CngxSucceeded {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Template shown after an async action fails (for `feedbackDuration` ms).
 * The implicit template context provides the error value.
 *
 * @usageNotes
 * ```html
 * <ng-template cngxFailed let-err>Failed: {{ err }}</ng-template>
 * ```
 */
@Directive({ selector: 'ng-template[cngxFailed]', standalone: true })
export class CngxFailed {
  readonly templateRef = inject(TemplateRef);
}
