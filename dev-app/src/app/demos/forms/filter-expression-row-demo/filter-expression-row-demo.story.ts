import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Row — standalone',
  navLabel: 'Filter Row',
  navCategory: 'filter-builder',
  description:
    '<cngx-filter-row> wired into a table-column header. A single filter row outside the ' +
    'recursive builder; the row owns its FilterExpression via [(value)] and the page applies it ' +
    'as a predicate to the rows below.',
  apiComponents: ['CngxFilterRow'],
  overview:
    '<p><code>CngxFilterRow</code> is the dedicated single-row surface for column-header / ' +
    'quick-filter contexts. Pass <code>[fields]</code> + <code>[(value)]</code> and the row ' +
    'reads/writes the bound <code>FilterExpression | null</code> directly — no wrapping ' +
    'presenter, no <code>CNGX_FILTER_BUILDER_HOST</code> needed.</p>' +
    '<p>This pattern lifts a single row into a table-column header, a side panel, or any ' +
    'context where a full builder tree is overkill. The bound expression flows through ' +
    '<code>toFilterPredicate(group, fields)</code> the same way; we wrap it in a synthetic ' +
    'one-expression group for evaluation.</p>',
  moduleImports: [
    "import { computed } from '@angular/core';",
    "import { CngxFilterRow, createFilterGroup, toFilterPredicate, type FilterExpression } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS, FILTER_BUILDER_PEOPLE, type FilterBuilderPerson } from '../../../fixtures';",
  ],
  setup: `
  protected readonly fields = FILTER_BUILDER_FIELDS;
  protected readonly people = FILTER_BUILDER_PEOPLE;
  protected readonly nameField = FILTER_BUILDER_FIELDS.find((f) => f.key === 'name')!;
  protected readonly roleField = FILTER_BUILDER_FIELDS.find((f) => f.key === 'role')!;
  protected readonly nameFilter = signal<FilterExpression | null>(null);
  protected readonly roleFilter = signal<FilterExpression | null>(null);

  protected readonly filtered = computed<readonly FilterBuilderPerson[]>(() => {
    const filters: FilterExpression[] = [];
    const n = this.nameFilter();
    const r = this.roleFilter();
    if (n) filters.push(n);
    if (r) filters.push(r);
    if (filters.length === 0) {
      return this.people;
    }
    const tree = createFilterGroup('and', filters);
    const predicate = toFilterPredicate(tree, this.fields);
    return predicate ? this.people.filter(predicate) : this.people;
  });
  `,
  sections: [
    {
      title: 'Per-column filter rows + filtered table',
      subtitle:
        'The Name and Role columns each ship a standalone <code>&lt;cngx-filter-row&gt;</code> ' +
        'pinned to a single field. Edit the operator / value and the table below filters in real time.',
      template: `
  <table class="demo-table">
    <thead>
      <tr>
        <th>
          <div class="demo-col-header">
            <span>Name</span>
            <cngx-filter-row [fields]="[nameField]" [(value)]="nameFilter" />
          </div>
        </th>
        <th>
          <div class="demo-col-header">
            <span>Role</span>
            <cngx-filter-row [fields]="[roleField]" [(value)]="roleFilter" />
          </div>
        </th>
        <th>Age</th>
        <th>Active</th>
      </tr>
    </thead>
    <tbody>
      @for (p of filtered(); track p.name) {
        <tr>
          <td>{{ p.name }}</td>
          <td>{{ p.role }}</td>
          <td>{{ p.age }}</td>
          <td>{{ p.active ? 'yes' : 'no' }}</td>
        </tr>
      } @empty {
        <tr><td colspan="4">No rows match the current filters.</td></tr>
      }
    </tbody>
  </table>

  <div class="status-row">
    <span class="status-badge">Name filter: {{ nameFilter() | json }}</span>
    <span class="status-badge">Role filter: {{ roleFilter() | json }}</span>
  </div>
      `,
      imports: ['CngxFilterRow', 'JsonPipe'],
      css: `
.demo-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.875rem; }
.demo-table th, .demo-table td { padding: 6px 10px; border-bottom: 1px solid var(--cngx-border, #ddd); text-align: left; vertical-align: top; }
.demo-table th { background: var(--cngx-surface-variant, #f5f5f5); font-weight: 600; }
.demo-col-header { display: flex; flex-direction: column; gap: 4px; }
      `,
    },
    {
      title: 'Pre-seeded filter',
      subtitle:
        'Seeded filter expression flows in via signal; clearing it through the row remove button writes <code>null</code>.',
      template: `
  <cngx-filter-row [fields]="[nameField]" [(value)]="nameFilter" />
  <pre class="code-block">{{ nameFilter() | json }}</pre>
      `,
      imports: ['CngxFilterRow', 'JsonPipe'],
    },
  ],
};
