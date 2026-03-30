# Recycler — DOM Recycling

Signal-based virtualizer for long lists. Items outside the viewport are removed from the DOM while scroll position stays correct. No special viewport component, no structural directive — the consumer renders with `@for` and two spacer containers.

```typescript
import {
  injectRecycler,
  CngxMeasure,
  CngxVirtualItem,
  CngxRecyclerAnnouncer,
  connectRecyclerToRoving,
  provideRecyclerI18n,
  type CngxRecycler,
} from '@cngx/common/data';
```

## How It Works

```
items signal: [0, 1, 2, 3, ... 4999]     ← all items in memory
                        ↓
recycler.start() = 42, recycler.end() = 62  ← only indices 42-61 visible
                        ↓
sliced() → [item42, item43, ... item61]     ← 20 items in DOM
                        ↓
paddingTop = 42 * 48px = 2016px             ← spacer keeps scroll position correct
paddingBottom = (5000 - 62) * 48px          ← spacer keeps scrollbar correct
```

5000 items in memory (a few MB). 20 items in DOM (fast). That's the tradeoff.

## Pattern 1: Fixed Height List

The simplest case — all items loaded upfront or via initial fetch.

```typescript
@Component({
  template: `
    <cngx-recycler-announcer [cngxRecyclerAnnouncer]="recycler" />
    <div class="scroll" role="list"
         [attr.aria-busy]="recycler.isLoading() || null">
      <div [style.paddingTop.px]="recycler.offsetBefore()"
           [style.paddingBottom.px]="recycler.offsetAfter()">
        @for (item of visible(); track item.id; let i = $index) {
          <div role="listitem"
               [cngxVirtualItem]="recycler"
               [cngxVirtualItemIndex]="recycler.start() + i"
               style="height: 48px">
            {{ item.name }}
          </div>
        }
      </div>
    </div>
  `,
  imports: [CngxVirtualItem, CngxRecyclerAnnouncer],
})
export class ProductList {
  private readonly items = signal<Product[]>([]);

  readonly recycler = injectRecycler({
    scrollElement: '.scroll',
    totalCount: () => this.items().length,
    estimateSize: 48,
  });

  readonly visible = this.recycler.sliced(this.items);
}
```

## Pattern 2: Infinite Scroll with HTTP

Items loaded page-by-page as the user scrolls. The array grows, the recycler adapts.

```typescript
@Component({
  template: `
    <cngx-recycler-announcer [cngxRecyclerAnnouncer]="recycler" />
    <div class="scroll" [attr.aria-busy]="recycler.isLoading() || recycler.isRefreshing() || null">
      <div [style.paddingTop.px]="recycler.offsetBefore()"
           [style.paddingBottom.px]="recycler.offsetAfter()">
        @for (item of visible(); track item.id; let i = $index) {
          <div [cngxVirtualItem]="recycler" [cngxVirtualItemIndex]="recycler.start() + i">
            {{ item.name }}
          </div>
        }
      </div>
      <!-- Sentinel OUTSIDE the spacer container -->
      <div cngxInfiniteScroll
           [loading]="loadingMore()"
           (loadMore)="loadNextPage()">
      </div>
    </div>
    <p>Showing {{ recycler.firstVisible() + 1 }}–{{ recycler.lastVisible() + 1 }}
       of {{ recycler.ariaSetSize() }}</p>
  `,
  imports: [CngxVirtualItem, CngxRecyclerAnnouncer, CngxInfiniteScroll],
})
export class InfiniteProductList {
  private readonly http = inject(HttpClient);
  private readonly items = signal<Product[]>([]);
  private readonly loadingMore = signal(false);
  private nextPage = 1;

  readonly recycler = injectRecycler({
    scrollElement: '.scroll',
    totalCount: () => this.items().length,    // grows as pages load
    estimateSize: 64,
    serverTotal: () => this.serverTotal(),    // for "Item X of 1200" in SR
  });

  readonly visible = this.recycler.sliced(this.items);

  protected loadNextPage(): void {
    this.loadingMore.set(true);
    this.http.get<Product[]>(`/api/products?page=${this.nextPage}`).subscribe(page => {
      this.items.update(prev => [...prev, ...page]);
      // sliced() recomputes automatically — Signal reactivity
      // SR announces "20 more items loaded. 120 total."
      this.loadingMore.set(false);
      this.nextPage++;
    });
  }
}
```

