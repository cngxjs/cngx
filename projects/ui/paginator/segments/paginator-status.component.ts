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
 * Page-status readout: renders "Page n of m" for the current page. Pure
 * derivation from the host `pageIndex()`/`totalPages()` signals - no local
 * state, no writes. It is the visible counterpart of the
 * `announcements.pageChange` live-region phrasing, and the collapse target the
 * responsive number row swaps to once the paginator's container narrows. Text
 * comes from the config `pageStatus` formatter, so it localises with the rest of
 * the cascade; tabular figures keep the numerals from reflowing as the page
 * changes.
 *
 * @category ui/paginator
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-behaviors/responsive-collapse</example-url>
 */
@Component({
  selector: 'cngx-pgn-status',
  exportAs: 'cngxPgnStatus',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `<span class="cngx-paginator__status">{{ text() }}</span>`,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorStatus {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  private readonly config = injectPaginatorConfig();

  /** Formatted "Page n of m" readout from the config formatter (1-based page). */
  protected readonly text = computed<string>(() =>
    this.config.formats.pageStatus(this.host.pageIndex() + 1, this.host.totalPages()),
  );
}
