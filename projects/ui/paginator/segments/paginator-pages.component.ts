import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  ViewEncapsulation,
} from '@angular/core';

import { CngxRovingItem, CngxRovingTabindex } from '@cngx/common/a11y';
import { CngxListbox, CngxListboxTrigger, CngxOption } from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';

import { injectPaginatorConfig } from '../paginator-config';
import { CNGX_PAGINATOR_GLYPHS } from '../paginator-glyphs';
import { CNGX_PAGINATOR_HOST } from '../paginator-host.token';
import { pageWindowEqual, type PageWindow } from './page-model';
import { CNGX_PAGINATOR_PAGE_WINDOW_FACTORY } from './paginator-page-window.token';

/**
 * The numbered page row. One tab stop via `CngxRovingTabindex` (arrows / Home /
 * End move the active page button); the current page carries `aria-current`.
 * A truncation run collapses into an ellipsis button that opens a `CngxListbox`
 * grid of the hidden pages (same select-and-jump model as `cngx-pgn-page-of-pages`,
 * so focus moves into the panel on open).
 *
 * @category ui/paginator
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-parts/pages/number-row</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-behaviors/reset-on-filter</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/card-grid</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-contexts/paginated-list</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/bar</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/numbered</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/pill</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/rail</example-url>
 * <example-url>http://localhost:4200/#/ui/paginator/paginator-skins/segmented</example-url>
 */
@Component({
  selector: 'cngx-pgn-pages',
  exportAs: 'cngxPgnPages',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CngxRovingTabindex,
    CngxRovingItem,
    CngxListbox,
    CngxListboxTrigger,
    CngxOption,
    CngxPopover,
    CngxPopoverTrigger,
  ],
  template: `
    <div class="cngx-paginator__pages" cngxRovingTabindex [(activeIndex)]="rovingIndex">
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
            #moreBtn
            class="cngx-paginator__button cngx-paginator__more"
            [cngxListboxTrigger]="moreList"
            [cngxPopoverTrigger]="morePopover"
            [haspopup]="'listbox'"
            [popover]="morePopover"
            [attr.aria-label]="config.ariaLabels.morePages"
            (click)="openOverflow(morePopover, moreUl)"
          >
            {{ glyphs.more }}
          </button>
          <div
            cngxPopover
            #morePopover="cngxPopover"
            [closeOnOutsideClick]="true"
            (toggle)="onOverflowToggle($event, moreBtn)"
          >
            <ul
              cngxListbox
              #moreList="cngxListbox"
              #moreUl
              tabindex="0"
              class="cngx-paginator__overflow-panel"
              [label]="config.ariaLabels.morePages"
              [value]="null"
              (valueChange)="onSelectOverflow($event)"
            >
              @for (hidden of item.hidden; track hidden) {
                <li cngxOption class="cngx-paginator__option" [value]="hidden">{{ hidden + 1 }}</li>
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

  /** Pages flanking the current page on each side. Defaults to the v1 window. */
  readonly siblingCount = input<number>(1);
  /** Pages pinned at each end. Defaults to the v1 window. */
  readonly boundaryCount = input<number>(1);

  /** The page-window computation, swappable enterprise-wide via the DI token. */
  private readonly pageWindowFn = inject(CNGX_PAGINATOR_PAGE_WINDOW_FACTORY)();

  /**
   * The rendered page window. Structural `equal` keeps the reference stable
   * across recomputes that yield an identical window, so the `@for` does not
   * churn (signal-equality rule).
   */
  protected readonly model = computed<PageWindow>(
    () =>
      this.pageWindowFn(
        this.host.pageIndex(),
        this.host.totalPages(),
        this.siblingCount(),
        this.boundaryCount(),
      ),
    { equal: pageWindowEqual },
  );

  /** Position of the active page within the rendered window (gaps counted). */
  private readonly activeWindowIndex = computed<number>(() => {
    const current = this.host.pageIndex();
    const idx = this.model().pages.findIndex(
      (item) => item.kind === 'page' && item.index === current,
    );
    return idx === -1 ? 0 : idx;
  });

  /**
   * Roving focus cursor for the page row. A `linkedSignal` so the row's single
   * tab stop tracks the active page (Tab lands on `aria-current`) yet still
   * moves freely under the arrow keys between selections: arrow navigation
   * writes the cursor locally, and it re-syncs to the active page whenever the
   * page changes by any path (click / prev / next / Enter). Focus is not
   * selection - the user arrows to a page and Enter commits it.
   */
  protected readonly rovingIndex = linkedSignal<number>(() => this.activeWindowIndex());

  protected isCurrent(index: number): boolean {
    return index === this.host.pageIndex();
  }

  protected goto(index: number): void {
    this.host.setPage(index);
  }

  /**
   * Open the overflow popover and move focus into the listbox panel, so a
   * keyboard user lands in the grid (the trigger is a roving page-row item, so
   * the listbox trigger's own focus-move does not fire). `Enter`/`Space` on the
   * button dispatch a native click, so this covers mouse and keyboard alike.
   */
  protected openOverflow(popover: { toggle(): void; isVisible(): boolean }, panel: HTMLElement): void {
    popover.toggle();
    if (popover.isVisible()) {
      queueMicrotask(() => panel.focus());
    }
  }

  /**
   * Restore focus to the ellipsis trigger when the panel closes (Escape /
   * outside click), so a keyboard user is not dropped to the page body. If a
   * selection re-rendered the window away, the trigger is gone and the guard
   * skips it.
   */
  protected onOverflowToggle(event: Event, trigger: HTMLElement): void {
    if ((event as ToggleEvent).newState === 'closed' && trigger.isConnected) {
      trigger.focus();
    }
  }

  protected onSelectOverflow(value: number | null | undefined): void {
    if (typeof value === 'number') {
      this.host.setPage(value);
    }
  }
}