**Why scrolling back up doesn't re-fetch:** The items array only grows (append-only). Already-loaded items stay in memory. The recycler just slices a different window — no HTTP call, no re-rendering of the full list.

```
Page 1 loaded → items = [0..49]    → recycler shows 0-20
Scroll down   → sentinel fires     → Page 2 loaded → items = [0..99]
Scroll down   → sentinel fires     → Page 3 loaded → items = [0..149]
Scroll UP to item 0                → already in array, zero HTTP, instant
Scroll DOWN to item 140            → already in array, zero HTTP, instant
Scroll past item 149               → sentinel fires → Page 4 loads
```

## Pattern 3: Variable Heights

Add `[cngxMeasure]` to each item. The recycler accumulates measured heights for accurate scroll position calculation via internal `SizeCache`.

```html
@for (item of visible(); track item.id; let i = $index) {
  <div [cngxMeasure]="recycler" [cngxMeasureIndex]="recycler.start() + i">
    <!-- Variable content: expandable text, images, etc. -->
    {{ item.content }}
  </div>
}
```

`CngxMeasure` uses `ResizeObserver` — measurements stay current when content changes (font loading, image load, expansion). Measured heights are cached permanently in `SizeCache` — scrolling back to previously-visited items uses the cached height, not the estimate.

## Pattern 4: With CngxAsyncState

The recycler follows the same `[state]` convention as `CngxCardGrid`, `CngxTreetable`, `CngxDialog`:

```typescript
readonly state = injectAsyncState(() => this.api.getAll());

readonly recycler = injectRecycler({
  scrollElement: '.scroll',
  totalCount: () => (this.state.data() ?? []).length,
  estimateSize: 64,
  state: this.state,          // drives isLoading, isRefreshing, isEmpty
  skeletonDelay: 300,         // fast loads never show skeleton
});

readonly visible = this.recycler.sliced(computed(() => this.state.data() ?? []));
```

```html
<div class="scroll" [attr.aria-busy]="recycler.isLoading() || recycler.isRefreshing() || null">
  <div [style.paddingTop.px]="recycler.offsetBefore()"
       [style.paddingBottom.px]="recycler.offsetAfter()">
    @if (recycler.showSkeleton()) {
      @for (_ of skeletonSlots(recycler.skeletonSlots()); track $index) {
        <div class="skeleton-item" aria-hidden="true"></div>
      }
    } @else if (recycler.isEmpty()) {
      <p>No results.</p>
    } @else {
      @for (item of visible(); track item.id) { ... }
    }
  </div>
</div>
```

## Pattern 5: Grid Layout

Grid mode uses placeholder counts instead of pixel spacers. CSS Grid with `auto-fill` + `minmax` distributes items across columns — invisible placeholders hold grid positions.

`placeholdersBefore()` and `placeholdersAfter()` are only non-zero in grid mode. In list mode they are always 0 — use `offsetBefore`/`offsetAfter` instead.

```typescript
readonly recycler = injectRecycler({
  scrollElement: '.scroll',
  totalCount: () => this.items().length,
  estimateSize: 280,           // row height
  layout: 'grid',
  columns: 4,                  // or () => responsiveColumns()
});

readonly phBefore = computed(() => Array.from<void>({ length: this.recycler.placeholdersBefore() }));
readonly phAfter = computed(() => Array.from<void>({ length: this.recycler.placeholdersAfter() }));
```

```html
<div class="grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">
  @for (_ of phBefore(); track $index) {
    <div aria-hidden="true" style="height:280px"></div>
  }
  @for (item of visible(); track item.id) {
    <div class="card">{{ item.title }}</div>
  }
  @for (_ of phAfter(); track $index) {
    <div aria-hidden="true" style="height:280px"></div>
  }
</div>
```

## Pattern 6: Deep-Link scrollToIndex

When `scrollToIndex(index)` targets an index beyond `totalCount` (data not loaded yet), the recycler stores it in `pendingTarget` and waits. When `totalCount` grows past the target (next page loads), the scroll executes automatically.

```typescript
// URL: /products?scrollTo=500
effect(() => {
  const target = this.route.queryParams['scrollTo'];
  if (target != null) {
    this.recycler.scrollToIndex(Number(target));
    // If item 500 isn't loaded yet, pendingTarget = 500
    // CngxInfiniteScroll keeps loading pages
    // When items.length > 500 → auto-scrolls
  }
});
```

```html
@if (recycler.pendingTarget() != null) {
  <div aria-live="polite">Scrolling to item {{ recycler.pendingTarget()! + 1 }}...</div>
}
```

