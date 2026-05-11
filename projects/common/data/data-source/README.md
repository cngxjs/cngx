# Data Source

CDK `DataSource` implementations that bridge Signals to table/list rendering. Two variants: dumb signal bridge and smart auto-wiring to Sort/Filter/Search/Paginate.

## Import

```typescript
import {
  CngxDataSource,
  injectDataSource,
  CngxSmartDataSource,
  injectSmartDataSource,
  type CngxSmartDataSourceOptions,
} from '@cngx/common/data';
```

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { injectDataSource } from '@cngx/common/data';

@Component({
  selector: 'app-list',
  template: `
    <table [dataSource]="dataSource">
      <tr><th>Name</th></tr>
      <tr *cdkRowDef="let row; columns: ['name']">
        <td>{{ row.name }}</td>
      </tr>
    </table>
  `,
})
export class ListComponent {
  readonly items = signal([
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
  ]);

  readonly dataSource = injectDataSource(this.items);
}
```

## CngxDataSource — Minimal Signal Bridge

Dumb CDK bridge with zero logic. The consumer builds all transformations via `computed()`.

### Class

```typescript
class CngxDataSource<T> extends DataSource<T>
```

**Constructor:**

```typescript
constructor(data: Signal<T[]>)
```

**Methods:**

- `connect(): Observable<T[]>` — returns Observable of current data
- `disconnect(): void` — no-op (Signal cleanup automatic)

### Factory Function

```typescript
injectDataSource<T>(data: Signal<T[]>): CngxDataSource<T>
```

**Requires:** Injection context (field initializer or constructor).

**Example:**

```typescript
readonly processed = computed(() => {
  let items = this.raw();
  if (this.sort().sort()) items = sortArray(items, this.sort().sort());
  if (this.filter().predicate()) items = items.filter(this.filter().predicate());
  return items;
});

readonly dataSource = injectDataSource(this.processed);
```

## CngxSmartDataSource — Auto-Wiring

CDK `DataSource` that optionally discovers and wires:
- `CngxSort` (multi-column sorting)
- `CngxFilter` (predicate-based filtering)
- `CngxSearch` (full-text search on child inputs)
- `CngxPaginate` (pagination range slicing)

All directives are injected **optionally** — missing directives simply skip that processing step.

Accepts either a plain `Signal<T[]>` or `CngxAsyncState<T[]>`. When async state is provided, the data source exposes the full UX state: loading, error, refreshing, empty.

### Class

```typescript
class CngxSmartDataSource<T> extends DataSource<T>
```

**Constructor:**

```typescript
constructor(
  source: Signal<T[]> | CngxAsyncState<T[]>,
  options?: CngxSmartDataSourceOptions<T>
)
```

**Options Interface:**

```typescript
interface CngxSmartDataSourceOptions<T> {
  /**
   * Custom full-text search predicate.
   * Receives item and search term; return true to keep it.
   * Default: case-insensitive match across all primitive properties.
   */
  searchFn?: (item: T, term: string) => boolean;

  /**
   * Custom sort comparator.
   * Receives two items, the active field key, and sort direction.
   * Default: locale-aware string comparison.
   */
  sortFn?: (a: T, b: T, field: string, direction: 'asc' | 'desc') => number;
}
```

### Signals

| Signal | Type | Description |
|-|-|-|
| `processed` | `Observable<T[]>` | Final data after all transformations (via `connect()`). |
| `filteredCount` | `Signal<number>` | Item count after filter/search, before pagination. Use for paginator `total` input. |
| `asyncState` | `CngxAsyncState<T[]> \| undefined` | The async state source (if constructed with one). |
| `isLoading` | `Signal<boolean>` | First load in progress (from async state). |
| `isRefreshing` | `Signal<boolean>` | Reload with cached data visible. |
| `isBusy` | `Signal<boolean>` | Any operation running. |
| `isFirstLoad` | `Signal<boolean>` | No successful load completed yet. |
| `error` | `Signal<unknown>` | Error from async state (if any). |
| `isEmpty` | `Signal<boolean>` | No data AND not busy. |

### Methods

- `connect(): Observable<T[]>` — returns Observable of processed data
- `disconnect(): void` — no-op (Signal cleanup automatic)

### Factory Function

```typescript
injectSmartDataSource<T>(
  source: Signal<T[]> | CngxAsyncState<T[]>,
  options?: CngxSmartDataSourceOptions<T>
): CngxSmartDataSource<T>
```

**Requires:** Injection context.

**Plain Signal Example:**

```typescript
readonly items = signal([/* data */]);
readonly dataSource = injectSmartDataSource(this.items);
// Discovers CngxSort, CngxFilter, CngxSearch, CngxPaginate in same injector
```

**With Async State — Full UX:**

```typescript
readonly residents = injectAsyncState(() => this.api.getAll());
readonly dataSource = injectSmartDataSource(this.residents);

