import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sort',
  navLabel: 'Sort',
  navCategory: 'data',
  apiComponents: ['CngxSort', 'CngxSortHeader'],
  moduleImports: [
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  setup: `
  // Table 1 — uncontrolled
  protected readonly sort1State = signal<{ active: string; direction: 'asc' | 'desc' } | null>(null);
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

  protected onSort2Change(s: { active: string; direction: 'asc' | 'desc' } | null): void {
    if (s) { this.ctrl2Active.set(s.active); this.ctrl2Dir.set(s.direction); }
  }
  `,
  sections: [
    {
      title: 'CngxSort + CngxSortHeader',
      subtitle: '<code>[cngxSort]</code> is a stateful atom holding the active column and direction. <code>[cngxSortHeader]</code> binds to it via the explicit <code>[cngxSortRef]</code> input — no ancestor injection. Clicking toggles asc → desc → off.',
      imports: ['CngxSort', 'CngxSortHeader'],
      template: `
  <div cngxSort #sort="cngxSort" (sortChange)="sort1State.set($event)">
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
    (sortChange)="onSort2Change($event)"
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
  ],
};