## Pattern 7: Infinite Scroll + Pagination Combined

Both scrolling and clicking a page number work together. The data source is append-only (infinite scroll), the paginator acts as **navigation** — it scrolls to the page position instead of re-fetching.

```typescript
@Component({
  template: `
    <div class="scroll" [attr.aria-busy]="recycler.isLoading() || null">
      <div [style.paddingTop.px]="recycler.offsetBefore()"
           [style.paddingBottom.px]="recycler.offsetAfter()">
        @for (item of visible(); track item.id; let i = $index) {
          <div [cngxVirtualItem]="recycler" [cngxVirtualItemIndex]="recycler.start() + i">
            {{ item.name }}
          </div>
        }
      </div>
      <div cngxInfiniteScroll [loading]="loadingMore()" (loadMore)="loadNextPage()"></div>
    </div>

    <!-- Paginator navigates, doesn't fetch -->
    <div cngxPaginate #pg="cngxPaginate"
         [total]="recycler.ariaSetSize()"
         [cngxPageSize]="pageSize">
      <cngx-mat-paginator [cngxPaginateRef]="pg" />
    </div>

    <p>{{ recycler.firstVisible() + 1 }}–{{ recycler.lastVisible() + 1 }} of {{ recycler.ariaSetSize() }}</p>
  `,
  imports: [CngxVirtualItem, CngxInfiniteScroll, CngxPaginate, CngxMatPaginator],
})
export class HybridList {
  private readonly items = signal<Product[]>([]);
  protected readonly loadingMore = signal(false);
  protected readonly pageSize = 50;
  private nextPage = 1;

  readonly recycler = injectRecycler({
    scrollElement: '.scroll',
    totalCount: () => this.items().length,
    estimateSize: 48,
    serverTotal: () => this.serverTotalCount(),
  });

  readonly visible = this.recycler.sliced(this.items);

  // Paginator click → scroll to that page
  constructor() {
    const pg = viewChild(CngxPaginate);
    effect(() => {
      const page = pg()?.pageIndex();
      if (page != null) {
        this.recycler.scrollToIndex(page * this.pageSize);
        // If the page isn't loaded yet, pendingTarget kicks in —
        // CngxInfiniteScroll keeps loading until the target is reachable.
      }
    });
  }

  // Scrolling loads more pages
  protected loadNextPage(): void {
    this.loadingMore.set(true);
    this.http.get<Product[]>(`/api/products?page=${this.nextPage}`).subscribe(page => {
      this.items.update(prev => [...prev, ...page]);
      this.loadingMore.set(false);
      this.nextPage++;
    });
  }
}
```

**How they stay in sync:**
- User scrolls → `firstVisible()` / `lastVisible()` update → paginator can derive current page from it
- User clicks page 5 → `scrollToIndex(250)` → recycler scrolls → if items not loaded yet, `pendingTarget` waits → infinite scroll loads more pages → auto-scrolls when target is reachable
- No double-fetching: already-loaded items are in the array, infinite scroll only loads new pages

## Pattern 8: Windowed / Page-Based Loading (Advanced)

For datasets too large to keep in memory (100k+ items), use `recycler.neededRange()` (returns `Signal<{ start: number; end: number }>`) to load only the pages around the viewport and discard distant pages. **Most apps don't need this** — 10,000 items in an array is a few MB. Use this only when memory is a real constraint.

The recycler provides `neededRange` and `totalCount`. The consumer manages the sparse data cache.