// Table shows:
// - skeleton rows during isLoading()
// - error state when error() is set
// - loading bar during isRefreshing()
// - empty state when isEmpty()
```

**Custom Search & Sort:**

```typescript
readonly dataSource = injectSmartDataSource(this.items, {
  searchFn: (item, term) => item.fullName.toLowerCase().includes(term.toLowerCase()),
  sortFn: (a, b, field, dir) => {
    const av = (a as any)[field];
    const bv = (b as any)[field];
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'desc' ? -cmp : cmp;
  },
});
```

## Processing Pipeline

`CngxSmartDataSource` applies transformations in order:

1. **Raw data** — from `source` signal (or `source.data()` if async state)
2. **Filter** — `CngxFilter.predicate()` removes non-matching items
3. **Search** — `CngxSearch.term()` + `searchFn` finds matches
4. **Sort** — `CngxSort.sorts()` + `sortFn` orders items
5. **Paginate** — `CngxPaginate.range()` slices to current page

The source signal is unmodified — all transformations are derived via `computed()`.

## Async State Integration

When constructed with `CngxAsyncState<T[]>`:

- `data` comes from `state.data()` (defaults to empty array if undefined)
- `isLoading`, `isRefreshing`, `isBusy`, `isFirstLoad`, `error` all wire from state
- `isEmpty` ignores busy state — only true when `filteredCount() === 0` AND not busy
- All navigation methods (`CngxPaginate.setPage()`, etc.) are no-ops while busy

Use this to show skeleton rows during load, error overlay on failure, loading bar during refresh:

```typescript
<cngx-treetable
  [dataSource]="dataSource"
  [loading]="dataSource.isLoading()"
  [refreshing]="dataSource.isRefreshing()"
  [error]="dataSource.error()"
  [empty]="dataSource.isEmpty()"
/>

<cngx-mat-paginator
  [pageSizeOptions]="[10, 25, 50]"
  [length]="dataSource.filteredCount()"
  [cngxPaginateRef]="paginate"
/>
```

## Search — Special Handling

`CngxSearch` typically lives on a child `<input>` element below the component injector (e.g. in a header), so `inject(CngxSearch, { optional: true })` returns `null` in the common case.

**Two approaches:**

1. **Child input + manual computed (recommended):**
   ```typescript
   readonly search = signal('');

   readonly filtered = computed(() => {
     const term = this.search();
     return this.items().filter(item =>
       !term || customSearchFn(item, term)
     );
   });

   readonly dataSource = injectSmartDataSource(this.filtered);
   ```

2. **CngxSearch as hostDirective (rare):**
   ```typescript
   @Component({
     hostDirectives: [CngxSearch],
   })
   export class MyTable { }

   readonly dataSource = injectSmartDataSource(this.items);
   // injectSmartDataSource can now find CngxSearch
   ```

## Accessibility

`CngxSmartDataSource` does not set ARIA attributes directly. The consuming component (table, list, etc.) is responsible for:

- `role="table"` / `role="list"` on container
- `aria-busy` when `isBusy()`
- `aria-label` on sort headers
- Error announcements via screen reader region

Example with `<cngx-mat-treetable>`:

```html
<cngx-mat-treetable
  [dataSource]="dataSource"
  [loading]="dataSource.isLoading()"
  [error]="dataSource.error()"
  [attr.aria-busy]="dataSource.isBusy()"
>
  <!-- ARIA roles handled by component -->
</cngx-mat-treetable>
```

## Composition

`CngxSmartDataSource` discovers directives via the same injector. Place all directives as `hostDirective` or in the same component:

```typescript
@Component({
  hostDirectives: [
    CngxSort,
    CngxFilter,
    CngxPaginate,
  ],
})
export class TableComponent {
  readonly dataSource = injectSmartDataSource(this.items);
}
```

Or in a parent component that wraps the table. The table gets the injector of the parent, so it can find everything:

```html
<div [cngxSort] [cngxFilter] [cngxPaginate]>
  <my-table [dataSource]="dataSource" />
</div>
```

## Error Handling

When async state has an error:

```typescript
readonly state = injectAsyncState(() => this.api.fetch());
readonly dataSource = injectSmartDataSource(this.state);

@if (dataSource.error() as any) {
  <cngx-alert severity="error">
    {{ (dataSource.error() as any).message }}
  </cngx-alert>
}
```

The error does **not** block table rendering — `isEmpty()` becomes `false` (data is still visible), and the error is communicated separately via the UX layer (error overlay, alert, etc.).

## See Also

- [CngxSort](../sort/README.md) — multi-column sorting
- [CngxFilter](../filter/README.md) — predicate-based filtering
- [CngxPaginate](../paginate/README.md) — pagination
- [Async State System](../async-state/README.md) — `CngxAsyncState<T>`
- Compodoc: Full API reference at `/docs`
