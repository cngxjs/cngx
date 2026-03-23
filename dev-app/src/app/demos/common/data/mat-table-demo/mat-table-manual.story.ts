import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'mat-table — DataSource (Manual Pipeline)',
  navLabel: 'mat-table (Manual)',
  navCategory: 'data',
  apiComponents: ['CngxSort', 'CngxSortHeader', 'CngxFilter'],
  hostDirectives: ['CngxSort', 'CngxFilter'],
  moduleImports: [
    "import { CngxFilter, CngxSort, injectDataSource } from '@cngx/common';",

    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  setup: `
  protected readonly sort   = inject(CngxSort,           { host: true });
  protected readonly filter = inject(CngxFilter<Person>, { host: true });

  protected readonly locations = [...new Set(PEOPLE.map((p: Person) => p.location))].sort(
    (a: string, b: string) => a.localeCompare(b),
  );
  protected readonly roles = [...new Set(PEOPLE.map((p: Person) => p.role))].sort(
    (a: string, b: string) => a.localeCompare(b),
  );
  protected readonly total = PEOPLE.length;
  protected readonly displayedColumns = ['name', 'role', 'location'];

  // Search is on a child <input> — inject() can't find it from here.
  // Own the term as a plain signal instead.
  protected readonly searchTerm = signal('');

  protected readonly selectedLocations = signal<Set<string>>(new Set());
  protected readonly selectedRoles     = signal<Set<string>>(new Set());

  // ── Manual pipeline: filter → search → sort ─────────────────────────────
  // Order matters: filter first (cheapest predicate), then text search,
  // then sort (most expensive — operates on already-reduced set).
  protected readonly processed = computed((): Person[] => {
    const pred = this.filter.predicate() as ((p: Person) => boolean) | null;
    const term = this.searchTerm().trim().toLowerCase();
    const s = this.sort.sort();

    let list = PEOPLE as Person[];
    if (pred) list = list.filter(pred);
    if (term) {
      list = list.filter((p) =>
        [p.name, p.role, p.location].some((v) => v.toLowerCase().includes(term)),
      );
    }
    if (s) {
      const { active, direction } = s;
      list = [...list].sort((a, b) => {
        const av = String((a as unknown as Record<string, unknown>)[active] ?? '');
        const bv = String((b as unknown as Record<string, unknown>)[active] ?? '');
        const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
        return direction === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  });

  // Pass the computed signal — DataSource is just a CDK bridge
  protected readonly ds = injectDataSource(this.processed);

  protected toggleLocation(loc: string): void {
    const next = new Set(this.selectedLocations());
    if (next.has(loc)) { next.delete(loc); } else { next.add(loc); }
    this.selectedLocations.set(next);
    if (next.size > 0) {
      this.filter.addPredicate('location', (p) => next.has(p.location));
    } else {
      this.filter.removePredicate('location');
    }
  }

  protected toggleRole(role: string): void {
    const next = new Set(this.selectedRoles());
    if (next.has(role)) { next.delete(role); } else { next.add(role); }
    this.selectedRoles.set(next);
    if (next.size > 0) {
      this.filter.addPredicate('role', (p) => next.has(p.role));
    } else {
      this.filter.removePredicate('role');
    }
  }

  protected clearAll(): void {
    this.filter.clear();
    this.selectedLocations.set(new Set());
    this.selectedRoles.set(new Set());
    this.searchTerm.set('');
    this.sort.clear();
  }
  `,
  sections: [
    {
      title: 'DataSource + mat-table — Manual Pipeline with Multi-Sort & Multi-Filter',
      subtitle:
        'A manual <code>computed()</code> owns the full pipeline: multi-filter (AND across dimensions, OR within), text search, and multi-sort (Shift+click). ' +
        '<code>injectDataSource(computed)</code> bridges the signal to <code>mat-table</code>. ' +
        'Pipeline order — filter → search → sort — keeps the sort operating on the smallest possible set.',
      imports: ['CngxSortHeader', 'MatTableModule'],
      template: `
  <div class="filter-row">
    <span class="filter-label">Location (OR):</span>
    @for (loc of locations; track loc) {
      <button type="button" class="chip"
        [class.chip--active]="selectedLocations().has(loc)"
        (click)="toggleLocation(loc)">{{ loc }}</button>
    }
  </div>
  <div class="filter-row">
    <span class="filter-label">Role (OR):</span>
    @for (role of roles; track role) {
      <button type="button" class="chip"
        [class.chip--active]="selectedRoles().has(role)"
        (click)="toggleRole(role)">{{ role }}</button>
    }
  </div>
  <div class="search-row">
    <input
      type="text"
      class="search-input"
      placeholder="Search…"
      [value]="searchTerm()"
      (input)="searchTerm.set($any($event.target).value)"
    />
    <button type="button" (click)="clearAll()">Clear all</button>
  </div>

  <mat-table [dataSource]="ds" class="table-wrap">
    <ng-container matColumnDef="name">
      <mat-header-cell *matHeaderCellDef>
        <button cngxSortHeader="name" [cngxSortRef]="sort" #nH="cngxSortHeader" class="sort-btn">
          Name @if (nH.isActive()) {<span class="sort-arrow">{{ nH.isAsc() ? '↑' : '↓' }}</span>}
        </button>
      </mat-header-cell>
      <mat-cell *matCellDef="let row">{{ row.name }}</mat-cell>
    </ng-container>

    <ng-container matColumnDef="role">
      <mat-header-cell *matHeaderCellDef>
        <button cngxSortHeader="role" [cngxSortRef]="sort" #rH="cngxSortHeader" class="sort-btn">
          Role @if (rH.isActive()) {<span class="sort-arrow">{{ rH.isAsc() ? '↑' : '↓' }}</span>}
        </button>
      </mat-header-cell>
      <mat-cell *matCellDef="let row">{{ row.role }}</mat-cell>
    </ng-container>

    <ng-container matColumnDef="location">
      <mat-header-cell *matHeaderCellDef>
        <button cngxSortHeader="location" [cngxSortRef]="sort" #lH="cngxSortHeader" class="sort-btn">
          Location @if (lH.isActive()) {<span class="sort-arrow">{{ lH.isAsc() ? '↑' : '↓' }}</span>}
        </button>
      </mat-header-cell>
      <mat-cell *matCellDef="let row">{{ row.location }}</mat-cell>
    </ng-container>

    <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
    <mat-row *matRowDef="let row; columns: displayedColumns"></mat-row>
    <div *matNoDataRow class="empty-cell">No results.</div>
  </mat-table>

  <div class="status-row">
    <span class="status-badge" [class.active]="filter.isActive()">
      filters: {{ filter.activeCount() }}
    </span>
    <span class="status-badge" [class.active]="!!searchTerm()">
      search: {{ searchTerm() || 'off' }}
    </span>
    <span class="status-badge" [class.active]="sort.isActive()">
      sort: {{ sort.isActive() ? sort.active() + ' ' + sort.direction() : 'off' }}
    </span>
    <span class="status-badge">{{ processed().length }} / {{ total }} rows</span>
  </div>`,
    },
    {
      title: 'Pipeline — How the pieces connect',
      subtitle:
        'Everything flows through one <code>computed()</code>. Angular\'s reactivity reruns it automatically whenever any signal changes — no subscriptions, no manual triggering. ' +
        'Shift+click a column header to stack secondary sort keys.',
      template: `
  <pre class="code-block"><code>// 1. Directives auto-discovered via hostDirectives + inject()
protected readonly sort   = inject(CngxSort,   &#123; host: true &#125;);
protected readonly filter = inject(CngxFilter, &#123; host: true &#125;);
protected readonly searchTerm = signal('');  // plain signal — no directive needed

// 2. One computed() owns the full pipeline
private readonly processed = computed(() => &#123;
  let list = PEOPLE;

  // filter first — cheapest, reduces the set early
  const pred = this.filter.predicate();
  if (pred) list = list.filter(pred);

  // text search — runs on already-filtered set
  const term = this.searchTerm().toLowerCase();
  if (term) list = list.filter(p => matchesSearch(p, term));

  // sort last — operates on smallest possible set
  const s = this.sort.sort();        // primary SortEntry | null
  if (s) list = [...list].sort((a, b) => compare(a, b, s));

  return list;
&#125;);

// 3. Bridge signal → CDK DataSource → mat-table
protected readonly ds = injectDataSource(this.processed);

// 4. mat-table
// &lt;mat-table [dataSource]="ds"&gt; — same as any CDK DataSource</code></pre>`,
    },
  ],
};