```typescript
@Component({
  template: `
    <div class="scroll">
      <div [style.paddingTop.px]="recycler.offsetBefore()"
           [style.paddingBottom.px]="recycler.offsetAfter()">
        @for (idx of visibleIndices(); track idx) {
          @if (itemAt(idx); as item) {
            <div style="height:48px">{{ item.name }}</div>
          } @else {
            <div style="height:48px" class="placeholder" aria-hidden="true">Loading...</div>
          }
        }
      </div>
    </div>
  `,
})
export class WindowedList {
  private readonly http = inject(HttpClient);
  private readonly PAGE_SIZE = 50;
  private readonly MAX_CACHED_PAGES = 10;

  // Total count from server — the recycler uses this for scroll height
  readonly serverTotal = signal(0);

  readonly recycler = injectRecycler({
    scrollElement: '.scroll',
    totalCount: () => this.serverTotal(),  // FULL count, not loaded count
    estimateSize: 48,
  });

  // Sparse page cache — only pages near the viewport
  private readonly pageCache = signal(new Map<number, Product[]>());
  private readonly loadingPages = new Set<number>();

  // Visible indices array (NOT sliced — we don't have a dense array)
  readonly visibleIndices = computed(() => {
    const s = this.recycler.start();
    const e = this.recycler.end();
    return Array.from({ length: e - s }, (_, i) => s + i);
  });

  // Resolve a single item from the sparse cache
  protected itemAt(index: number): Product | undefined {
    const page = Math.floor(index / this.PAGE_SIZE);
    const offset = index % this.PAGE_SIZE;
    return this.pageCache().get(page)?.[offset];
  }

  constructor() {
    // Fetch total count once
    this.http.get<{ total: number }>('/api/products/count').subscribe(r => {
      this.serverTotal.set(r.total);
    });

    // Load pages as the user scrolls
    effect(() => {
      const { start, end } = this.recycler.neededRange();
      const startPage = Math.floor(start / this.PAGE_SIZE);
      const endPage = Math.floor(end / this.PAGE_SIZE);

      for (let p = startPage; p <= endPage; p++) {
        if (!this.pageCache().has(p) && !this.loadingPages.has(p)) {
          this.loadPage(p);
        }
      }

      // Evict distant pages to keep memory bounded
      this.evictDistantPages(startPage, endPage);
    });
  }

  private loadPage(page: number): void {
    this.loadingPages.add(page);
    this.http.get<Product[]>(`/api/products?page=${page}&size=${this.PAGE_SIZE}`)
      .subscribe(items => {
        this.pageCache.update(cache => {
          const next = new Map(cache);
          next.set(page, items);
          return next;
        });
        this.loadingPages.delete(page);
      });
  }

  private evictDistantPages(startPage: number, endPage: number): void {
    const cache = this.pageCache();
    if (cache.size <= this.MAX_CACHED_PAGES) { return; }
    const keep = new Set<number>();
    for (let p = startPage - 2; p <= endPage + 2; p++) { keep.add(p); }
    this.pageCache.update(c => {
      const next = new Map(c);
      for (const key of next.keys()) {
        if (!keep.has(key)) { next.delete(key); }
      }
      return next;
    });
  }
}
```

**Key differences from append-only:**

| | Append-only (Pattern 2) | Windowed (Pattern 8) |
|-|-|-|
| `totalCount` | Loaded item count (grows) | Server total (fixed) |
| `sliced()` | Yes — dense array | No — sparse cache, use `start()`/`end()` directly |
| Memory | Grows with loaded pages | Bounded by `MAX_CACHED_PAGES` |
| Scroll back | Instant (data in array) | May need re-fetch (evicted pages) |
| Complexity | Low | High — manage cache, eviction, loading states |
| When to use | 99% of apps | 100k+ items AND memory is a real constraint |

## Sort / Filter Reset

When sort or filter changes, scroll to top:

```typescript
effect(() => {
  this.sort.sorts();   // track sort changes
  this.filter.predicate(); // track filter changes
  untracked(() => this.recycler.reset());
});
```

## Keyboard Navigation

Wire `CngxRovingTabindex` (virtual mode) to the recycler for full arrow-key navigation across the entire virtual list:

```typescript
@Component({
  hostDirectives: [
    { directive: CngxRovingTabindex, inputs: ['orientation', 'activeIndex', 'virtualCount'] },
  ],
})
export class MyList {
  private readonly roving = inject(CngxRovingTabindex, { host: true });
  readonly recycler = injectRecycler({ ... });

  constructor() {
    connectRecyclerToRoving(this.recycler, this.roving);
  }
}
```

Items outside the rendered range are scrolled into view and focused automatically.

## I18n

SR announcement texts are configurable via `CNGX_RECYCLER_I18N`:

```typescript
providers: [
  provideRecyclerI18n({
    loaded: (n, t) => `${n} weitere Eintraege. ${t} gesamt.`,
    filtered: (c) => `${c} Ergebnisse.`,
    empty: () => 'Keine Ergebnisse.',
    error: () => 'Fehler beim Laden.',
  }),
]
```

## Content Visibility (CSS-only)

Zero-JS optimization complementary to the recycler. The browser skips layout/paint for off-screen items:

```scss
@use '@cngx/common/data/recycler/content-visibility' as cv;

.item {
  @include cv.cngx-content-visibility(48px);
}
```

## API Reference

Full API documentation is in compodoc — run `npm run docs:serve`.
