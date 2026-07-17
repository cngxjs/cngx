import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { CngxMeasure, CngxVirtualItem, injectRecycler } from '@cngx/common/data';

import type { CngxIncrementalItemContext } from './incremental-list-slots';

/**
 * Virtualized content body for `CngxIncrementalList`. Instantiated only under
 * the organism's `@if (virtualize())`, so the recycler (scroll observer, four
 * effects, and focus listeners installed unconditionally at construction) never
 * runs for a render-all list - the opt-in cost is real, not nominal.
 *
 * A private composition unit in the shape of the `CngxSelectPanel` /
 * `CngxSelectPanelShell` split: it owns `injectRecycler`, the equal'd window,
 * and renders the windowed rows with the existing `CngxVirtualItem` /
 * `CngxMeasure` atoms. The host element IS the scroll viewport - the
 * `.cngx-incremental-list__viewport` overflow + bounded-height rule and the
 * recycler's `scrollElement` resolve to this one node.
 *
 * @internal Not exported from `@cngx/ui/collection` public API.
 */
@Component({
  selector: 'cngx-incremental-virtualized-body',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, CngxVirtualItem, CngxMeasure],
  templateUrl: './incremental-list-virtualized-body.component.html',
  host: { class: 'cngx-incremental-list__viewport' },
})
export class CngxIncrementalVirtualizedBody<T = unknown> {
  /**
   * The full accumulated slice to virtualize. Defaults to `[]` (not
   * `required`) because `injectRecycler` reads `totalCount()` at construction to
   * seed its announcement bookkeeping - a required input would throw NG0950
   * before the organism binds. The organism always binds it.
   */
  readonly items = input<readonly T[]>([]);

  /** Initial per-row height estimate (px); forwarded to the recycler. */
  readonly estimateSize = input<number>(48);

  /**
   * Item slot template resolved by the organism, or `null` for the built-in
   * text row. Rendered per windowed row with the same context the render-all
   * path uses, but keyed on the absolute index.
   */
  readonly itemTemplate = input<TemplateRef<CngxIncrementalItemContext<T>> | null>(null);

  /** `@for` track fn from the organism - keyed on the absolute row index. */
  readonly trackItem = input.required<(index: number, item: T) => unknown>();

  private readonly host = inject(ElementRef<HTMLElement>);

  /**
   * The recycler. Constructed here, never in the organism, so its scroll
   * observer + effects install only when virtualized. `estimateSize` is passed
   * as the signal reference so it reads reactively after binding rather than the
   * construction-time default; `state` is intentionally not forwarded - the
   * recycler reads `config.state` once at construction when the input is still
   * unbound, and its no-state branch already announces load-count from
   * `totalCount` growth, which is the append-feed semantics the announcer wants.
   */
  protected readonly recycler = injectRecycler({
    scrollElement: this.host.nativeElement as HTMLElement,
    totalCount: () => this.items().length,
    estimateSize: this.estimateSize,
  });

  /**
   * The visible window, sliced to `[recycler.start(), recycler.end())` with an
   * explicit structural `equal` (mirrors the select family's recycler panel
   * renderer): length + per-entry `Object.is`, so a window that does not move
   * keeps its reference and the row `@for` does not thrash. Returns the source
   * verbatim when the window covers the whole list, so upstream identity stays
   * stable for small opt-in lists.
   */
  protected readonly windowItems = computed<readonly T[]>(
    () => {
      const all = this.items();
      const start = this.recycler.start();
      const end = this.recycler.end();
      if (start === 0 && end >= all.length) {
        return all;
      }
      return all.slice(start, Math.min(end, all.length));
    },
    {
      equal: (a, b) => {
        if (a === b) {
          return true;
        }
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (!Object.is(a[i], b[i])) {
            return false;
          }
        }
        return true;
      },
    },
  );
}
