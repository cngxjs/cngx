import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sort',
  navLabel: 'Sort',
  navCategory: 'data',
  apiComponents: ['CngxSort', 'CngxSortHeader'],
  moduleImports: [
    "import { PEOPLE, type Person } from '../../../../fixtures';",
    "import { type SortEntry } from '@cngx/common';",
    "import { HttpClient } from '@angular/common/http';",
    "import { catchError, finalize, map, of, switchMap } from 'rxjs';",
    "import { toObservable, toSignal } from '@angular/core/rxjs-interop';",
    "import { type DJProduct } from '../../../../fixtures';",
  ],
  setup: `
  // Table 1 — uncontrolled
  protected readonly sort1State = signal<SortEntry | null>(null);
  protected readonly sort1Rows = computed((): Person[] => {
    const s = this.sort1State();
    if (!s) return PEOPLE;
    return [...PEOPLE].sort((a, b) => {
      const av = (a as unknown as Record<string, string>)[s.active] ?? '';
      const bv = (b as unknown as Record<string, string>)[s.active] ?? '';
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
      return s.direction === 'asc' ? cmp : -cmp;
    });
  });

  // Table 2 — controlled (pre-seeded, writes back on interaction)
  protected readonly ctrl2Active = signal<string>('role');
  protected readonly ctrl2Dir = signal<'asc' | 'desc'>('asc');
  protected readonly sort2Rows = computed((): Person[] => {
    const active = this.ctrl2Active();
    const dir = this.ctrl2Dir();
    return [...PEOPLE].sort((a, b) => {
      const av = (a as unknown as Record<string, string>)[active] ?? '';
      const bv = (b as unknown as Record<string, string>)[active] ?? '';
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
      return dir === 'asc' ? cmp : -cmp;
    });
  });

  protected onSort2Change(s: SortEntry | null): void {
    if (s) { this.ctrl2Active.set(s.active); this.ctrl2Dir.set(s.direction); }
  }

  // ── Multi-key sort ─────────────────────────────────────────────────────
  protected readonly sorts = signal<SortEntry[]>([]);

  protected readonly multiSortRows = computed((): Person[] => {
    const active = this.sorts();
    if (!active.length) return PEOPLE;
    return [...PEOPLE].sort((a, b) => {
      for (const s of active) {
        const av = (a as unknown as Record<string, string>)[s.active] ?? '';
        const bv = (b as unknown as Record<string, string>)[s.active] ?? '';
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
        if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
  });

  // ── Backend sort ───────────────────────────────────────────────────────
  private readonly http = inject(HttpClient);

  protected readonly sortState = signal<SortEntry | null>(null);
  protected readonly apiLoading = signal(false);

  protected readonly apiProducts = toSignal(
    toObservable(this.sortState).pipe(
      switchMap((s) => {
        this.apiLoading.set(true);
        const base = 'https://dummyjson.com/products?limit=10&select=id,title,brand,price,rating,category';
        const url = s ? \`\${base}&sortBy=\${s.active}&order=\${s.direction}\` : base;
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
      title: 'CngxSort + CngxSortHeader',
      subtitle: '<code>[cngxSort]</code> is a stateful atom holding the active column and direction. <code>[cngxSortHeader]</code> binds to it via the explicit <code>[cngxSortRef]</code> input — no ancestor injection. Clicking toggles asc → desc → off.',
      imports: ['CngxSort', 'CngxSortHeader'],
      template: `
  <div cngxSort #sort="cngxSort" (sortChange)="sort1State.set($event ?? null)">
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr>
            <th>
              <button cngxSortHeader="name" [cngxSortRef]="sort" #nH="cngxSortHeader" class="sort-btn">
                Name @if (nH.isActive()) {<span class="sort-arrow">{{ nH.isAsc() ? '↑' : '↓' }}</span>}
              </button>
            </th>
            <th>
              <button cngxSortHeader="role" [cngxSortRef]="sort" #rH="cngxSortHeader" class="sort-btn">
                Role @if (rH.isActive()) {<span class="sort-arrow">{{ rH.isAsc() ? '↑' : '↓' }}</span>}
              </button>
            </th>
            <th>
              <button cngxSortHeader="location" [cngxSortRef]="sort" #lH="cngxSortHeader" class="sort-btn">
                Location @if (lH.isActive()) {<span class="sort-arrow">{{ lH.isAsc() ? '↑' : '↓' }}</span>}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          @for (row of sort1Rows(); track row.name) {
            <tr>
              <td>{{ row.name }}</td>
              <td>{{ row.role }}</td>
              <td>{{ row.location }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>
  @if (sort1State(); as s) {
    <div class="output-badge">
      sortChange: <strong>{{ s.active }}</strong> &mdash; {{ s.direction }}
    </div>
  }`,
    },
    {
      title: 'CngxSort — Controlled Mode',
      subtitle: '<code>[cngxSortActive]</code> + <code>[cngxSortDirection]</code> seed the sort externally. The atom still emits <code>(sortChange)</code> on interaction; consumer writes back to keep state in sync.',
      template: `
  <div cngxSort #sort2="cngxSort"
    [cngxSortActive]="ctrl2Active()"
    [cngxSortDirection]="ctrl2Dir()"
    (sortChange)="onSort2Change($event ?? null)"
  >
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr>
            <th>
              <button cngxSortHeader="name" [cngxSortRef]="sort2" #n2="cngxSortHeader" class="sort-btn">
                Name @if (n2.isActive()) {<span class="sort-arrow">{{ n2.isAsc() ? '↑' : '↓' }}</span>}
              </button>
            </th>
            <th>
              <button cngxSortHeader="role" [cngxSortRef]="sort2" #r2="cngxSortHeader" class="sort-btn">
                Role @if (r2.isActive()) {<span class="sort-arrow">{{ r2.isAsc() ? '↑' : '↓' }}</span>}
              </button>
            </th>
            <th>
              <button cngxSortHeader="location" [cngxSortRef]="sort2" #l2="cngxSortHeader" class="sort-btn">
                Location @if (l2.isActive()) {<span class="sort-arrow">{{ l2.isAsc() ? '↑' : '↓' }}</span>}
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          @for (row of sort2Rows(); track row.name) {
            <tr>
              <td>{{ row.name }}</td>
              <td>{{ row.role }}</td>
              <td>{{ row.location }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>
  <div class="output-badge">
    Active: <strong>{{ ctrl2Active() }}</strong> &mdash; {{ ctrl2Dir() }}
  </div>`,
    },
    {
      title: 'Multi-Key Sort (Shift+Click)',
      subtitle: 'Add <code>[multiSort]="true"</code> to <code>[cngxSort]</code>. Clicking a header sets it as primary sort. <strong>Shift+click</strong> appends it as a secondary key (or cycles it asc → desc → removed). Each header shows its priority number when active.',
      imports: ['CngxSort', 'CngxSortHeader'],
      template: `
  <div cngxSort [multiSort]="true" #sort3="cngxSort" (sortsChange)="sorts.set($event)">
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr>
            <th>
              <button cngxSortHeader="name" [cngxSortRef]="sort3" #nH3="cngxSortHeader" class="sort-btn">
                Name
                @if (nH3.isActive()) {
                  <span class="sort-arrow">{{ nH3.isAsc() ? '↑' : '↓' }}</span>
                  @if (sort3.multiSort() && sorts().length > 1) {
                    <span class="sort-priority">{{ nH3.priority() }}</span>
                  }
                }
              </button>
            </th>
            <th>
              <button cngxSortHeader="role" [cngxSortRef]="sort3" #rH3="cngxSortHeader" class="sort-btn">
                Role
                @if (rH3.isActive()) {
                  <span class="sort-arrow">{{ rH3.isAsc() ? '↑' : '↓' }}</span>
                  @if (sort3.multiSort() && sorts().length > 1) {
                    <span class="sort-priority">{{ rH3.priority() }}</span>
                  }
                }
              </button>
            </th>
            <th>
              <button cngxSortHeader="location" [cngxSortRef]="sort3" #lH3="cngxSortHeader" class="sort-btn">
                Location
                @if (lH3.isActive()) {
                  <span class="sort-arrow">{{ lH3.isAsc() ? '↑' : '↓' }}</span>
                  @if (sort3.multiSort() && sorts().length > 1) {
                    <span class="sort-priority">{{ lH3.priority() }}</span>
                  }
                }
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          @for (row of multiSortRows(); track row.name) {
            <tr>
              <td>{{ row.name }}</td>
              <td>{{ row.role }}</td>
              <td>{{ row.location }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  </div>
  <div class="output-badge">
    @if (sorts().length) {
      @for (s of sorts(); track s.active; let i = $index) {
        @if (i > 0) { <span>&rarr;</span> }
        <strong>{{ s.active }}</strong> {{ s.direction }}
      }
    } @else {
      No sort active
    }
  </div>`,
    },
    {
      title: 'Pattern: sortsChange → multi-key sort',
      subtitle: 'Use <code>(sortsChange)</code> instead of <code>(sortChange)</code> to receive the full sort stack. Apply it with a priority loop in your <code>computed()</code>.',
      template: `
  <pre class="code-block"><code>protected readonly sorts = signal&lt;SortEntry[]&gt;([]);

protected readonly rows = computed(() =&gt; &#123;
  const active = this.sorts();
  if (!active.length) return DATA;
  return [...DATA].sort((a, b) =&gt; &#123;
    for (const s of active) &#123;
      const cmp = compare(a[s.active], b[s.active]);
      if (cmp !== 0) return s.direction === 'asc' ? cmp : -cmp;
    &#125;
    return 0;
  &#125;);
&#125;);

// Template:
// &lt;div cngxSort [multiSort]="true" (sortsChange)="sorts.set($event)"&gt;
// Shift+click a header to add it as a secondary sort key.</code></pre>`,
    },
    {
      title: 'CngxSort + HttpClient (DummyJSON)',
      subtitle: '<code>(sortChange)</code> updates a signal → <code>toObservable()</code> → <code>switchMap</code> calls the API with <code>sortBy</code> + <code>order</code> params. <code>switchMap</code> automatically cancels any in-flight request when the sort changes.',
      imports: ['CngxSort', 'CngxSortHeader', 'CurrencyPipe'],
      template: `
  <div cngxSort #sort4="cngxSort" (sortChange)="sortState.set($event ?? null)">
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr>
            <th>
              <button cngxSortHeader="title" [cngxSortRef]="sort4" #tH="cngxSortHeader" class="sort-btn">
                Title @if (tH.isActive()) {<span class="sort-arrow">{{ tH.isAsc() ? '↑' : '↓' }}</span>}
              </button>
            </th>
            <th>Brand</th>
            <th>Category</th>
            <th>
              <button cngxSortHeader="price" [cngxSortRef]="sort4" #pH="cngxSortHeader" class="sort-btn">
                Price @if (pH.isActive()) {<span class="sort-arrow">{{ pH.isAsc() ? '↑' : '↓' }}</span>}
              </button>
            </th>
            <th>
              <button cngxSortHeader="rating" [cngxSortRef]="sort4" #rH4="cngxSortHeader" class="sort-btn">
                Rating @if (rH4.isActive()) {<span class="sort-arrow">{{ rH4.isAsc() ? '↑' : '↓' }}</span>}
              </button>
            </th>
          </tr>
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
            }
          }
        </tbody>
      </table>
    </div>
  </div>
  @if (sortState(); as s) {
    <div class="output-badge">
      API: sortBy=<strong>{{ s.active }}</strong> order=<strong>{{ s.direction }}</strong>
    </div>
  } @else {
    <div class="output-badge">API: dummyjson.com/products?limit=10 (unsorted)</div>
  }`,
    },
    {
      title: 'Pattern: sortChange → API params',
      subtitle: '<code>(sortChange)</code> emits <code>&#123; active, direction &#125;</code> or <code>null</code> (sort cleared). Map directly to query params — no extra transform needed.',
      template: `
  <pre class="code-block"><code>protected readonly sortState =
  signal&lt;&#123; active: string; direction: 'asc' | 'desc' &#125; | null&gt;(null);

protected readonly rows = toSignal(
  toObservable(this.sortState).pipe(
    switchMap((s) => &#123;
      const url = s
        ? \`/api/products?sortBy=$&#123;s.active&#125;&order=$&#123;s.direction&#125;\`
        : '/api/products';
      return this.http.get&lt;Product[]&gt;(url);
    &#125;),
  ),
  &#123; initialValue: [] &#125;,
);

// Template:
// &lt;div cngxSort (sortChange)="sortState.set($event ?? null)"&gt;</code></pre>`,
    },
  ],
};
