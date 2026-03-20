import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'MatPaginator',
  description: 'Material paginator wrapper that connects to a headless CngxPaginate directive via explicit reference binding.',
  moduleImports: [
    "import { viewChild } from '@angular/core';",
    "import { PEOPLE } from '../../../fixtures';",
  ],
  setup: `
  protected readonly allItems = signal(PEOPLE);
  protected readonly pg = viewChild.required<CngxPaginate>('pg');
  protected readonly displayedItems = computed(() => {
    const [start, end] = this.pg().range();
    return this.allItems().slice(start, end);
  });
  `,
  sections: [
    {
      title: 'CngxMatPaginator — Material Paginator',
      subtitle:
        '<code>&lt;cngx-mat-paginator&gt;</code> wraps <code>MatPaginator</code> and connects ' +
        'to a <code>CngxPaginate</code> directive via <code>[cngxPaginateRef]</code>. ' +
        'The headless <code>CngxPaginate</code> manages page state; the Material wrapper ' +
        'renders the UI.',
      imports: ['CngxPaginate', 'CngxMatPaginator'],
      template: `
  <div cngxPaginate #pg="cngxPaginate" [total]="allItems().length">
    <table class="demo-table" style="width: 100%;">
      <thead>
        <tr>
          <th style="text-align: left;">Name</th>
          <th style="text-align: left;">Role</th>
          <th style="text-align: left;">Location</th>
        </tr>
      </thead>
      <tbody>
        @for (item of displayedItems(); track item.name) {
          <tr>
            <td>{{ item.name }}</td>
            <td>{{ item.role }}</td>
            <td>{{ item.location }}</td>
          </tr>
        } @empty {
          <tr><td colspan="3" class="empty-cell">No data</td></tr>
        }
      </tbody>
    </table>
  </div>

  <cngx-mat-paginator [cngxPaginateRef]="pg" [pageSizeOptions]="[3, 5, 10]" />

  <div class="event-grid" style="margin-top: 12px">
    <div class="event-row">
      <span class="event-label">Page</span>
      <span class="event-value">{{ pg.pageIndex() + 1 }} / {{ pg.totalPages() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Page size</span>
      <span class="event-value">{{ pg.pageSize() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Showing</span>
      <span class="event-value">{{ pg.range()[0] + 1 }}–{{ pg.range()[1] }} of {{ pg.total() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'Headless — Custom Pagination Controls',
      subtitle:
        '<code>CngxPaginate</code> is headless — you can build any UI on top. ' +
        'This example uses plain buttons instead of <code>mat-paginator</code>.',
      imports: ['CngxPaginate'],
      template: `
  <div cngxPaginate #pg2="cngxPaginate" [total]="allItems().length" [cngxPageSize]="3">
    <ul style="list-style: none; padding: 0; margin: 0;">
      @for (item of allItems().slice(pg2.range()[0], pg2.range()[1]); track item.name) {
        <li style="
          padding: 8px 12px;
          border-bottom: 1px solid var(--cngx-border, #eee);
          font-size: 0.875rem;
        ">
          <strong>{{ item.name }}</strong> — {{ item.role }}, {{ item.location }}
        </li>
      }
    </ul>

    <div class="button-row" style="margin-top: 12px; align-items: center;">
      <button class="sort-btn" (click)="pg2.first()" [disabled]="pg2.isFirst()">First</button>
      <button class="sort-btn" (click)="pg2.previous()" [disabled]="pg2.isFirst()">Prev</button>
      <span style="font-size: 0.8125rem; padding: 0 8px;">
        {{ pg2.pageIndex() + 1 }} / {{ pg2.totalPages() }}
      </span>
      <button class="sort-btn" (click)="pg2.next()" [disabled]="pg2.isLast()">Next</button>
      <button class="sort-btn" (click)="pg2.last()" [disabled]="pg2.isLast()">Last</button>
    </div>
  </div>`,
    },
  ],
};
