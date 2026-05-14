import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Builder — CngxFilter bridge',
  navLabel: 'Filter Builder Bridge',
  navCategory: 'filter-builder',
  description:
    'Wires <cngx-filter-builder> to CngxFilter via toFilterPredicate. ' +
    'Every change to the builder tree updates the filtered table below.',
  apiComponents: ['CngxFilterBuilder', 'CngxFilter'],
  overview:
    '<p><code>toFilterPredicate(tree, fields)</code> turns the builder\'s <code>FilterGroup</code> ' +
    'into an item-level predicate. An <code>effect</code> reads the current tree (signal) and pushes ' +
    'the resulting predicate into <code>CngxFilter.setPredicate</code>.</p>' +
    '<p>The <code>untracked()</code> wrap on the <code>setPredicate</code> call is required: ' +
    '<code>setPredicate</code> reads <code>CngxFilter</code>\'s internal predicates signal before writing it, ' +
    'so without <code>untracked()</code> the effect subscribes to that read and loops on every write.</p>' +
    '<p>The filtered list is a plain <code>computed</code> that reads the source items and the ' +
    '<code>filter.predicate()</code> signal.</p>',
  moduleImports: [
    "import { CngxFilter } from '@cngx/common/data';",
    "import { effect, untracked, viewChild, computed } from '@angular/core';",
    "import { CngxFilterBuilder, createEmptyFilterRoot, toFilterPredicate, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS, FILTER_BUILDER_PEOPLE, type FilterBuilderPerson } from '../../../fixtures';",
  ],
  setup: `
  protected readonly fields = FILTER_BUILDER_FIELDS;
  protected readonly people = FILTER_BUILDER_PEOPLE;
  protected readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  protected readonly filterRef = viewChild.required(CngxFilter<FilterBuilderPerson>);

  protected readonly filtered = computed<readonly FilterBuilderPerson[]>(() => {
    const filter = this.filterRef();
    const fn = filter.predicate();
    return fn ? this.people.filter(fn) : this.people;
  });

  constructor() {
    effect(() => {
      const filter = this.filterRef();
      const tree = this.tree();
      const fields = this.fields;
      untracked(() => filter.setPredicate(toFilterPredicate(tree, fields)));
    });
  }
  `,
  sections: [
    {
      title: 'Builder + filtered table',
      subtitle:
        'Build a filter tree on the left; the table below filters in real time. ' +
        'Active filter count is read from <code>CngxFilter.activeCount()</code>.',
      template: `
  <div class="demo-form">
    <div [cngxFilter]="null"></div>
    <cngx-filter-builder [fields]="fields" [(value)]="tree" />

    <div class="status-row">
      <span class="status-badge">Active filters: {{ filterRef().activeCount() }}</span>
      <span class="status-badge">Showing: {{ filtered().length }} / {{ people.length }}</span>
    </div>

    <table class="demo-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
          <th>Active</th>
          <th>Role</th>
          <th>Birthday</th>
        </tr>
      </thead>
      <tbody>
        @for (p of filtered(); track p.name) {
          <tr>
            <td>{{ p.name }}</td>
            <td>{{ p.age }}</td>
            <td>{{ p.active ? 'yes' : 'no' }}</td>
            <td>{{ p.role }}</td>
            <td>{{ p.birthday }}</td>
          </tr>
        }
      </tbody>
    </table>
  </div>
      `,
      imports: ['CngxFilterBuilder', 'CngxFilter'],
      css: `
.demo-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.875rem; }
.demo-table th, .demo-table td { padding: 6px 10px; border-bottom: 1px solid var(--cngx-border, #ddd); text-align: left; }
.demo-table th { background: var(--cngx-surface-variant, #f5f5f5); font-weight: 600; }
      `,
    },
  ],
};
