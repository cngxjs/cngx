import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode } from '../stepper-host.token';

/**
 * Context passed to the `*cngxDotStepperDot` template. Drives the dot
 * body inside `<cngx-dot-stepper>`. The `<span class="cngx-dot-stepper__dot">`
 * shell - `role="img"`, `aria-current`, `aria-label`, class
 * modifiers - stays library-owned; only the dot body content becomes
 * overrideable so consumers can swap the default empty body for an
 * icon, glyph, or branded indicator.
 *
 * Smaller than {@link CngxStepIndicatorContext} on purpose - the dot
 * stepper does not surface step status/busy state visually, so the
 * context strips to the four fields a consumer actually needs.
 *
 * @category common/stepper/slots
 */
export interface CngxDotStepperDotContext {
  /** Convenience alias for `index` - usable as `let-index` shorthand. */
  readonly $implicit: number;
  /** 0-based position of this dot in the step-only projection. */
  readonly index: number;
  /** The step node carrying id / label / state signals. */
  readonly node: CngxStepNode;
  /** `true` when this dot represents the current active step. */
  readonly active: boolean;
  /** `true` when this dot represents a completed (already-traversed) step. */
  readonly completed: boolean;
}

/**
 * Slot directive for the dot-body template on `<cngx-dot-stepper>`.
 * Discovered via `contentChild`; cascades through
 * `CNGX_STEPPER_CONFIG.templates.dotStepperDot` before falling back to
 * the built-in empty body (the span itself paints the dot fill via CSS).
 *
 * ```html
 * <cngx-dot-stepper [(activeStepIndex)]="active" aria-label="Carousel">
 *   <ng-template cngxDotStepperDot let-index let-active="active" let-completed="completed">
 *     @if (active) {
 *       <svg viewBox="0 0 10 10" aria-hidden="true"><circle cx="5" cy="5" r="3" fill="currentColor" /></svg>
 *     } @else if (completed) {
 *       <svg viewBox="0 0 10 10" aria-hidden="true"><path d="M2 5l2 2 4-4" stroke="currentColor" fill="none" /></svg>
 *     }
 *   </ng-template>
 *   <div cngxStep label="Slide 1"></div>
 *   <div cngxStep label="Slide 2"></div>
 * </cngx-dot-stepper>
 * ```
 *
 * @category common/stepper/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/stepper/slots/dot-stepper-dot.directive.ts
 * @since 0.1.0
 * @relatedTo CngxStepIndicator, CngxStepBadge, CngxStepBusySpinner, CngxStepRejection
 * <example-url>http://localhost:4200/#/ui/stepper/dot-stepper/icon-dots-via-code-cngxdotstepperdot-code</example-url>
 * <example-url>http://localhost:4200/#/ui/stepper/dot-stepper/mobile-carousel</example-url>
 */
@Directive({
  selector: 'ng-template[cngxDotStepperDot]',
  exportAs: 'cngxDotStepperDot',
  standalone: true,
})
export class CngxDotStepperDot {
  readonly templateRef = inject<TemplateRef<CngxDotStepperDotContext>>(TemplateRef);
}
