import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Context passed to the `*cngxMatTabRejectionContent` template. Drives
 * the SR-descriptor content rendered inside the
 * `<span class="cngx-sr-only">` decoration that `[cngxMatTabs]`
 * appends to a Material tab button when its bound `commitAction`
 * rejects a tab change. The surrounding span (with its
 * `cngx-sr-only` class, its stable id, and the `aria-describedby`
 * wiring on the button) stays library-owned — the slot only
 * customises the descriptor text or markup so consumers can swap
 * the rejection phrasing (branded prefixes, retry CTAs, localised
 * templates) without fighting the AT contract.
 *
 * `failedHandleId` is the stable id of the rejected handle (the
 * same id the descriptor span uses as its `${id}-rejected` DOM id);
 * `originLabel` is the label the rollback returned to (when the
 * presenter exposes an `originIndexDuringCommit` and that index
 * resolves to a handle with a non-empty label) — `undefined` when
 * no labelled rollback origin is resolvable; `fallbackText` is the
 * built-in i18n phrase the imperative fallback path would write
 * verbatim (typically `commitRolledBackTo(originLabel)` when the
 * origin is resolvable, `commitFailedRetry` otherwise).
 *
 * **Re-instantiation warning.** The decoration projector destroys
 * the embedded view and creates a fresh one on every `descriptorText`
 * re-emission — typical when the rollback origin label resolves
 * later than the failed-handle id (e.g. `presenter.tabs()` re-emits
 * mid-rejection and the origin label flows in on the second tick).
 * The slot template runs to the end of its lifecycle each time;
 * consumers wiring expensive subtrees (e.g. an embedded chart, a
 * complex form) should treat this as a destroy + remount cycle and
 * lift heavy state into a sibling `*ngTemplateOutlet`-friendly
 * structure outside the slot. Cheap text + simple markup (the
 * intended use) sees no observable difference.
 */
export interface CngxMatTabRejectionContentContext {
  /** Stable id of the rejected `CngxTabHandle`. */
  readonly failedHandleId: string;
  /**
   * Label of the rollback origin (only set when the presenter's
   * `originIndexDuringCommit` resolves to a handle with a non-empty
   * label).
   */
  readonly originLabel: string | undefined;
  /**
   * Library-default i18n phrase the imperative fallback path would
   * write verbatim. Use this if the consumer template wants to
   * render the canonical phrase as a base alongside its own
   * decoration (icon, branded prefix, retry CTA).
   */
  readonly fallbackText: string;
}

/**
 * Structural slot directive marking the rejection-descriptor
 * template for `[cngxMatTabs]`. Discovered via `contentChild` on the
 * directive; when bound, the projector renders an embedded view of
 * this template into the SR-only descriptor span instead of writing
 * the resolved fallback string verbatim.
 *
 * Pure marker — zero logic. Holds only a typed
 * {@link TemplateRef} reference. Mirrors the family-standard slot
 * pattern (`CngxMatTabAggregatorContent`, `CngxStepBadge`,
 * `CngxTabErrorBadge`).
 *
 * Cascade resolution (per
 * `architecture-summary.md` slot-cascade rule):
 *   1. Per-instance `*cngxMatTabRejectionContent` template wins
 *      via `contentChild(CngxMatTabRejectionContent)`.
 *   2. When Phase 2's `CNGX_MAT_TABS_CONFIG` infrastructure
 *      lands on main, the config-tier
 *      `CNGX_MAT_TABS_CONFIG.templates.rejection` slot fills the
 *      middle tier (planned follow-up — gated by Phase 2 merge;
 *      `tabs-accepted-debt §12` binds the staging with
 *      Re-Eval Triggers).
 *   3. Library default — imperative `Renderer2.createElement('span')`
 *      with `textContent = fallbackText` (the resolved
 *      `commitRolledBackTo(originLabel)` / `commitFailedRetry`
 *      phrase from `injectTabsI18n()`).
 *
 * @example
 * ```html
 * <mat-tab-group cngxMatTabs [commitAction]="save">
 *   <ng-template
 *     cngxMatTabRejectionContent
 *     let-failedHandleId="failedHandleId"
 *     let-originLabel="originLabel"
 *     let-fallbackText="fallbackText"
 *   >
 *     <span class="brand-icon" aria-hidden="true"></span>
 *     {{ fallbackText }}
 *     @if (originLabel) {
 *       <button (click)="retry(failedHandleId)">Retry</button>
 *     }
 *   </ng-template>
 *   <mat-tab label="Profile">…</mat-tab>
 * </mat-tab-group>
 * ```
 */
@Directive({
  selector: 'ng-template[cngxMatTabRejectionContent]',
  exportAs: 'cngxMatTabRejectionContent',
  standalone: true,
})
export class CngxMatTabRejectionContent {
  readonly templateRef =
    inject<TemplateRef<CngxMatTabRejectionContentContext>>(TemplateRef);
}
