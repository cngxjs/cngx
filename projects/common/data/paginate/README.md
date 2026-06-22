# Paginate

Pagination state tracking with controlled/uncontrolled modes. Integrates with async state to disable navigation during loading.

## Import

```typescript
import {
  CngxPaginate,
  type CngxAsyncState,
} from '@cngx/common/data';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxPaginate } from '@cngx/common/data';

@Component({
  selector: 'app-list',
  template: `
    <div [cngxPaginate]="true" #pg="cngxPaginate" [total]="items.length">
      <ul>
        @for (item of items.slice(pg.range()[0], pg.range()[1]); track item.id) {
          <li>{{ item.name }}</li>
        }
      </ul>

      <div class="pagination">
        <button (click)="pg.previous()" [disabled]="pg.isFirst()">Previous</button>
        <span>Page {{ pg.pageIndex() + 1 }} of {{ pg.totalPages() }}</span>
        <button (click)="pg.next()" [disabled]="pg.isLast()">Next</button>
      </div>
    </div>
  `,
  imports: [CngxPaginate],
})
export class ListComponent {
  items = [/* 100+ items */];
}
```

## CngxPaginate - Pagination State

Tracks current page index and page size. Supports both **uncontrolled** (internal state) and **controlled** (`cngxPageIndex` / `cngxPageSize` inputs) modes.

Can bind an `CngxAsyncState` to disable navigation while data is loading/refreshing.

All navigation methods (`setPage`, `setPageSize`, `next`, `previous`, `first`, `last`) are no-ops while `isBusy()` is true.

## Controlled vs Uncontrolled

### Uncontrolled (Default)

Internal state fully managed:

```typescript
<div [cngxPaginate]="true" #pg="cngxPaginate" [total]="100">
  <!-- User clicks next → pg.pageIndex() changes -->
</div>
```

### Controlled

Parent drives page state via inputs:

```typescript
readonly pageIndex = signal(0);
readonly pageSize = signal(10);

<div
  [cngxPaginate]="true"
  [cngxPageIndex]="pageIndex()"
  [cngxPageSize]="pageSize()"
  (pageChange)="handlePageChange($event)"
  [total]="filteredCount()"
  #pg="cngxPaginate"
>
  <!-- ... -->
</div>

handlePageChange(index: number) {
  this.pageIndex.set(index);
}
```

## Composition with Data Processing

`CngxPaginate` is orthogonal to tables and lists. The consumer uses `range()` to slice data:

```typescript
readonly items = signal([/* data */]);
readonly paginate = inject(CngxPaginate);

readonly paged = computed(() => {
  const [start, end] = this.paginate.range();
  return this.items().slice(start, end);
});
```

Or use `CngxSmartDataSource` for automatic wiring:

```typescript
readonly paginate = inject(CngxPaginate);
readonly dataSource = injectSmartDataSource(this.items);
// paginate.range() automatically applied
```

## Reset on upstream change

`CngxPaginateResetOn` (`[cngxPaginateResetOn]`) jumps the host to the first page
whenever a bound key changes - bind the sort / filter / search value the result
set depends on, so a narrowed result never strands the user on a now-empty page.
The mounting value is captured without resetting; an already-first paginator
stays put.

```html
<table cngxPaginate [cngxPaginateResetOn]="filter()"><!-- ... --></table>
```

Bind a primitive or a `computed`. An inline array / object literal recomputes
every change-detection pass and would reset on each. For an organism that drives
the reset from its own input rather than the template, call
`connectPaginateResetOn(paginate, keyFn)` in an injection context - the shared
implementation behind this directive, the `CngxPaginator` shell's `resetOn`
input, and the `CngxMatPaginator` bridge's `resetOn` input.

## Deep-linkable pagination (URL sync)

`CngxPaginateRouting` (`[cngxPaginateRouting]`) persists the page / size in the
URL query string, so a paginated view survives reload, back, and forward - which
a bare paginator cannot. It needs only the brain and `@angular/router`, so it
works on a `cngxPaginate` host, the `<cngx-paginator>` shell, or a
`[cngxMatPaginator]`-bridged `<mat-paginator>`.

```html
<cngx-paginator cngxPaginateRouting [total]="items().length"></cngx-paginator>
```

The page is written 1-based (`?page=2`); the brain stays 0-based. Two paginators
on one route need distinct names via `[cngxPaginatePageParam]` /
`[cngxPaginateSizeParam]`. Without `provideRouter(...)` the directive is an inert
no-op (a dev-mode warning is logged).

## With Async State

