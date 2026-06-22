import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { CngxListbox, CngxListboxTrigger, CngxOption } from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_GLYPHS } from '../paginator-glyphs';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';

/**
 * Page-of-pages segment. A `CngxListbox` dropdown of `1..totalPages`; picking
 * page `n` routes through `host.setPage(n - 1)`. The option list is derived
 * from `host.totalPages()` and the selected entry from `host.pageIndex()`, so
 * both track the brain with zero local state (Pillar 1). Like the page-size
 * segment it avoids native `<select>` and the forms family, keeping the entry
 * `@cngx/forms`-free.
 *
 * @category ui/paginator
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-segments/go-to-page</example-url>
 */
@Component({
  selector: 'cngx-pgn-page-of-pages',
  exportAs: 'cngxPgnPageOfPages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxListbox, CngxListboxTrigger, CngxOption, CngxPopover, CngxPopoverTrigger],
  template: `
    <button
      type="button"
      class="cngx-paginator__button cngx-paginator__select"
      [cngxListboxTrigger]="lb"
      [cngxPopoverTrigger]="pop"
      [haspopup]="'listbox'"
      [popover]="pop"
      [attr.aria-label]="config.ariaLabels.pageOfPages"
      [disabled]="host.isBusy()"
      (click)="pop.toggle()"
    >
      <span class="cngx-paginator__select-label"
        ><b>{{ host.pageIndex() + 1 }}</b> / {{ host.totalPages() }}</span
      >
      <span class="cngx-paginator__select-caret" aria-hidden="true">{{ glyphs.caret }}</span>
    </button>
    <div cngxPopover #pop="cngxPopover">
      <ul
        cngxListbox
        class="cngx-paginator__overflow-panel"
        tabindex="0"
        [label]="config.ariaLabels.pageOfPages"
        [value]="host.pageIndex() + 1"
        (valueChange)="onSelect($event)"
        #lb="cngxListbox"
      >
        @for (page of pages(); track page) {
          <li cngxOption class="cngx-paginator__option" [value]="page">{{ page }}</li>
        }
      </ul>
    </div>
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorPageOfPages {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  protected readonly config = injectPaginatorConfig();
  protected readonly glyphs = CNGX_PAGINATOR_GLYPHS;

  /**
   * The 1-based page numbers `1..totalPages`. Length-keyed `equal` keeps the
   * reference stable while the count is unchanged - the contents are fully
   * determined by the length, so the `@for` never churns (signal-equality rule).
   */
  protected readonly pages = computed<number[]>(
    () => Array.from({ length: this.host.totalPages() }, (_, i) => i + 1),
    { equal: (a, b) => a.length === b.length },
  );

  protected onSelect(value: number | undefined): void {
    if (typeof value === 'number') {
      this.host.setPage(value - 1);
    }
  }
}
