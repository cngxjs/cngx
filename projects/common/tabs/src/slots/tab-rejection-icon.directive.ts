import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Context passed to the `*cngxTabRejectionIcon` template. Drives the
 * rejection-decoration rendered on the tab that the most recent
 * commit was rolled back FROM — sibling to the stepper
 * `*cngxStepRejection` slot (Phase 3). Consumers swap the built-in
 * `'!'` glyph for a branded rollback indicator, a richer tooltip
 * target, or a custom phrase while the visibility gate stays
 * library-owned (the slot only renders when the tab's index matches
 * `presenter.lastFailedIndex()`).
 *
 * `originLabel` is the safe-harbour tab the user was returned to —
 * derived by the organism from `presenter.originIndexDuringCommit()`.
 * May be `undefined` when the origin index is out of range
 * (synchronous-rejection edge case already handled in
 * `liveAnnouncement`); consumers gate richer UI on its presence.
 *
 * Mirrors the family-standard `CngxStepRejectionContext` shape so
 * consumer-authored templates port across families.
 *
 * @category interactive
 */
export interface CngxTabRejectionIconContext {
  /** Flat-index of the rejected tab (`presenter.lastFailedIndex()`). */
  readonly failedIndex: number;
  /** Resolved label of the safe-harbour tab, when derivable. */
  readonly originLabel: string | undefined;
}

/**
 * Structural slot directive marking the rejection-decoration
 * template for `<cngx-tab-group>`. Discovered via `contentChild` on
 * the organism; cascades through
 * `CNGX_TABS_CONFIG.templates.rejectionIcon` before falling back to
 * the built-in `CNGX_TABS_GLYPHS.rejectionIcon` span.
 *
 * Closes the rejection-decoration parity gap with the stepper
 * sibling — every visible region in the strip now exposes a
 * `*cngxFooBar` override path (Phase 4 of `tabs-stepper-cleanup-plan`).
 *
 * Pure marker — zero logic. Holds only a typed
 * {@link TemplateRef} reference.
 *
 * @example
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
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxTabRejectionIcon]',
  exportAs: 'cngxTabRejectionIcon',
  standalone: true,
})
export class CngxTabRejectionIcon {
  readonly templateRef = inject<TemplateRef<CngxTabRejectionIconContext>>(
    TemplateRef,
  );
}
