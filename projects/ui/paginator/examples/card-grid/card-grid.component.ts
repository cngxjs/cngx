import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  CngxPaginator,
  CngxPaginatorGoto,
  CngxPaginatorNext,
  CngxPaginatorPageSize,
  CngxPaginatorPages,
  CngxPaginatorPrev,
  CngxPaginatorRange,
  CngxPaginatorStatus,
} from '@cngx/ui/paginator';

interface Product {
  readonly id: number;
  readonly name: string;
  readonly price: number;
}

const ADJ = ['Matte', 'Glossy', 'Rugged', 'Slim', 'Pro', 'Mini', 'Max', 'Eco'];
const NOUN = ['Keyboard', 'Mouse', 'Monitor', 'Webcam', 'Dock', 'Stand', 'Hub', 'Lamp'];

/**
 * A paged card grid with a composed paginator: items-per-page, a "go to page"
 * number input, a range readout, and a responsive collapse. `[responsive]`
 * makes a `@container` query swap the projected page-number row for a compact
 * "Page n of m" status once the paginator's own container narrows - compose both
 * `cngx-pgn-pages` and `cngx-pgn-status` and the right one shows per width. The
 * visible slice is a pure `computed()` of the shared page signals.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxPaginator,
    CngxPaginatorPageSize,
    CngxPaginatorGoto,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorStatus,
    CngxPaginatorNext,
    CngxPaginatorRange,
  ],
  styleUrl: './card-grid.component.scss',
  template: `
    <div class="wrap">
      <div class="cards">
        @for (p of pageItems(); track p.id) {
          <article class="card">
            <div class="card__thumb" aria-hidden="true">{{ p.name.charAt(0) }}</div>
            <h3 class="card__name">{{ p.name }}</h3>
            <p class="card__price">{{ '$' + p.price }}</p>
          </article>
        }
      </div>

      <cngx-paginator
        class="bar"
        skin="bar"
        [responsive]="true"
        [total]="products.length"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
        [pageSize]="pageSize()"
        (pageSizeChange)="pageSize.set($event)"
      >
        <cngx-pgn-page-size [options]="sizes" />
        <cngx-pgn-range />
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-status />
        <cngx-pgn-next />
        <cngx-pgn-goto />
      </cngx-paginator>
    </div>
  `,
})
export class CardGridExample {
  protected readonly sizes = [6, 9, 12] as const;
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(6);

  protected readonly products: readonly Product[] = Array.from({ length: 33 }, (_, i) => ({
    id: i + 1,
    name: `${ADJ[i % ADJ.length]} ${NOUN[(i * 3) % NOUN.length]}`,
    price: ((i * 17) % 180) + 19,
  }));

  protected readonly pageItems = computed<readonly Product[]>(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.products.slice(start, start + this.pageSize());
  });
}
