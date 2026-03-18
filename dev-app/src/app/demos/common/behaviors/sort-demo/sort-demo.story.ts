import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sort',
  moduleImports: [
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  setup: `
  protected readonly sortState = signal<{ active: string; direction: 'asc' | 'desc' } | null>(null);

  protected readonly sortedRows = computed((): Person[] => {
    const s = this.sortState();
    if (!s) return PEOPLE;
    return [...PEOPLE].sort((a, b) => {
      const av = (a as unknown as Record<string, string>)[s.active] ?? '';
      const bv = (b as unknown as Record<string, string>)[s.active] ?? '';
      const cmp = av.localeCompare(bv, undefined, { numeric: true, sensitivity: 'base' });
      return s.direction === 'asc' ? cmp : -cmp;
    });
  });
  `,
  sections: [
    {
      title: 'CngxSort + CngxSortHeader',
      subtitle: '<code>[cngxSort]</code> is a stateful atom holding the active column and direction. <code>[cngxSortHeader]</code> binds to it via the explicit <code>[cngxSortRef]</code> input — no ancestor injection. Clicking toggles asc → desc → off.',
      imports: ['CngxSort', 'CngxSortHeader'],
      template: `
  <div cngxSort #sort="cngxSort" (sortChange)="sortState.set($event)">
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
          @for (row of sortedRows(); track row.name) {
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
  @if (sortState(); as s) {
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
    [cngxSortActive]="'role'"
    [cngxSortDirection]="'asc'"
    (sortChange)="sortState.set($event)"
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
          @for (row of sortedRows(); track row.name) {
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
    Pre-seeded: <strong>role asc</strong>. Interact to change.
  </div>`,
    },
  ],
};
