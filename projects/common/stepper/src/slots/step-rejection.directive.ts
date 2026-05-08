import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxStepNode } from '../stepper-host.token';

/**
 * Context passed to the `*cngxStepRejection` template. Drives the
 * rejection-decoration rendered on the strip step that the most
 * recent commit was rolled back FROM — sibling to the tabs
 * `cngxTabRejectionIcon` slot (Phase 4). Consumers swap the
 * built-in `'!'` glyph for a branded rollback indicator, a richer
 * tooltip target, or a custom phrase while the visibility gate
 * stays library-owned (the slot only renders when the step's
 * flat-index matches `presenter.lastFailedIndex()`).
 *
 * `originLabel` is the safe-harbour step the user was returned to
 * — derived by the organism from `presenter.originIndexDuringCommit()`
 * via the step-only flat projection. May be `undefined` when the
 * origin index is out of range (synchronous-rejection edge case
 * already handled in `liveAnnouncement`); consumers gate richer UI
 * on its presence.
 *
 * @category interactive
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
 * Structural slot directive marking the rejection-decoration
 * template for `<cngx-stepper>`. Discovered via `contentChild` on
 * the organism; cascades through
 * `CNGX_STEPPER_CONFIG.templates.rejection` before falling back to
 * the built-in `CNGX_STEPPER_GLYPHS.rejectionIcon` span.
 *
 * Closes the rejection-decoration parity gap with tabs's
 * `<span class="cngx-tabs__rejection-icon">` (see
 * `projects/ui/tabs/src/tab-group.component.html:35-37`). The
 * tabs sibling will land its own `cngxTabRejectionIcon` slot in
 * Phase 4 of `tabs-stepper-cleanup-plan`; this directive carries
 * the symmetric context shape so consumer-authored templates
 * port directly.
 *
 * Pure marker — zero logic. Holds only a typed
 * {@link TemplateRef} reference.
 *
 * @example
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
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxStepRejection]',
  exportAs: 'cngxStepRejection',
  standalone: true,
})
export class CngxStepRejection {
  readonly templateRef = inject<TemplateRef<CngxStepRejectionContext>>(
    TemplateRef,
  );
}
