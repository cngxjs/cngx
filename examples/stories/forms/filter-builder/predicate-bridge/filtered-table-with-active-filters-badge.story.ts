import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterBuilder: a predicate-driven filtered table',
  subtitle:
    'The builder exposes <code>presenter.predicate()</code> - a derived <code>Signal&lt;(item) =&gt; boolean&gt;</code> (Pillar 1). Bind it straight into a table\'s <code>@for</code> and every edit to the tree reshapes the visible rows with no manual wiring. An empty tree yields a <code>null</code> predicate, so the table shows every row and the badge reads <code>Active filters: 0</code>.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  framework: 'signal-forms',
  apiComponents: ['CngxFilterBuilder', 'CngxFilterBuilderPresenter'],
  moduleImports: [
    "import { CngxFilterBuilder, CngxFilterBuilderPresenter, createEmptyFilterRoot, type FilterGroup, type FilterNode } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS, FILTER_BUILDER_PEOPLE, type FilterBuilderPerson } from '../../../../fixtures';",
  ],
  imports: ['CngxFilterBuilder'],
  setup: `protected readonly fields = FILTER_BUILDER_FIELDS;
  protected readonly people = FILTER_BUILDER_PEOPLE;
  protected readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  private readonly builder = viewChild(CngxFilterBuilderPresenter);
  protected readonly rows = computed<readonly FilterBuilderPerson[]>(
    () => {
      const predicate = this.builder()?.predicate() as
        | ((item: FilterBuilderPerson) => boolean)
        | null
        | undefined;
      return predicate ? this.people.filter(predicate) : this.people;
    },
    { equal: (a, b) => a.length === b.length && a.every((row, i) => row === b[i]) },
  );
  protected readonly activeCount = computed(() => this.countExpressions(this.tree()));
  protected countExpressions(node: FilterNode): number {
    if (node.type === 'expression') {
      return 1;
    }
    return node.filters.reduce((sum, child) => sum + this.countExpressions(child), 0);
  }`,
  template: `  <div class="demo-form">
    <cngx-filter-builder [fields]="fields" [(value)]="tree" />

    <p class="status-badge">Active filters: {{ activeCount() }}</p>

    <table class="demo-table">
      <caption class="cngx-sr-only">People matching the current filter</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Age</th>
          <th scope="col">Role</th>
        </tr>
      </thead>
      <tbody>
        @for (row of rows(); track row.name) {
          <tr>
            <td>{{ row.name }}</td>
            <td>{{ row.age }}</td>
            <td>{{ row.role }}</td>
          </tr>
        }
      </tbody>
    </table>
  </div>`,
};
