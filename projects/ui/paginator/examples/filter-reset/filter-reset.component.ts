import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';

import {
  CngxPaginator,
  CngxPaginatorFirst,
  CngxPaginatorLast,
  CngxPaginatorNext,
  CngxPaginatorPages,
  CngxPaginatorPrev,
  CngxPaginatorRange,
} from '@cngx/ui/paginator';

const FRUITS = [
  'Apricot', 'Apple', 'Avocado', 'Banana', 'Blackberry', 'Blueberry', 'Cherry', 'Clementine',
  'Cranberry', 'Currant', 'Date', 'Dragonfruit', 'Elderberry', 'Fig', 'Gooseberry', 'Grape',
  'Grapefruit', 'Guava', 'Honeydew', 'Jackfruit', 'Kiwi', 'Kumquat', 'Lemon', 'Lime', 'Lychee',
  'Mango', 'Melon', 'Mulberry', 'Nectarine', 'Orange', 'Papaya', 'Passionfruit', 'Peach', 'Pear',
  'Persimmon', 'Pineapple', 'Plum', 'Pomegranate', 'Quince', 'Raspberry', 'Redcurrant',
  'Strawberry', 'Tangerine', 'Watermelon',
];

/**
 * A live-filtered list paged by `cngx-paginator`. The `[resetOn]` input is bound
 * to the filter term: whenever it changes the paginator jumps back to the first
 * page, so a narrowed result never strands the user on a now-empty page. Paging
 * is controlled - `pageIndex` is owned here and fed back through
 * `(pageIndexChange)`; `[total]` tracks the filtered count so the page math and
 * the range readout stay correct as the list shrinks.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CngxPaginator,
    CngxPaginatorFirst,
    CngxPaginatorPrev,
    CngxPaginatorPages,
    CngxPaginatorNext,
    CngxPaginatorLast,
    CngxPaginatorRange,
  ],
  styleUrl: './filter-reset.component.scss',
  template: `
    <div class="panel">
      <label class="field">
        <span class="field__label">Filter fruit</span>
        <input
          type="text"
          class="field__input"
          [value]="filter()"
          (input)="filter.set($any($event.target).value)"
          placeholder="Type to narrow the list"
        />
      </label>

      <p class="status">
        <strong>{{ filtered().length }}</strong> match(es) - page
        <strong>{{ pageIndex() + 1 }}</strong> of {{ pageCount() }}
      </p>

      @if (pageItems().length) {
        <ul class="list">
          @for (fruit of pageItems(); track fruit) {
            <li class="list__item">{{ fruit }}</li>
          }
        </ul>
      } @else {
        <p class="empty">No fruit matches "{{ filter() }}".</p>
      }

      <cngx-paginator
        skin="numbered"
        [total]="filtered().length"
        [resetOn]="filter()"
        [pageIndex]="pageIndex()"
        (pageIndexChange)="pageIndex.set($event)"
        [pageSize]="pageSize"
      >
        <cngx-pgn-first />
        <cngx-pgn-prev />
        <cngx-pgn-pages />
        <cngx-pgn-next />
        <cngx-pgn-last />
        <cngx-pgn-range />
      </cngx-paginator>
    </div>
  `,
})
export class FilterResetExample {
  protected readonly pageSize = 6;
  protected readonly pageIndex = signal(0);
  protected readonly filter = signal('');

  protected readonly filtered = computed<readonly string[]>(() => {
    const term = this.filter().trim().toLowerCase();
    return term ? FRUITS.filter((f) => f.toLowerCase().includes(term)) : FRUITS;
  });

  protected readonly pageItems = computed<readonly string[]>(() => {
    const start = this.pageIndex() * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.filtered().length / this.pageSize)),
  );
}
