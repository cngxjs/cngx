import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSmartDataSource — Auto-Wired',
  subtitle: '<code>injectSmartDataSource()</code> is called inside a component whose host element carries <code>[cngxSort]</code> and <code>[cngxFilter]</code> as <code>hostDirectives</code>. The data source auto-discovers them via <code>inject()</code> — no explicit wiring.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'integration'],
  apiComponents: [
    'CngxSort',
    'CngxFilter',
    'CngxPaginate',
  ],
  moduleImports: [
    'import { toSignal } from \'@angular/core/rxjs-interop\';',
    'import { CngxFilter, CngxSort, injectSmartDataSource } from \'@cngx/common\';',
    'import { PEOPLE, type Person } from \'../../../../fixtures\';',
  ],
  hostDirectives: ['CngxSort', 'CngxFilter'],
  imports: ['CngxSortHeader'],
  setup: `protected readonly sort = inject(CngxSort, { host: true });
  protected readonly filter = inject(CngxFilter<Person>, { host: true });
  protected readonly locations = [...new Set(PEOPLE.map((p: Person) => p.location))].sort(
    (a: string, b: string) => a.localeCompare(b),
  );
  private readonly items = signal(PEOPLE);
  private readonly ds = injectSmartDataSource(this.items);
  protected readonly rows = toSignal(this.ds.connect(), { initialValue: [] as Person[] });
  protected filterBy(location: string | null): void {
    if (location === null) {
      this.filter.clear();
    } else {
      this.filter.setPredicate((p) => p.location === location);
    }
  }`,
  setupChrome: `  protected readonly total = PEOPLE.length;`,
  template: `  <div class="filter-row">
    <span class="filter-label">Filter location:</span>
    <button type="button" class="chip" (click)="filterBy(null)">All</button>
    @for (loc of locations; track loc) {
      <button type="button" class="chip" (click)="filterBy(loc)">{{ loc }}</button>
    }
  </div>
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
        @for (row of rows(); track row.name) {
          <tr>
            <td>{{ row.name }}</td>
            <td>{{ row.role }}</td>
            <td>{{ row.location }}</td>
          </tr>
        } @empty {
          <tr><td colspan="3" class="empty-cell">No results.</td></tr>
        }
      </tbody>
    </table>
  </div>`,
  templateChrome: `<div class="status-row">
    <span class="status-badge" [class.active]="filter.isActive()">
      filter {{ filter.isActive() ? 'active' : 'off' }}
    </span>
    <span class="status-badge" [class.active]="sort.isActive()">
      sort {{ sort.isActive() ? sort.active() + ' ' + sort.direction() : 'off' }}
    </span>
    <span class="status-badge">{{ rows().length }} / {{ total }} rows</span>
  </div>`,
};
