import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepError` template. Renders the
 * validation-error reason for a step in the error state - sibling of
 * the commit-channel `*cngxStepRejection` slot. The two channels stay
 * distinct: rejection decorates the step a commit rolled back FROM;
 * this slot surfaces the per-step validation message.
 *
 * `message` resolves the direct `[error]` string > the first
 * aggregator label > the i18n `errored` status phrase, so a template
 * that renders `{{ message }}` always shows a non-empty reason.
 * `errorLabels` / `announcement` expose the richer aggregator surface
 * for consumers that want a list or the full SR phrase.
 *
 * @category common/stepper/slots
 */
export interface CngxStepErrorContext {
  /** The errored step node carrying id / label / state signals. */
  readonly node: CngxStepNode;
  /** Resolved error reason (direct `[error]` string > aggregator label > i18n). */
  readonly message: string;
  /** Aggregator error labels, or an empty array when none. */
  readonly errorLabels: readonly string[];
  /** Aggregator SR announcement phrase, or an empty string when none. */
  readonly announcement: string;
}

/**
 * Slot directive for the per-step error-message template on
 * `<cngx-stepper>`. Discovered via `contentChild`; cascades through
 * `CNGX_STEPPER_CONFIG.templates.stepError` before falling back to the
 * built-in `{{ message }}` text. Mirrors {@link CngxStepRejection} so
 * consumer-authored templates read the same way across both channels.
 *
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepError let-message="message" let-errorLabels="errorLabels">
 *     <strong>{{ message }}</strong>
 *     @if (errorLabels.length > 1) {
 *       <ul>
 *         @for (label of errorLabels; track label) {
 *           <li>{{ label }}</li>
 *         }
 *       </ul>
 *     }
 *   </ng-template>
 * </cngx-stepper>
 * ```
 *
 * @category common/stepper/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/slots/step-error.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepRejection, CngxStepBadge, CngxStep
 */
@Directive({
  selector: 'ng-template[cngxStepError]',
  exportAs: 'cngxStepError',
  standalone: true,
})
export class CngxStepError {
  readonly templateRef = inject<TemplateRef<CngxStepErrorContext>>(TemplateRef);
}
