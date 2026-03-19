import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Search — Backend',
  moduleImports: [
    "import { HttpClient } from '@angular/common/http';",
    "import { catchError, finalize, map, of, switchMap } from 'rxjs';",
    "import { toObservable, toSignal } from '@angular/core/rxjs-interop';",
    "import { type DJProduct } from '../../../../fixtures';",
  ],
  setup: `
  private readonly http = inject(HttpClient);

  protected readonly apiTerm = signal('');
  protected readonly apiLoading = signal(false);

  protected readonly apiProducts = toSignal(
    toObservable(this.apiTerm).pipe(
      switchMap((q) => {
        if (q.length < 2) return of([] as DJProduct[]);
        this.apiLoading.set(true);
        return this.http
          .get<{ products: DJProduct[] }>(
            \`https://dummyjson.com/products/search?q=\${encodeURIComponent(q)}&limit=8&select=id,title,brand,price,rating,category\`,
          )
          .pipe(
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
      title: 'CngxSearch + HttpClient (DummyJSON)',
      subtitle: '<code>CngxSearch</code> already debounces, so there\'s no need for an extra <code>debounceTime()</code> in the pipe. <code>(searchChange)</code> updates a signal → <code>toObservable()</code> → <code>switchMap</code> cancels in-flight requests automatically.',
      imports: ['CngxSearch', 'CurrencyPipe'],
      template: `
  <div class="search-row">
    <input
      cngxSearch
      [debounceMs]="400"
      (searchChange)="apiTerm.set($event)"
      placeholder="Search products… (min 2 chars)"
      class="search-input"
    />
    @if (apiLoading()) {
      <span class="term-badge">loading…</span>
    } @else if (apiTerm()) {
      <span class="term-badge">{{ apiTerm() }}</span>
    }
  </div>
  <div class="table-wrap">
    <table class="demo-table">
      <thead>
        <tr><th>Title</th><th>Brand</th><th>Category</th><th>Price</th><th>Rating</th></tr>
      </thead>
      <tbody>
        @for (p of apiProducts(); track p.id) {
          <tr>
            <td>{{ p.title }}</td>
            <td>{{ p.brand }}</td>
            <td>{{ p.category }}</td>
            <td>{{ p.price | currency }}</td>
            <td>{{ p.rating }}</td>
          </tr>
        } @empty {
          <tr><td colspan="5" class="empty-cell">
            {{ apiTerm().length >= 2 ? 'No results.' : 'Type at least 2 characters to search.' }}
          </td></tr>
        }
      </tbody>
    </table>
  </div>
  <div class="output-badge">
    API: dummyjson.com/products/search &mdash; {{ apiProducts().length }} results
  </div>`,
    },
    {
      title: 'Pattern: Signal → Observable → API',
      subtitle: 'The key wiring: <code>toObservable(signal)</code> emits on every signal change, <code>switchMap</code> cancels the previous request before issuing a new one. <code>CngxSearch</code> provides the debounce so the observable only fires after the user stops typing.',
      template: `
  <pre class="code-block"><code>private readonly http = inject(HttpClient);
protected readonly term  = signal('');

protected readonly results = toSignal(
  toObservable(this.term).pipe(
    switchMap((q) =>
      q.length >= 2
        ? this.http
            .get&lt;&#123; products: Product[] &#125;&gt;(\`/api/search?q=$&#123;q&#125;\`)
            .pipe(map((r) => r.products))
        : of([]),
    ),
  ),
  &#123; initialValue: [] as Product[] &#125;,
);

// Template — no extra debounce needed:
// &lt;input cngxSearch [debounceMs]="400" (searchChange)="term.set($event)" /&gt;</code></pre>`,
    },
  ],
};
