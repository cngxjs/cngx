import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Template shown while an async action is executing.
 *
 * Used by `CngxActionButton` and `CngxPopoverAction` to project
 * custom pending-state content.
 *
 * ```html
 * <ng-template cngxPending>Saving...</ng-template>
 * ```
 * @example-url http://localhost:4200/async-button/random-outcome
 * @example-url http://localhost:4200/async-button/string-labels
 * @example-url http://localhost:4200/async-button/template-slots
 */
@Directive({ selector: 'ng-template[cngxPending]', standalone: true })
export class CngxPending {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Template shown after an async action succeeds (for `feedbackDuration` ms).
 *
 * ```html
 * <ng-template cngxSucceeded>Saved!</ng-template>
 * ```
 * @example-url http://localhost:4200/async-button/random-outcome
 * @example-url http://localhost:4200/async-button/string-labels
 * @example-url http://localhost:4200/async-button/template-slots
 */
@Directive({ selector: 'ng-template[cngxSucceeded]', standalone: true })
export class CngxSucceeded {
  readonly templateRef = inject(TemplateRef);
}

/**
 * Template shown after an async action fails (for `feedbackDuration` ms).
 * The implicit template context provides the error value.
 *
 * ```html
 * <ng-template cngxFailed let-err>Failed: {{ err }}</ng-template>
 * ```
 * @example-url http://localhost:4200/async-button/random-outcome
 * @example-url http://localhost:4200/async-button/string-labels
 * @example-url http://localhost:4200/async-button/template-slots
 */
@Directive({ selector: 'ng-template[cngxFailed]', standalone: true })
export class CngxFailed {
  readonly templateRef = inject(TemplateRef);
}
