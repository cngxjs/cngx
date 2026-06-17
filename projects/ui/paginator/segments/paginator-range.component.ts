import { ChangeDetectionStrategy, Component, computed, inject, ViewEncapsulation } from '@angular/core';

import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/**
 * Range-readout segment: renders `start-end of total` for the current page.
 * Pure derivation from the host `range()`/`total()` signals - no local state,
 * no writes (Pillar 1). Tabular figures keep the numerals from reflowing as
 * the page changes.
 *
 * @category ui/paginator
 */
@Component({
  selector: 'cngx-pgn-range',
  exportAs: 'cngxPgnRange',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<span class="cngx-paginator__range"
    >{{ start() }}-{{ end() }} of {{ host.total() }}</span
  >`,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorRange {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);

  /** 1-based index of the first item on the current page (0 when empty). */
  protected readonly start = computed<number>(() =>
    this.host.total() === 0 ? 0 : this.host.range()[0] + 1,
  );

  /**
   * 1-based index of the last item on the current page. The brain's `range()`
   * upper bound is uncapped (`start + pageSize`), so a partial final page is
   * clamped to `total` here for an honest readout.
   */
  protected readonly end = computed<number>(() =>
    Math.min(this.host.range()[1], this.host.total()),
  );
}
