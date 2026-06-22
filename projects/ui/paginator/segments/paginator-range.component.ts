import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/**
 * Range-readout segment: renders `start-end of total` for the current page.
 * Pure derivation from the host `range()`/`total()` signals - no local state,
 * no writes. The text (including the `of` connector) comes from the
 * config range formatter, so it localises with the rest of the cascade. Tabular
 * figures keep the numerals from reflowing as the page changes.
 *
 * @category ui/paginator
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-behaviors/reset-on-filter</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-behaviors/url-synced-paging</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/paginated-list</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/select-panel-footer</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-segments/page-size-and-range</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/bar</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/minimal</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/numbered</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/rail</example-url>
 */
@Component({
  selector: 'cngx-pgn-range',
  exportAs: 'cngxPgnRange',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<span class="cngx-paginator__range">{{ text() }}</span>`,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorRange {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  private readonly config = injectPaginatorConfig();

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

  /** Formatted readout from the config range formatter (EN default `start-end of total`). */
  protected readonly text = computed<string>(() =>
    this.config.formats.range(this.start(), this.end(), this.host.total()),
  );
}
