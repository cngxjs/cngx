import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'mat-table — Paginate (Material)',
  apiComponents: ['CngxSort', 'CngxSortHeader', 'CngxFilter', 'CngxPaginate', 'CngxMatPaginator'],
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
  protected readonly displayedColumns = ['name', 'role', 'location'];
  protected readonly activeLocation = signal<string | null>(null);

  // ── Pagination state ────────────────────────────────────────────────────
  protected readonly pageIndex = signal(0);
  protected readonly pageSize  = signal(3);

  // ── Pipeline: filter → sort → paginate ──────────────────────────────────
  private readonly filtered = computed((): Person[] => {
    const pred = this.filter.predicate() as ((p: Person) => boolean) | null;
    const s    = this.sort.sort();
    let list   = PEOPLE as Person[];
    if (pred) list = list.filter(pred);
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

  protected readonly filteredCount = computed(() => this.filtered().length);

  private readonly paginated = computed(() =>
    this.filtered().slice(
      this.pageIndex() * this.pageSize(),
      (this.pageIndex() + 1) * this.pageSize(),
    ),
  );

  protected readonly ds = injectDataSource(this.paginated);

  protected filterBy(loc: string | null): void {
    this.activeLocation.set(loc);
    this.pageIndex.set(0);
    if (loc === null) { this.filter.clear(); }
    else { this.filter.setPredicate((p: Person) => p.location === loc); }
  }

  protected setPage(i: number): void {
    const max = Math.max(0, Math.ceil(this.filteredCount() / this.pageSize()) - 1);
    this.pageIndex.set(Math.max(0, Math.min(i, max)));
  }

  protected setPageSize(s: number): void {
    this.pageSize.set(s);
    this.pageIndex.set(0);
  }
  `,
  sections: [
    {
      title: 'mat-table + CngxPaginate + CngxMatPaginator',
      subtitle:
        '<code>CngxPaginate</code> manages pagination state in the template via <code>#pg</code>. ' +
        '<code>CngxMatPaginator</code> reads and writes the same state through the explicit <code>[cngxPaginateRef]="pg"</code> binding. ' +
        'The component\'s <code>pageIndex</code> and <code>pageSize</code> signals drive a manual pipeline — filter → sort → paginate — and the paginate directive is wired in <em>controlled mode</em> via <code>(pageChange)</code> / <code>(pageSizeChange)</code> outputs. ' +
        'Filtering resets to page 0 automatically.',
      imports: ['CngxSortHeader', 'CngxPaginate', 'CngxMatPaginator', 'MatTableModule'],
      template: `
  <div class="filter-row">
    <span class="filter-label">Location:</span>
    <button type="button" class="chip" [class.chip--active]="activeLocation() === null" (click)="filterBy(null)">All</button>
    @for (loc of locations; track loc) {
      <button type="button" class="chip" [class.chip--active]="activeLocation() === loc" (click)="filterBy(loc)">{{ loc }}</button>
    }
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

  <!-- CngxPaginate in controlled mode — component signals drive the state -->
  <div cngxPaginate #pg="cngxPaginate"
    [cngxPageIndex]="pageIndex()"
    [cngxPageSize]="pageSize()"
    [total]="filteredCount()"
    (pageChange)="setPage($event)"
    (pageSizeChange)="setPageSize($event)"
    style="display:contents">
  </div>
  <cngx-mat-paginator [cngxPaginateRef]="pg" [pageSizeOptions]="[3, 5, 8]" />

  <div class="status-row">
    <span class="status-badge" [class.active]="filter.isActive()">filter: {{ filter.isActive() ? 'active' : 'off' }}</span>
    <span class="status-badge" [class.active]="sort.isActive()">sort: {{ sort.isActive() ? sort.active() + ' ' + sort.direction() : 'off' }}</span>
    <span class="status-badge">{{ filteredCount() }} rows · page {{ pageIndex() + 1 }} / {{ pg.totalPages() }}</span>
  </div>`,
    },
    {
      title: 'SmartDataSource + CngxPaginate (hostDirective)',
      subtitle:
        'When <code>CngxPaginate</code> is added as a <code>hostDirective</code> on the same element as <code>injectSmartDataSource()</code>, the data source auto-discovers it and applies the page slice <em>after</em> sort. ' +
        'The consumer binds <code>[total]</code> on the host element from the parent template. ' +
        'Use <code>ds.filteredCount()</code> as the source of truth for the paginator length — it reflects the count <em>after</em> filter/search but <em>before</em> pagination.',
      template: `
  <pre class="code-block"><code>// Component with CngxSort, CngxFilter, CngxPaginate as hostDirectives
@Component(&#123;
  hostDirectives: [
    &#123; directive: CngxSort &#125;,
    &#123; directive: CngxFilter &#125;,
    &#123; directive: CngxPaginate, inputs: ['total'] &#125;,
  ],
&#125;)
class MyTable &#123;
  private readonly ds = injectSmartDataSource(this.items);
  // ↑ auto-discovers CngxSort, CngxFilter, AND CngxPaginate

  // Expose filteredCount so the parent can bind it as [total]
  protected readonly filteredCount = this.ds.filteredCount;
&#125;

// Parent template:
// &lt;my-table [total]="filteredCount()"&gt;
//   &lt;cngx-mat-paginator [cngxPaginateRef]="..." /&gt;
// &lt;/my-table&gt;</code></pre>`,
    },
  ],
};
