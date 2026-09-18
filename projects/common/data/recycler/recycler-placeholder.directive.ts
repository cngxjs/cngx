import { DOCUMENT } from '@angular/common';
import { computed, DestroyRef, Directive, inject, input, type Signal } from '@angular/core';
import { createMediaQuerySignal } from '@cngx/core/utils';

import type { CngxRecycler } from './recycler';

/**
 * Paints a row-aligned skeleton background under a virtualized scroll region so
 * a fast fling or teleport jump reveals placeholder bars instead of the bare
 * panel/page surface for the single frame the rendered rows lag `scrollTop`.
 *
 * The mechanism is a static CSS layer, not a reactive template: by the time a
 * `@for` over "uncovered indices" could render, change detection has already
 * produced the real rows, so the lag frame is never painted reactively. A
 * `background` on the offset element always paints and also covers teleport
 * jumps no reactive window can, at zero per-frame cost.
 *
 * Host it on the **offset spacer element(s)** - the empty divs (or presentation
 * `<li>`s) whose height reserves `offsetBefore` / `offsetAfter` - one directive
 * instance per spacer. Do NOT host it on a `padding-block`ed content element
 * that also contains the rows: a background paints across the whole padding box,
 * so it would show through *behind* every rendered row, not just in the gap.
 * The spacers carry no rows, so the layer is only ever visible where the window
 * has not caught up.
 *
 * The repeat interval keys off a single representative row height: bind the
 * recycler to read its `rowSizeHint`, or pass an explicit `[rowHeight]`
 * fallback so the directive is usable standalone. Visuals are driven by
 * `--cngx-recycler-placeholder-*` CSS custom properties (see
 * `@cngx/common/theming/components/cngx-recycler-placeholder.css`); the shimmer
 * drops under `prefers-reduced-motion` via a spec-observable host class.
 *
 * ### One instance per offset spacer, keyed off the recycler's rhythm
 * ```html
 * <ul>
 *   @if (recycler.offsetBefore(); as before) {
 *     <li role="presentation" aria-hidden="true"
 *         [cngxRecyclerPlaceholder]="recycler" [style.height.px]="before"></li>
 *   }
 *   @for (item of visibleItems(); track item.id) { <li>...</li> }
 *   @if (recycler.offsetAfter(); as after) {
 *     <li role="presentation" aria-hidden="true"
 *         [cngxRecyclerPlaceholder]="recycler" [style.height.px]="after"></li>
 *   }
 * </ul>
 * ```
 *
 * ### Standalone with an explicit row height
 * ```html
 * <div cngxRecyclerPlaceholder [rowHeight]="48"
 *      [style.height.px]="recycler.offsetBefore()"></div>
 * ```
 *
 * @category common/data/recycler
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/recycler/recycler-placeholder.directive.ts
 * @since 0.1.0
 * @relatedTo injectRecycler, CngxVirtualItem, CngxMeasure
 * <example-url>http://localhost:4200/#/common/data/recycler/fast-fling-placeholders</example-url>
 */
@Directive({
  selector: '[cngxRecyclerPlaceholder]',
  standalone: true,
  host: {
    class: 'cngx-recycler-placeholder',
    // The layer is a decorative background on an offset spacer. Hide it from the
    // a11y tree at the host so it stays out regardless of the call site, not only
    // when a consumer remembers to add aria-hidden.
    'aria-hidden': 'true',
    '[class.cngx-recycler-placeholder--shimmer]': 'showShimmer()',
    '[style.--cngx-recycler-placeholder-row-height]': 'rowHeightVar()',
  },
})
export class CngxRecyclerPlaceholder {
  /**
   * The recycler whose `rowSizeHint` sets the placeholder repeat rhythm.
   * Optional: the directive also works from an explicit `[rowHeight]`, so this
   * follows the bridge-input shape (optional + empty-string transform) rather
   * than `input.required` - a bare `cngxRecyclerPlaceholder` attribute paired
   * with `[rowHeight]` is a valid, unbound usage.
   */
  readonly recycler = input<CngxRecycler | undefined, CngxRecycler | '' | undefined>(undefined, {
    alias: 'cngxRecyclerPlaceholder',
    transform: (value) => (typeof value === 'string' ? undefined : value),
  });

  /** Explicit row height (px) used when no recycler is bound, or as a fallback. */
  readonly rowHeight = input<number | undefined>(undefined);

  private readonly prefersReducedMotion: Signal<boolean>;

  constructor() {
    this.prefersReducedMotion = createMediaQuerySignal(
      '(prefers-reduced-motion: reduce)',
      inject(DestroyRef),
      inject(DOCUMENT).defaultView,
    );
  }

  /**
   * Representative row height (px) for the repeat interval. The recycler's
   * `rowSizeHint` wins when it resolves to a positive value; otherwise the
   * explicit `[rowHeight]` fallback applies.
   */
  protected readonly resolvedRowHeight = computed(() => {
    const fromRecycler = this.recycler()?.rowSizeHint() ?? 0;
    if (fromRecycler > 0) {
      return fromRecycler;
    }
    return this.rowHeight() ?? 0;
  });

  /**
   * The `--cngx-recycler-placeholder-row-height` style value. `null` when no
   * row height resolves, so the registered `@property` default (or an inherited
   * token from an ancestor mapping) applies instead of a broken `0px` interval.
   */
  protected readonly rowHeightVar = computed(() => {
    const height = this.resolvedRowHeight();
    return height > 0 ? `${height}px` : null;
  });

  /** Whether the shimmer host class is applied (dropped under reduced-motion). */
  protected readonly showShimmer = computed(() => !this.prefersReducedMotion());
}
