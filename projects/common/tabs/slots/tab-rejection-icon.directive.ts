import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Context for the `*cngxTabRejectionIcon` template. Renders only on
 * the tab matching `presenter.lastFailedIndex()`; the visibility
 * gate stays library-owned. `originLabel` is the safe-harbour tab,
 * derived from `presenter.originIndexDuringCommit()` - `undefined`
 * for the synchronous-rejection edge case. Sibling shape to
 * `CngxStepRejectionContext`.
 *
 * @category common/tabs/slots
 */
export interface CngxTabRejectionIconContext {
  /** Flat-index of the rejected tab (`presenter.lastFailedIndex()`). */
  readonly failedIndex: number;
  /** Resolved label of the safe-harbour tab, when derivable. */
  readonly originLabel: string | undefined;
}

/**
 * Structural slot for the rejection-decoration template. 3-stage
 * cascade: per-instance directive >
 * `CNGX_TABS_CONFIG.templates.rejectionIcon` >
 * `CNGX_TABS_GLYPHS.rejectionIcon`.
 *
 * ```html
 * <cngx-tab-group>
 *   <ng-template
 *     cngxTabRejectionIcon
 *     let-failedIndex="failedIndex"
 *     let-originLabel="originLabel"
 *   >
 *     <my-icon name="rollback" />
 *     @if (originLabel) {
 *       <span class="cngx-sr-only">Rolled back to {{ originLabel }}</span>
 *     }
 *   </ng-template>
 * </cngx-tab-group>
 * ```
 *
 * @category common/tabs/slots
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/slots/tab-rejection-icon.directive.ts
 * @since 0.1.0
 * @relatedTo CngxTabErrorBadge, CngxTabBusySpinner, CngxTab
 * <example-url>http://localhost:4200/#/ui/tabs/tab-slot-overrides/rejection-decoration-via-code-cngxtabrejectionicon-code</example-url>
 */
@Directive({
  selector: 'ng-template[cngxTabRejectionIcon]',
  exportAs: 'cngxTabRejectionIcon',
  standalone: true,
})
export class CngxTabRejectionIcon {
  readonly templateRef = inject<TemplateRef<CngxTabRejectionIconContext>>(TemplateRef);
}
