import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepRejection` template. Renders on the
 * strip step the most recent commit was rolled back FROM - sibling of
 * the tabs `cngxTabRejectionIcon` slot. Renders only when
 * `presenter.lastFailedIndex()` matches the step's flat-index.
 *
 * `originLabel` is the safe-harbour step's label, derived from
 * `presenter.originIndexDuringCommit()`. May be `undefined` when the
 * origin index is out of range (synchronous-rejection edge case);
 * gate richer UI on its presence.
 *
 * @category common/stepper/slots
 */
export interface CngxStepRejectionContext {
  /** Flat-index of the rejected step (`presenter.lastFailedIndex()`). */
  readonly failedIndex: number;
  /** Resolved label of the safe-harbour step, when derivable. */
  readonly originLabel: string | undefined;
  /** The rejected step node carrying id / label / state signals. */
  readonly node: CngxStepNode;
}

/**
 * Slot directive for the rejection-decoration template on
 * `<cngx-stepper>`. Discovered via `contentChild`; cascades through
 * `CNGX_STEPPER_CONFIG.templates.rejection` before falling back to
 * `CNGX_STEPPER_GLYPHS.rejectionIcon`.
 *
 * Symmetric context shape with the upcoming tabs `cngxTabRejectionIcon`
 * slot so consumer templates port directly between the two families.
 *
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepRejection let-failedIndex="failedIndex" let-originLabel="originLabel">
 *     <my-icon name="rollback" />
 *     @if (originLabel) {
 *       <span class="cngx-sr-only">Rolled back to {{ originLabel }}</span>
 *     }
 *   </ng-template>
 * </cngx-stepper>
 * ```
 *
 * @category common/stepper/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/slots/step-rejection.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepBadge, CngxStepIndicator, CngxStepBusySpinner
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/rejection-decoration-via-code-cngxsteprejection-code</example-url>
 */
@Directive({
  selector: 'ng-template[cngxStepRejection]',
  exportAs: 'cngxStepRejection',
  standalone: true,
})
export class CngxStepRejection {
  readonly templateRef = inject<TemplateRef<CngxStepRejectionContext>>(TemplateRef);
}
