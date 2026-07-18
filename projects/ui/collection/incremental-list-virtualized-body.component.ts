import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  type TemplateRef,
  ViewEncapsulation,
} from '@angular/core';

import { CngxMeasure, CngxRecyclerAnnouncer, CngxVirtualItem, injectRecycler } from '@cngx/common/data';

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
  imports: [NgTemplateOutlet, CngxVirtualItem, CngxMeasure, CngxRecyclerAnnouncer],
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

  /**
   * Emitted when the row holding focus recycles out of the window and no
   * rendered row remains to catch it. The organism owns the projected trigger,
   * so the escape-fallback target is the organism's, not this component's - it
   * hands focus back rather than reaching outside its own host.
   */
  readonly focusEscaped = output<void>();

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

  constructor() {
    // Focus continuity under recycling: when the row that held focus scrolls out
    // of the window, move focus to the nearest still-rendered row so keyboard
    // focus is never stranded on a detached node (Pillar 2 - a recycled-out
    // focus is a silent failure). afterRenderEffect (not effect) so the restore
    // reads the DOM AFTER the recycled window has painted its new rows - a plain
    // effect races the @for re-render and would target an about-to-be-removed
    // row. Reads `lostFocus` (the recycler owns the focusin/focusout tracking);
    // writes no signal it owns and calls no service, so no `untracked` guard is
    // needed. Landing focus on an in-window row re-enters the recycler's focusin
    // handler, which pulls `focusedIndex` back into `[start, end)` and nulls
    // `lostFocus` - the next run early-returns, so there is no re-fire loop.
    afterRenderEffect(() => {
      const lost = this.recycler.lostFocus();
      if (!lost) {
        return;
      }
      this.restoreFocus(lost.index);
    });
  }

  /**
   * Move focus to the rendered row nearest the recycled-out index, or emit
   * `focusEscaped` when the window has no row to receive it.
   */
  private restoreFocus(lostIndex: number): void {
    const rows = Array.from(
      (this.host.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        '[data-cngx-recycle-index]',
      ),
    );
    if (rows.length === 0) {
      this.focusEscaped.emit();
      return;
    }
    const indexOf = (row: HTMLElement): number =>
      Number(row.getAttribute('data-cngx-recycle-index'));
    const target = rows.reduce((nearest, row) =>
      Math.abs(indexOf(row) - lostIndex) < Math.abs(indexOf(nearest) - lostIndex) ? row : nearest,
    );
    // Content rows are not natively focusable; make the target programmatically
    // focusable without adding it to the tab order.
    target.tabIndex = -1;
    target.focus({ preventScroll: true });
  }
}
