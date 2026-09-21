import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  signal,
} from '@angular/core';

import {
  CngxPaginator,
  CngxPaginatorFirst,
  CngxPaginatorLast,
  CngxPaginatorNext,
  CngxPaginatorPageSize,
  CngxPaginatorPages,
  CngxPaginatorPrev,
  CngxPaginatorRange,
} from '@cngx/ui/paginator';

interface Row {
  readonly id: number;
  readonly name: string;
  readonly team: string;
  readonly commits: number;
}

const TEAMS = ['Platform', 'Payments', 'Growth', 'Data', 'Mobile'] as const;
const NAMES = [
  'Ada Lovelace', 'Alan Turing', 'Grace Hopper', 'Edsger Dijkstra', 'Donald Knuth',
  'Barbara Liskov', 'Ken Thompson', 'Margaret Hamilton', 'Linus Torvalds', 'Radia Perlman',
];

/**
 * A data table whose footer is a `cngx-paginator` in the `bar` skin, Material 3
 * themed - the canonical `mat-paginator` parity layout. The page slice is a pure
 * `computed()` of `pageIndex` / `pageSize`; the table re-renders as the shared
 * signals change. Changing the items-per-page resets to the first page (brain
 * semantics) and the range readout recomputes.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [
    CngxPaginator,
    CngxPaginatorPageSize,
    CngxPaginatorRange,
    CngxPaginatorFirst,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorNext,
    CngxPaginatorLast,
  ],
  styleUrl: './data-table.component.scss',
  template: `
    <div class="table-card">
      <table class="grid">
        <thead>
          <tr>
            <th class="num">#</th>
            <th>Name</th>
            <th>Team</th>
            <th class="num">Commits</th>
          </tr>
        </thead>
        <tbody>
          @for (row of pageRows(); track row.id) {
            <tr>
              <td class="num">{{ row.id }}</td>
              <td>{{ row.name }}</td>
              <td>{{ row.team }}</td>
              <td class="num">{{ row.commits }}</td>
            </tr>
          }
        </tbody>
      </table>

      <cngx-paginator
        class="grid-footer"
        skin="bar"
        [total]="rows.length"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
        [pageSize]="pageSize()"
        (pageSizeChange)="pageSize.set($event)"
      >
        <span class="grid-footer__label" aria-hidden="true">Rows per page:</span>
        <cngx-pgn-page-size [options]="sizes" />
        <cngx-pgn-range />
        <cngx-pgn-first />
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
        <cngx-pgn-last />
      </cngx-paginator>
    </div>
  `,
})
export class DataTableExample {
  protected readonly sizes = [5, 10, 25] as const;
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(5);

  protected readonly rows: readonly Row[] = Array.from({ length: 47 }, (_, i) => ({
    id: i + 1,
    name: NAMES[i % NAMES.length],
    team: TEAMS[i % TEAMS.length],
    commits: ((i * 37) % 240) + 3,
  }));

  protected readonly pageRows = computed<readonly Row[]>(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.rows.slice(start, start + this.pageSize());
  });

  private readonly document = inject(DOCUMENT);

  constructor() {
    const link = this.document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap';
    this.document.head.appendChild(link);
    this.document.body.classList.add('mat-typography', 'mat-app-background');
  }
}
