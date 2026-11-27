import { Directive, inject, TemplateRef } from '@angular/core';

import { type CngxActionStatusFailedContext } from '../action-status/action-status-config';

/**
 * Template shown while an async action is executing.
 *
 * Used by `CngxActionButton` and `button[cngxPopoverAction]` to project
 * custom pending-state content. Both hosts show it once the run outlasts the
 * busy gate's show delay (`CNGX_LOADING_CONFIG.showDelay`), so a fast run
 * never flashes it.
 *
 * ```html
 * <ng-template cngxPending>Saving...</ng-template>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/async-status-templates.ts
 * @since 0.3.0
 * @relatedTo CngxSucceeded, CngxFailed, CngxAsyncClick
 * <example-url>/#/ui/action-button/async-button/template-slots</example-url>
 * <example-url>/#/common/popover/popover-panel/with-footer-actions</example-url>
 */
@Directive({ selector: 'ng-template[cngxPending]', standalone: true })
export class CngxPending {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * Template shown after an async action succeeds (for `feedbackDuration` ms).
 *
 * ```html
 * <ng-template cngxSucceeded>Saved!</ng-template>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/async-status-templates.ts
 * @since 0.3.0
 * @relatedTo CngxPending, CngxFailed, CngxAsyncClick
 * <example-url>/#/ui/action-button/async-button/template-slots</example-url>
 * <example-url>/#/common/popover/popover-panel/with-footer-actions</example-url>
 */
@Directive({ selector: 'ng-template[cngxSucceeded]', standalone: true })
export class CngxSucceeded {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}

/**
 * Template shown after an async action fails (for `feedbackDuration` ms).
 * The implicit template context provides the error value, typed `unknown`
 * (`CngxActionStatusFailedContext`): narrow it before reading a property.
 *
 * ```html
 * <ng-template cngxFailed let-err>Failed: {{ err }}</ng-template>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/async-status-templates.ts
 * @since 0.3.0
 * @relatedTo CngxPending, CngxSucceeded, CngxAsyncClick
 * <example-url>/#/ui/action-button/async-button/template-slots</example-url>
 * <example-url>/#/common/popover/popover-panel/with-footer-actions</example-url>
 */
@Directive({ selector: 'ng-template[cngxFailed]', standalone: true })
export class CngxFailed {
  readonly templateRef = inject<TemplateRef<CngxActionStatusFailedContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxFailed,
    ctx: unknown,
  ): ctx is CngxActionStatusFailedContext {
    return true;
  }
}
