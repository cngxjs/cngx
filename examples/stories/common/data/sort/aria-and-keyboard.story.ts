import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSort: ARIA and keyboard',
  subtitle: '<code>CngxSortHeader</code> sets <code>aria-sort</code> on its host: <code>"ascending"</code>, <code>"descending"</code>, or omitted. Wrap the header in a native <code>&lt;button&gt;</code> so Enter and Space activate the sort.',
  description: 'The directive emits the WAI-ARIA <code>aria-sort</code> attribute on the active header so screen-reader users hear "ascending" or "descending" without consumer wiring. Inactive headers carry no attribute. The directive itself binds only <code>(click)</code>, so for keyboard activation the consumer renders the header as a native <code>&lt;button&gt;</code> (which translates Enter and Space into click) or attaches its own key handler. The live readout below mirrors the host attribute each click.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  apiComponents: [
    'CngxSort',
    'CngxSortHeader',
  ],
  moduleImports: [
    'import { CngxSort, CngxSortHeader } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSort', 'CngxSortHeader'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-sort`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-sort' },
    { label: 'WAI-ARIA APG: Sortable Table pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table.html' },
    { label: 'WCAG 2.1 SC 2.1.1 Keyboard', href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html' },
  ],
  setup: `
  protected readonly people = [
    { id: 1, name: 'Ada Lovelace', age: 36 },
    { id: 2, name: 'Grace Hopper', age: 42 },
    { id: 3, name: 'Margaret Hamilton', age: 28 },
    { id: 4, name: 'Hedy Lamarr', age: 51 },
  ] as const;

  protected sortedRows(
    entry: { active: string; direction: 'asc' | 'desc' } | null,
  ): readonly typeof this.people[number][] {
    if (!entry) return this.people;
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
          <button type="button" cngxSortHeader="name" [cngxSortRef]="sort" #nameH="cngxSortHeader">
            Name
            @if (nameH.isActive()) { <span aria-hidden="true">{{ nameH.isAsc() ? '↑' : '↓' }}</span> }
          </button>
        </th>
        <th scope="col">
          <button type="button" cngxSortHeader="age" [cngxSortRef]="sort" #ageH="cngxSortHeader">
            Age
            @if (ageH.isActive()) { <span aria-hidden="true">{{ ageH.isAsc() ? '↑' : '↓' }}</span> }
          </button>
        </th>
      </tr>
    </thead>
    <tbody>
      @for (row of sortedRows(sort.sort()); track row.id) {
        <tr>
          <td>{{ row.name }}</td>
          <td>{{ row.age }}</td>
        </tr>
      }
    </tbody>
  </table>`,
  templateChrome: `
  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Active column</span>
      <span class="event-value">{{ sort.active() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">aria-sort</span>
      <span class="event-value">{{ sort.direction() ? (sort.direction() === 'asc' ? 'ascending' : 'descending') : '(none)' }}</span>
    </div>
  </div>`,
};