Bind async state to disable page navigation while loading:

```typescript
readonly residents = injectAsyncState(() => this.api.getAll(this.filter()));
readonly paginate = inject(CngxPaginate);

<div
  [cngxPaginate]="true"
  [state]="residents"
  [total]="dataSource.filteredCount()"
>
  <table [dataSource]="dataSource"><!-- table --></table>
</div>

<mat-paginator
  [length]="paginate.total()" [pageIndex]="paginate.pageIndex()" [pageSize]="paginate.pageSize()"
  [disabled]="paginate.isBusy()"
  (page)="paginate.setPageSize($event.pageSize, false); paginate.setPage($event.pageIndex)"
></mat-paginator>
// Buttons disabled while residents.isBusy() = true
```

The paginator buttons remain in the DOM but become no-ops via the `isBusy()` check inside `setPage()`, `next()`, etc.

## Full Table Integration Example

```typescript
@Component({
  selector: 'app-residents-table',
  template: `
    <div [cngxSort]="true" [cngxFilter]="true" [cngxPaginate]="true" #sort="cngxSort" #filter="cngxFilter" #pg="cngxPaginate">
      <input
        type="search"
        placeholder="Search..."
        (input)="handleSearch($event)"
      />

      <table [dataSource]="dataSource">
        <thead>
          <tr>
            <th>
              <button cngxSortHeader="name" [cngxSortRef]="sort" #nameCol="cngxSortHeader">
                Name {{ nameCol.isAsc() ? '↑' : '↓' }}
              </button>
            </th>
            <th>
              <button cngxSortHeader="location" [cngxSortRef]="sort" #locCol="cngxSortHeader">
                Location {{ locCol.isAsc() ? '↑' : '↓' }}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          @for (row of dataSource.connect() | async; track row.id) {
            <tr>
              <td>{{ row.name }}</td>
              <td>{{ row.location }}</td>
            </tr>
          }
        </tbody>
      </table>

      <div class="pagination">
        <button (click)="pg.first()" [disabled]="pg.isFirst() || pg.isBusy()">First</button>
        <button (click)="pg.previous()" [disabled]="pg.isFirst() || pg.isBusy()">Previous</button>
        <span>Page {{ pg.pageIndex() + 1 }} of {{ pg.totalPages() }}</span>
        <button (click)="pg.next()" [disabled]="pg.isLast() || pg.isBusy()">Next</button>
        <button (click)="pg.last()" [disabled]="pg.isLast() || pg.isBusy()">Last</button>

        <select (change)="pg.setPageSize(+$event.target.value, true)" [disabled]="pg.isBusy()">
          <option [value]="10">10 per page</option>
          <option [value]="25">25 per page</option>
          <option [value]="50">50 per page</option>
        </select>
      </div>
    </div>
  `,
  imports: [CngxSort, CngxFilter, CngxPaginate, CommonModule],
})
export class ResidentsTableComponent {
  readonly filter = signal('');
  readonly residents = injectAsyncState(() =>
    this.api.getAll(this.filter())
  );

  readonly dataSource = injectSmartDataSource(
    this.residents,
    {
      searchFn: (item, term) => item.name.toLowerCase().includes(term.toLowerCase()),
    }
  );

  constructor(
    private api: ApiService,
    private pgRef: CngxPaginate,
  ) {
    // Wire paginate total from filtered count
    effect(() => {
      this.pgRef.total.set(this.dataSource.filteredCount());
    });
  }

  handleSearch(event: any) {
    this.filter.set(event.target.value);
    this.pgRef.first(); // Reset to page 0 on search
  }
}
```

## Accessibility

`CngxPaginate` does not manage ARIA attributes directly. The paginator UI (e.g. `<cngx-paginator>`, a `[cngxMatPaginator]`-bridged `<mat-paginator>`) or consuming code handles:

- `aria-label` on navigation buttons
- `aria-current="page"` on current page indicator
- `aria-disabled` when disabled

Example:

```html
<button
  (click)="pg.next()"
  [disabled]="pg.isLast() || pg.isBusy()"
  [attr.aria-label]="`Go to page ${pg.pageIndex() + 2} of ${pg.totalPages()}`"
>
  Next
</button>
```

## See Also

- [CngxSort](../sort/README.md) - multi-column sorting
- [CngxFilter](../filter/README.md) - predicate-based filtering
- [CngxSmartDataSource](../data-source/README.md) - auto-wires paginate + sort + filter
- [Async State System](../async-state/README.md) - `CngxAsyncState<T>`
- Compodoc: Full API reference at `/docs`
