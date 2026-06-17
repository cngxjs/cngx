import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { CngxRovingItem, CngxRovingTabindex } from '@cngx/common/a11y';
import { CngxMenu, CngxMenuItem, CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopover } from '@cngx/common/popover';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_GLYPHS } from '../paginator-glyphs';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';
import { pageWindow, pageWindowEqual, type PageWindow } from './page-model';

/**
 * The numbered page row. One tab stop via `CngxRovingTabindex` (arrows / Home /
 * End move the active page button); the current page carries `aria-current`.
 * A truncation run collapses into an ellipsis button that opens a `CngxMenu`
 * (reused, no new overflow code) of the hidden pages.
 *
 * @category ui/paginator
 */
@Component({
  selector: 'cngx-pgn-pages',
  exportAs: 'cngxPgnPages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxRovingTabindex, CngxRovingItem, CngxMenu, CngxMenuItem, CngxMenuTrigger, CngxPopover],
  template: `
    <div class="cngx-paginator__pages" cngxRovingTabindex>
      @for (item of model().pages; track $index) {
        @if (item.kind === 'page') {
          <button
            type="button"
            cngxRovingItem
            class="cngx-paginator__button cngx-paginator__page"
            [class.cngx-paginator__page--current]="isCurrent(item.index)"
            [attr.aria-current]="isCurrent(item.index) ? 'page' : null"
            [attr.aria-label]="config.ariaLabels.page(item.index + 1)"
            [attr.aria-disabled]="host.isBusy() ? 'true' : null"
            (click)="goto(item.index)"
          >
            {{ item.index + 1 }}
          </button>
        } @else {
          <button
            type="button"
            cngxRovingItem
            class="cngx-paginator__button cngx-paginator__more"
            [cngxMenuTrigger]="moreMenu"
            [popover]="morePopover"
            [attr.aria-label]="config.ariaLabels.morePages"
            (click)="morePopover.toggle()"
          >
            {{ glyphs.more }}
          </button>
          <div cngxPopover #morePopover="cngxPopover">
            <ul
              cngxMenu
              #moreMenu="cngxMenu"
              tabindex="0"
              [label]="config.ariaLabels.morePages"
              (itemActivated)="onMenuActivate($event)"
            >
              @for (hidden of item.hidden; track hidden) {
                <li cngxMenuItem [value]="hidden">{{ hidden + 1 }}</li>
              }
            </ul>
          </div>
        }
      }
    </div>
  `,
  host: { class: 'cngx-paginator__segment' },
})
export class CngxPaginatorPages {
  protected readonly host = inject(CNGX_PAGINATOR_HOST);
  protected readonly config = injectPaginatorConfig();
  protected readonly glyphs = CNGX_PAGINATOR_GLYPHS;

  /**
   * The rendered page window. Structural `equal` keeps the reference stable
   * across recomputes that yield an identical window, so the `@for` does not
   * churn (signal-equality rule).
   */
  protected readonly model = computed<PageWindow>(
    () => pageWindow(this.host.pageIndex(), this.host.totalPages()),
    { equal: pageWindowEqual },
  );

  protected isCurrent(index: number): boolean {
    return index === this.host.pageIndex();
  }

  protected goto(index: number): void {
    this.host.setPage(index);
  }

  protected onMenuActivate(value: unknown): void {
    if (typeof value === 'number') {
      this.host.setPage(value);
    }
  }
}
