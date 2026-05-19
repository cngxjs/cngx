import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Search',
  navLabel: 'Search',
  navCategory: 'interactive',
  apiComponents: ['CngxSearch'],
  moduleImports: [
    "import { PEOPLE, type Person } from '../../../../fixtures';",
    "import { HttpClient } from '@angular/common/http';",
    "import { catchError, finalize, map, of, switchMap } from 'rxjs';",
    "import { toObservable, toSignal } from '@angular/core/rxjs-interop';",
    "import { type DJProduct } from '../../../../fixtures';",
  ],
  setup: `
  protected readonly searchTerm = signal('');

  protected readonly searchRows = computed((): Person[] => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return PEOPLE;
    return PEOPLE.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.role.toLowerCase().includes(term) ||
        p.location.toLowerCase().includes(term),
    );
  });

  // ── Backend search ─────────────────────────────────────────────────────
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
      title: 'CngxSearch',
      subtitle: '<code>input[cngxSearch]</code> debounces the native <code>input</code> event and emits <code>(searchChange)</code> after the delay. <code>[debounceMs]</code> controls the delay (default 300 ms). Consumer drives filtering via a <code>computed()</code>.',
      imports: ['CngxSearch'],
      template: `
  <div class="search-row">
    <input
      cngxSearch
      [debounceMs]="200"
      (searchChange)="searchTerm.set($event)"
      placeholder="Search name, role, or location…"
      class="search-input"
    />
    @if (searchTerm()) {
      <span class="term-badge">{{ searchTerm() }}</span>
    }
  </div>
  <div class="table-wrap">
    <table class="demo-table">
      <thead>
        <tr><th>Name</th><th>Role</th><th>Location</th></tr>
      </thead>
      <tbody>
        @for (row of searchRows(); track row.name) {
          <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
        } @empty {
          <tr><td colspan="3" class="empty-cell">No results for "{{ searchTerm() }}".</td></tr>
        }
      </tbody>
    </table>
  </div>
  <div class="output-badge">
    searchChange: <strong>{{ searchTerm() || '—' }}</strong> &mdash; {{ searchRows().length }} results
  </div>`,
    },
    {
      title: 'CngxSearch — Zero Debounce',
      subtitle: 'Setting <code>[debounceMs]="0"</code> makes the search synchronous — every keystroke fires immediately. Useful when the dataset is small or filtering is cheap.',
      template: `
  <div class="search-row">
    <input
      cngxSearch
      [debounceMs]="0"
      (searchChange)="searchTerm.set($event)"
      placeholder="Instant search…"
      class="search-input"
    />
    @if (searchTerm()) {
      <span class="term-badge">{{ searchTerm() }}</span>
    }
  </div>
  <div class="table-wrap">
    <table class="demo-table">
      <thead>
        <tr><th>Name</th><th>Role</th><th>Location</th></tr>
      </thead>
      <tbody>
        @for (row of searchRows(); track row.name) {
          <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
        } @empty {
          <tr><td colspan="3" class="empty-cell">No results for "{{ searchTerm() }}".</td></tr>
        }
      </tbody>
    </table>
  </div>`,
    },
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
    {
      title: 'CngxSearch inside mat-form-field',
      subtitle: 'Add both <code>matInput</code> and <code>cngxSearch</code> to the same <code>&lt;input&gt;</code>. Material handles the field chrome; <code>cngxSearch</code> handles debounce + <code>(searchChange)</code>. No conflicts.',
      imports: ['CngxSearch', 'MatFormFieldModule', 'MatInputModule', 'MatIconModule'],
      template: `
  <mat-form-field appearance="outline" style="width:100%">
    <mat-label>Search people</mat-label>
    <mat-icon matPrefix>search</mat-icon>
    <input
      matInput
      cngxSearch
      [debounceMs]="200"
      (searchChange)="searchTerm.set($event)"
      placeholder="Name, role or location…"
    />
    @if (searchTerm()) {
      <mat-icon matSuffix style="cursor:pointer" (click)="searchTerm.set('')">close</mat-icon>
    }
  </mat-form-field>
  <div class="table-wrap">
    <table class="demo-table">
      <thead>
        <tr><th>Name</th><th>Role</th><th>Location</th></tr>
      </thead>
      <tbody>
        @for (row of searchRows(); track row.name) {
          <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
        } @empty {
          <tr><td colspan="3" class="empty-cell">No results for "{{ searchTerm() }}".</td></tr>
        }
      </tbody>
    </table>
  </div>
  <div class="output-badge">
    searchChange: <strong>{{ searchTerm() || '—' }}</strong> &mdash; {{ searchRows().length }} results
  </div>`,
    },
    {
      title: 'mat-form-field — Filled variant',
      subtitle: 'Works with all Material form-field appearances: <code>outline</code>, <code>fill</code>.',
      template: `
  <mat-form-field appearance="fill" style="width:100%">
    <mat-label>Search people</mat-label>
    <mat-icon matPrefix>search</mat-icon>
    <input
      matInput
      cngxSearch
      [debounceMs]="200"
      (searchChange)="searchTerm.set($event)"
      placeholder="Name, role or location…"
    />
    @if (searchTerm()) {
      <mat-icon matSuffix style="cursor:pointer" (click)="searchTerm.set('')">close</mat-icon>
    }
    <mat-hint>{{ searchRows().length }} / {{ searchRows().length + (searchTerm() ? 0 : 0) }} results</mat-hint>
  </mat-form-field>
  <div class="table-wrap" style="margin-top:0.5rem">
    <table class="demo-table">
      <thead>
        <tr><th>Name</th><th>Role</th><th>Location</th></tr>
      </thead>
      <tbody>
        @for (row of searchRows(); track row.name) {
          <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
        } @empty {
          <tr><td colspan="3" class="empty-cell">No results.</td></tr>
        }
      </tbody>
    </table>
  </div>`,
    },
  ],
};
