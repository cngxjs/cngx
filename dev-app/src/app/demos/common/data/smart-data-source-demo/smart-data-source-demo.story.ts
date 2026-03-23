import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'SmartDataSource',
  apiComponents: ['CngxSort', 'CngxFilter', 'CngxPaginate'],
  hostDirectives: ['CngxSort', 'CngxFilter'],
  moduleImports: [
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { CngxFilter, CngxSort, injectSmartDataSource } from '@cngx/common';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  setup: `
  protected readonly sort = inject(CngxSort, { host: true });
  protected readonly filter = inject(CngxFilter<Person>, { host: true });

  protected readonly locations = [...new Set(PEOPLE.map((p: Person) => p.location))].sort(
    (a: string, b: string) => a.localeCompare(b),
  );
  protected readonly total = PEOPLE.length;

  private readonly items = signal(PEOPLE);
  private readonly ds = injectSmartDataSource(this.items);
  protected readonly rows = toSignal(this.ds.connect(), { initialValue: [] as Person[] });

  protected filterBy(location: string | null): void {
    if (location === null) {
      this.filter.clear();
    } else {
      this.filter.setPredicate((p) => p.location === location);
    }
  }
  `,
  sections: [
    {
      title: 'CngxSmartDataSource — Auto-Wired',
      subtitle:
        '<code>injectSmartDataSource()</code> is called inside a component whose host element carries <code>[cngxSort]</code> and <code>[cngxFilter]</code> as <code>hostDirectives</code>. The data source auto-discovers them via <code>inject()</code> — no explicit wiring.',
      imports: ['CngxSortHeader'],
      template: `
  <div class="filter-row">
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
  </div>
  <div class="status-row">
    <span class="status-badge" [class.active]="filter.isActive()">
      filter {{ filter.isActive() ? 'active' : 'off' }}
    </span>
    <span class="status-badge" [class.active]="sort.isActive()">
      sort {{ sort.isActive() ? sort.active() + ' ' + sort.direction() : 'off' }}
    </span>
    <span class="status-badge">{{ rows().length }} / {{ total }} rows</span>
  </div>`,
    },
    {
      title: 'How It Works — hostDirectives + inject()',
      subtitle:
        'The key is calling <code>injectSmartDataSource()</code> inside a component whose host element has <code>[cngxSort]</code> / <code>[cngxFilter]</code> as <code>hostDirectives</code>. The factory uses optional <code>inject()</code> to auto-discover them.',
      template: `
  <pre class="code-block"><code>@Component(&#123;
  selector: 'my-table',
  hostDirectives: [
    &#123; directive: CngxSort &#125;,
    &#123; directive: CngxFilter &#125;,
  ],
&#125;)
class MyTableComponent &#123;
  // inject() finds the hostDirective instances automatically
  protected readonly sort   = inject(CngxSort,   &#123; host: true &#125;);
  protected readonly filter = inject(CngxFilter, &#123; host: true &#125;);

  private readonly items = signal(data);

  // SmartDataSource discovers CngxSort + CngxFilter via inject()
  // because we&apos;re inside the component&apos;s injection context
  private readonly ds = injectSmartDataSource(this.items);

  protected readonly rows = toSignal(this.ds.connect(), &#123; initialValue: [] &#125;);
&#125;</code></pre>`,
    },
    {
      title: 'SmartDataSource + CngxPaginate (hostDirective)',
      subtitle:
        'Adding <code>CngxPaginate</code> as a third <code>hostDirective</code> enables automatic pagination in <code>CngxSmartDataSource</code>. ' +
        'The data source applies the page slice <em>after</em> sort. ' +
        '<code>ds.filteredCount()</code> gives the pre-pagination count to bind as <code>[total]</code> on the paginator. ' +
        'The consumer re-exports the <code>total</code> input from the hostDirective so the parent can set it.',
      template: `
  <pre class="code-block"><code>@Component(&#123;
  selector: 'my-table',
  hostDirectives: [
    &#123; directive: CngxSort &#125;,
    &#123; directive: CngxFilter &#125;,
    // Add CngxPaginate — SmartDataSource discovers it automatically
    &#123; directive: CngxPaginate, inputs: ['total'] &#125;,
  ],
&#125;)
class MyTableComponent &#123;
  protected readonly sort    = inject(CngxSort,    &#123; host: true &#125;);
  protected readonly filter  = inject(CngxFilter,  &#123; host: true &#125;);
  protected readonly paginate = inject(CngxPaginate, &#123; host: true &#125;);

  private readonly items = signal(data);

  // Auto-discovers CngxSort, CngxFilter, AND CngxPaginate
  private readonly ds = injectSmartDataSource(this.items);

  // Expose filteredCount (post-filter, pre-paginate) for the paginator
  protected readonly filteredCount = this.ds.filteredCount;
&#125;

// Parent template:
// &lt;my-table [total]="myFilteredCount()"&gt;
//   &lt;div cngxPaginate #pg="cngxPaginate"&gt;
//     &lt;cngx-mat-paginator [cngxPaginateRef]="pg" /&gt;
//   &lt;/div&gt;
// &lt;/my-table&gt;</code></pre>`,
    },
  ],
};
