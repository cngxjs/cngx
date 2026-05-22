import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSort: Basic',
  subtitle: 'Single-sort, uncontrolled. Apply <code>[cngxSort]</code> to a parent, <code>cngxSortHeader="field"</code> to each clickable header, bind a <code>computed()</code> to derive the sorted rows.',
  description: 'CngxSort is a state directive: it tracks which field is active and what direction it sorts. It does NOT sort the data. The consumer reads <code>sort.sort()</code> and derives the rendered rows through a <code>computed()</code>, so any other reactive input (filter, search term, paginate slice) composes naturally with the sort signal. Click a header to cycle ascending then descending; click the active header a third time to clear the sort.',
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
  ] as const;

  protected sortedRows(entry: SortEntry | null): readonly typeof this.people[number][] {
    if (!entry) {
      return this.people;
    }
    const dir = entry.direction === 'asc' ? 1 : -1;
    return [...this.people].sort((a, b) => {
      const av = a[entry.active as keyof typeof a];
      const bv = b[entry.active as keyof typeof b];
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }`,
  template: `
  <table cngxSort #sort="cngxSort">
    <thead>
      <tr>
        <th scope="col">
          <button type="button" cngxSortHeader="name" [cngxSortRef]="sort" #h1="cngxSortHeader">
            Name
            @if (h1.isActive()) { <span aria-hidden="true">{{ h1.isAsc() ? '↑' : '↓' }}</span> }
          </button>
        </th>
        <th scope="col">
          <button type="button" cngxSortHeader="role" [cngxSortRef]="sort" #h2="cngxSortHeader">
            Role
            @if (h2.isActive()) { <span aria-hidden="true">{{ h2.isAsc() ? '↑' : '↓' }}</span> }
          </button>
        </th>
        <th scope="col">
          <button type="button" cngxSortHeader="age" [cngxSortRef]="sort" #h3="cngxSortHeader">
            Age
            @if (h3.isActive()) { <span aria-hidden="true">{{ h3.isAsc() ? '↑' : '↓' }}</span> }
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      @for (row of sortedRows(sort.sort()); track row.id) {
        <tr>
          <td>{{ row.name }}</td>
          <td>{{ row.role }}</td>
          <td>{{ row.age }}</td>
        </tr>
      }
    </tbody>
  </table>`,
};
