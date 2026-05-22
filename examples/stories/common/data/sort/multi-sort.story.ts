import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSort: Multi-sort',
  subtitle: '<code>[multiSort]="true"</code> lets users stack secondary sort keys via Shift+click. <code>sortHeader.priority()</code> gives the 1-based position so each active header can show its rank.',
  description: 'In multi-sort mode the directive maintains an ordered list of sort entries via <code>sorts()</code>. A plain click sets the single primary key. Shift+click on a different column adds it as a secondary key without dropping the primary. Shift+clicking an active column cycles its direction (asc to desc) then removes it from the stack. Sort multi-key by applying every entry in turn in the consumer-side comparator.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxSort',
    'CngxSortHeader',
  ],
  moduleImports: [
    'import { CngxSort, CngxSortHeader, type SortEntry } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSort', 'CngxSortHeader'],
  setup: `
  protected readonly people = [
    { id: 1, name: 'Ada Lovelace', role: 'Engineer', age: 36 },
    { id: 2, name: 'Grace Hopper', role: 'Architect', age: 42 },
    { id: 3, name: 'Margaret Hamilton', role: 'Engineer', age: 28 },
    { id: 4, name: 'Hedy Lamarr', role: 'Inventor', age: 51 },
    { id: 5, name: 'Katherine Johnson', role: 'Mathematician', age: 38 },
    { id: 6, name: 'Mary Allen Wilkes', role: 'Engineer', age: 36 },
    { id: 7, name: 'Joan Clarke', role: 'Mathematician', age: 42 },
  ] as const;

  protected sortedRows(entries: readonly SortEntry[]): readonly typeof this.people[number][] {
    if (entries.length === 0) {
      return this.people;
    }
    return [...this.people].sort((a, b) => {
      for (const entry of entries) {
        const dir = entry.direction === 'asc' ? 1 : -1;
        const av = a[entry.active as keyof typeof a];
        const bv = b[entry.active as keyof typeof b];
        if (av < bv) return -1 * dir;
        if (av > bv) return 1 * dir;
      }
      return 0;
    });
  }`,
  template: `
  <table cngxSort [multiSort]="true" #sort="cngxSort">
    <thead>
      <tr>
        <th scope="col">
          <button type="button" cngxSortHeader="name" [cngxSortRef]="sort" #h1="cngxSortHeader">
            Name
            @if (h1.isActive()) {
              <span aria-hidden="true">{{ h1.isAsc() ? '↑' : '↓' }}</span>
              <sup aria-hidden="true">{{ h1.priority() }}</sup>
            }
          </button>
        </th>
        <th scope="col">
          <button type="button" cngxSortHeader="role" [cngxSortRef]="sort" #h2="cngxSortHeader">
            Role
            @if (h2.isActive()) {
              <span aria-hidden="true">{{ h2.isAsc() ? '↑' : '↓' }}</span>
              <sup aria-hidden="true">{{ h2.priority() }}</sup>
            }
          </button>
        </th>
        <th scope="col">
          <button type="button" cngxSortHeader="age" [cngxSortRef]="sort" #h3="cngxSortHeader">
            Age
            @if (h3.isActive()) {
              <span aria-hidden="true">{{ h3.isAsc() ? '↑' : '↓' }}</span>
              <sup aria-hidden="true">{{ h3.priority() }}</sup>
            }
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      @for (row of sortedRows(sort.sorts()); track row.id) {
        <tr>
          <td>{{ row.name }}</td>
          <td>{{ row.role }}</td>
          <td>{{ row.age }}</td>
        </tr>
      }
    </tbody>
  </table>`,
  templateChromeBefore: `
  <p style="margin-bottom:12px">Click a header to set the primary sort. Hold Shift and click another header to stack secondary keys.</p>`,
};
