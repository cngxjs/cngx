import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sort — Multi-Key',
  apiComponents: ['CngxSort', 'CngxSortHeader'],
  moduleImports: [
    "import { type SortEntry } from '@cngx/common';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  setup: `
  protected readonly sorts = signal<SortEntry[]>([]);

  protected readonly rows = computed((): Person[] => {
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
  `,
  sections: [
    {
      title: 'Multi-Key Sort (Shift+Click)',
      subtitle: 'Add <code>[multiSort]="true"</code> to <code>[cngxSort]</code>. Clicking a header sets it as primary sort. <strong>Shift+click</strong> appends it as a secondary key (or cycles it asc → desc → removed). Each header shows its priority number when active.',
      imports: ['CngxSort', 'CngxSortHeader'],
      template: `
  <div cngxSort [multiSort]="true" #sort="cngxSort" (sortsChange)="sorts.set($event)">
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr>
            <th>
              <button cngxSortHeader="name" [cngxSortRef]="sort" #nH="cngxSortHeader" class="sort-btn">
                Name
                @if (nH.isActive()) {
                  <span class="sort-arrow">{{ nH.isAsc() ? '↑' : '↓' }}</span>
                  @if (sort.multiSort() && sorts().length > 1) {
                    <span class="sort-priority">{{ nH.priority() }}</span>
                  }
                }
              </button>
            </th>
            <th>
              <button cngxSortHeader="role" [cngxSortRef]="sort" #rH="cngxSortHeader" class="sort-btn">
                Role
                @if (rH.isActive()) {
                  <span class="sort-arrow">{{ rH.isAsc() ? '↑' : '↓' }}</span>
                  @if (sort.multiSort() && sorts().length > 1) {
                    <span class="sort-priority">{{ rH.priority() }}</span>
                  }
                }
              </button>
            </th>
            <th>
              <button cngxSortHeader="location" [cngxSortRef]="sort" #lH="cngxSortHeader" class="sort-btn">
                Location
                @if (lH.isActive()) {
                  <span class="sort-arrow">{{ lH.isAsc() ? '↑' : '↓' }}</span>
                  @if (sort.multiSort() && sorts().length > 1) {
                    <span class="sort-priority">{{ lH.priority() }}</span>
                  }
                }
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
  ],
};
