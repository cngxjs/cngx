import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter — Backend',
  moduleImports: [
    "import { HttpClient } from '@angular/common/http';",
    "import { catchError, finalize, map, of, switchMap } from 'rxjs';",
    "import { toObservable, toSignal } from '@angular/core/rxjs-interop';",
    "import { type DJProduct, type DJCategory } from '../../../../fixtures';",
  ],
  setup: `
  private readonly http = inject(HttpClient);

  protected readonly categories = toSignal(
    this.http
      .get<DJCategory[]>('https://dummyjson.com/products/categories')
      .pipe(catchError(() => of([] as DJCategory[]))),
    { initialValue: [] as DJCategory[] },
  );

  protected readonly activeSlug = signal<string | null>(null);
  protected readonly apiLoading = signal(false);

  protected readonly apiProducts = toSignal(
    toObservable(this.activeSlug).pipe(
      switchMap((slug) => {
        this.apiLoading.set(true);
        const url = slug
          ? \`https://dummyjson.com/products/category/\${slug}?limit=8&select=id,title,brand,price,rating,category\`
          : 'https://dummyjson.com/products?limit=8&select=id,title,brand,price,rating,category';
        return this.http.get<{ products: DJProduct[] }>(url).pipe(
          map((r) => r.products),
          catchError(() => of([] as DJProduct[])),
          finalize(() => this.apiLoading.set(false)),
        );
      }),
    ),
    { initialValue: [] as DJProduct[] },
  );
  `,
  sections: [
    {
      title: 'Server-Side Filter by Category (DummyJSON)',
      subtitle: 'For server-side filtering, skip <code>CngxFilter</code> — the API does the filtering. A <code>signal</code> holds the active category; <code>toObservable()</code> + <code>switchMap</code> fetches the right endpoint on every change.',
      imports: ['CurrencyPipe'],
      template: `
  <div class="filter-row">
    <span class="filter-label">Category:</span>
    <button
      type="button"
      class="chip"
      [class.chip--active]="activeSlug() === null"
      (click)="activeSlug.set(null)"
    >All</button>
    @for (cat of categories().slice(0, 10); track cat.slug) {
      <button
        type="button"
        class="chip"
        [class.chip--active]="activeSlug() === cat.slug"
        (click)="activeSlug.set(cat.slug)"
      >{{ cat.name }}</button>
    }
  </div>
  <div class="table-wrap">
    <table class="demo-table">
      <thead>
        <tr><th>Title</th><th>Brand</th><th>Category</th><th>Price</th><th>Rating</th></tr>
      </thead>
      <tbody>
        @if (apiLoading()) {
          <tr><td colspan="5" class="empty-cell">Loading…</td></tr>
        } @else {
          @for (p of apiProducts(); track p.id) {
            <tr>
              <td>{{ p.title }}</td>
              <td>{{ p.brand }}</td>
              <td>{{ p.category }}</td>
              <td>{{ p.price | currency }}</td>
              <td>{{ p.rating }}</td>
            </tr>
          } @empty {
            <tr><td colspan="5" class="empty-cell">No products.</td></tr>
          }
        }
      </tbody>
    </table>
  </div>
  <div class="status-row">
    <span class="status-badge" [class.active]="activeSlug() !== null">
      filter {{ activeSlug() ?? 'off' }}
    </span>
    <span class="status-badge">{{ apiProducts().length }} results</span>
  </div>`,
    },
    {
      title: 'Pattern: Local CngxFilter vs Server-Side',
      subtitle: 'Use <code>CngxFilter</code> when data is already in memory. Use a signal + API call when the server owns the data. The two patterns are independent — pick the right one per use case.',
      template: `
  <pre class="code-block"><code>// ── Local (CngxFilter) ──────────────────────────────────────
// Good when: data is already fetched, small dataset
protected readonly pred = computed(() =>
  this.activeRole() ? (p: Person) => p.role === this.activeRole() : null
);
// &lt;div [cngxFilter]="pred()"&gt;

// ── Server-side ──────────────────────────────────────────────
// Good when: data lives on the server, large dataset
protected readonly category = signal&lt;string | null&gt;(null);
protected readonly rows = toSignal(
  toObservable(this.category).pipe(
    switchMap((cat) =>
      cat
        ? http.get&lt;&#123; products: Product[] &#125;&gt;(\`/api/products/category/$&#123;cat&#125;\`)
        : http.get&lt;&#123; products: Product[] &#125;&gt;('/api/products'),
    ),
    map((r) => r.products),
  ),
  &#123; initialValue: [] &#125;,
);</code></pre>`,
    },
  ],
};
