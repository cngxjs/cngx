# @cngx/common — Data Behaviors

Headless, composable directives for sort, filter, search, and pagination.
These are **orthogonal to all components** — no component injects them
automatically. The consumer connects them via `computed()` and passes
processed data as an input.

## Design: "Consumer wires it up"

```typescript
readonly processedData = computed(() => {
  let items = this.raw();
  const term = this.search().term();
  const s    = this.sort().sort();
  const pred = this.filter().predicate();
  if (term) items = items.filter(i => matchesTerm(i, term));
  if (pred) items = items.filter(pred);
  if (s)    items = [...items].sort(compareFn(s));
  return items;
});
```

This explicit wiring means:
- No hidden magic — you see exactly what transforms run and in what order
- Any directive works with any data structure (arrays, trees, observables)
- Easy to add custom transforms between standard ones

## Directives

### CngxSort

Multi-key sort state manager. Supports single-sort and multi-sort (Shift+click).

```html
<div cngxSort #sort="cngxSort" [multiSort]="true">
  <button [cngxSortHeader]="'name'" [cngxSortRef]="sort">Name</button>
  <button [cngxSortHeader]="'age'" [cngxSortRef]="sort">Age</button>
</div>
```

**Inputs:** `cngxSortActive`, `cngxSortDirection` (controlled mode), `multiSort` (boolean)
**Signals:** `sort` (primary SortEntry | null), `sorts` (SortEntry[]), `isActive` (boolean)
**Outputs:** `sortChange`, `sortsChange`
**Methods:** `setSort(field, additive?)`, `clear()`

### CngxSortHeader

Column header companion for `CngxSort`. Requires explicit `[cngxSortRef]` — no ancestor injection.

```html
<th [cngxSortHeader]="'price'" [cngxSortRef]="sort">
  Price {{ sort.isActive() && sort.sort()?.active === 'price' ? (sort.sort()?.direction === 'asc' ? '↑' : '↓') : '' }}
</th>
```

**Inputs:** `cngxSortHeader` (field name), `cngxSortRef` (CngxSort instance)
**Signals:** `isActive` (boolean), `priority` (number, 1-based in multi-sort stack)

### CngxFilter

Generic predicate-based filter with multi-filter support (AND-combines named predicates).

```html
<div cngxFilter #filter="cngxFilter" exportAs="cngxFilter">
  <button (click)="filter.addPredicate('status', item => item.active)">Active only</button>
  <button (click)="filter.addPredicate('category', item => item.category === 'A')">Category A</button>
  <button (click)="filter.clear()">Clear all</button>
  <span>{{ filter.activeCount() }} filters active</span>
</div>
```

**Inputs:** `cngxFilter` (controlled predicate function)
**Signals:** `predicate` (combined predicate | null), `predicates` (Map), `activeCount` (number), `isActive` (boolean)
**Outputs:** `filterChange`, `predicatesChange`
**Methods:** `addPredicate(key, fn)`, `removePredicate(key)`, `setPredicate(fn)`, `clear()`

### CngxPaginate

Headless pagination state. Works standalone or paired with `CngxMatPaginator` from `@cngx/ui`.

```html
<div cngxPaginate #pg="cngxPaginate" [total]="items().length">
  <span>Page {{ pg.pageIndex() + 1 }} of {{ pg.totalPages() }}</span>
  <button (click)="pg.previous()" [disabled]="pg.isFirst()">Prev</button>
  <button (click)="pg.next()" [disabled]="pg.isLast()">Next</button>
</div>
```

**Inputs:** `cngxPageIndex`, `cngxPageSize` (controlled), `total`
**Signals:** `pageIndex`, `pageSize`, `totalPages`, `isFirst`, `isLast`, `range` ([start, end] for Array.slice())
**Outputs:** `pageChange`, `pageSizeChange`
**Methods:** `setPage(i)`, `setPageSize(size, resetPage?)`, `next()`, `previous()`, `first()`, `last()`

## Data Sources

### injectDataSource(signal)

Minimal CDK `DataSource` bridge. Converts a Signal to the Observable-based
contract CDK/Material tables expect. No built-in transforms — the consumer
builds a `computed()` pipeline.

```typescript
readonly dataSource = injectDataSource(this.processedItems);
```

### injectSmartDataSource(signal, options?)

Auto-wiring DataSource that discovers `CngxSort`, `CngxFilter`, and
`CngxPaginate` from the element injector. Add them as `hostDirectives`
on the component so `inject()` finds them.

```typescript
@Component({
  hostDirectives: [{ directive: CngxSort }, { directive: CngxFilter }],
})
export class MyTable {
  readonly dataSource = injectSmartDataSource(this.items);
}
```

**Note:** `CngxSearch` does NOT auto-wire — it lives on a child `<input>`
element below the component injector. For search, use `injectDataSource` +
manual `computed()`.
