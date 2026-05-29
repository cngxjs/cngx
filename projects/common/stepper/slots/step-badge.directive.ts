import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepBadge` template. Drives the error
 * badge inside a step button when `errorAggregator?.shouldShow()` is
 * truthy. Consumers swap the built-in `'!'` glyph for a counter pill
 * or branded marker; the visibility gate stays library-owned.
 *
 * @category common/stepper/slots
 */
export interface CngxStepBadgeContext {
  /** Aggregated error count for this step (≥ 1 when shown). */
  readonly count: number;
  /** The step node carrying id / label / state signals. */
  readonly node: CngxStepNode;
}

/**
 * Slot directive for the error-badge template on `<cngx-stepper>`.
 * Discovered via `contentChild`; cascades through
 * `CNGX_STEPPER_CONFIG.templates.badge` before falling back to
 * `CNGX_STEPPER_GLYPHS.errorBadge`.
 *
 * ```html
 * <cngx-stepper>
 *   <ng-template cngxStepBadge let-count="count">
 *     <span class="my-badge-pill">{{ count }}</span>
 *   </ng-template>
 * </cngx-stepper>
 * ```
 *
 * @category common/stepper/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/slots/step-badge.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepIndicator, CngxStepBusySpinner, CngxStepRejection
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-busy-spinner-via-code-cngxstepbusyspinner-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-error-badge-via-code-cngxstepbadge-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-group-header-via-code-cngxstepgroupheader-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/custom-indicator-glyph-via-code-cngxstepindicator-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/empty-state-placeholder-via-code-cngxstepperempty-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-slot-overrides/rejection-decoration-via-code-cngxsteprejection-code</example-url>
 */
@Directive({
  selector: 'ng-template[cngxStepBadge]',
  exportAs: 'cngxStepBadge',
  standalone: true,
})
export class CngxStepBadge {
  readonly templateRef = inject<TemplateRef<CngxStepBadgeContext>>(TemplateRef);
}
