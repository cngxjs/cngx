import { Directive, inject, TemplateRef } from '@angular/core';

/**
 * Context passed to the `*cngxMatTabAggregatorContent` template.
 * Drives the SR-descriptor content rendered inside the
 * `<span class="cngx-sr-only">` decoration that `[cngxMatTabs]`
 * appends to a Material tab button when its bound aggregator wants
 * reveal. The surrounding span (with its `cngx-sr-only` class, its
 * stable id, and the `aria-describedby` wiring on the button)
 * stays library-owned - the slot only customises the descriptor
 * text or markup so consumers can swap the announcement phrasing
 * (counter pills, localised templates, branded prefixes) without
 * fighting the AT contract.
 *
 * `count` mirrors the bound aggregator's `errorCount()` at the
 * moment the decoration was applied; `label` is the human-readable
 * label of the tab (the Material `MatTab.textLabel`);
 * `announcement` is the resolved AT phrase (the same string the
 * imperative `textContent` fallback would write). All three are
 * snapshotted into the decorated entry - re-emissions of the
 * underlying signals re-fire the projector's effect, which
 * re-applies the decoration with the fresh context.
 *
 * @category ui/mat-tabs
 */
export interface CngxMatTabAggregatorContentContext {
  /** Aggregated error count for this tab (≥ 1 when shown). */
  readonly count: number;
  /** Resolved tab label (Material `textLabel`). */
  readonly label: string;
  /**
   * Resolved AT announcement phrase the imperative fallback path
   * would write verbatim - the bound aggregator's `announcement()`
   * value at the moment the decoration was applied. Use this when
   * the consumer template wants to render the canonical phrase
   * alongside its own decoration (counter pill, branded prefix)
   * without re-injecting the aggregator.
   */
  readonly announcement: string;
}

/**
 * Structural slot directive marking the aggregator-descriptor
 * template for `[cngxMatTabs]`. Discovered via `contentChild` on the
 * directive; when bound, the projector renders an embedded view of
 * this template into the SR-only descriptor span instead of writing
 * the aggregator's `announcement()` string verbatim.
 *
 * Pure marker - zero logic. Holds only a typed
 * {@link TemplateRef} reference. Mirrors the family-standard slot
 * pattern (`CngxStepBadge`, `CngxTabErrorBadge`, `CngxTabOverflowItem`).
 *
 * Material owns the tab-button chrome; the cngx descriptor span is
 * the only consumer-visible decoration seam, so this slot directive
 * lands with one in-package consumer (the package-private
 * aggregator-decoration projector).
 *
 * ```html
 * <mat-tab-group cngxMatTabs>
 *   <ng-template
 *     cngxMatTabAggregatorContent
 *     let-count="count"
 *     let-label="label"
 *   >
 *     {{ label }}: {{ count }} validation issue(s)
 *   </ng-template>
 *   <mat-tab label="Profile" cngxMatTabError="profile">…</mat-tab>
 * </mat-tab-group>
 * ```
 *
 * @category ui/mat-tabs
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/mat-tabs/decorations/mat-tab-aggregator-content.directive.ts
 * @since 0.1.0
 * @relatedTo CngxMatTabs, CngxMatTabError, CngxMatTabRejectionContent
 */
@Directive({
  selector: 'ng-template[cngxMatTabAggregatorContent]',
  exportAs: 'cngxMatTabAggregatorContent',
  standalone: true,
})
export class CngxMatTabAggregatorContent {
  readonly templateRef = inject<TemplateRef<CngxMatTabAggregatorContentContext>>(TemplateRef);
}
