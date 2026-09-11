import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterBuilder: case-insensitive contains',
  subtitle:
    'One provider line flips the substring trio: <code>provideFilterBuilderConfigAt(withCaseInsensitiveStrings(true))</code> folds both sides of <code>contains</code> / <code>startsWith</code> / <code>endsWith</code> at evaluation time. <code>eq</code> and <code>neq</code> keep <code>Object.is</code> identity semantics regardless.',
  description:
    'The tree seeds with <code>name contains "alice"</code> in lowercase and still matches "Alice Schmidt" because this demo component provides the case knob at its own injector. The default stays case-sensitive: remove the provider and the same expression matches nothing. The knob rides the config cascade, so a route or a single component can opt in without touching the rest of the app.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxFilterBuilder'],
  viewProviders: ['provideFilterBuilderConfigAt(withCaseInsensitiveStrings(true))'],
  moduleImports: [
    "import { CngxFilterBuilder, CngxFilterBuilderPresenter, createFilterExpression, createFilterGroup, provideFilterBuilderConfigAt, withCaseInsensitiveStrings, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS, FILTER_BUILDER_PEOPLE, type FilterBuilderPerson } from '../../../../fixtures';",
  ],
  imports: ['CngxFilterBuilder'],
  setup: `protected readonly fields = FILTER_BUILDER_FIELDS;
  protected readonly people = FILTER_BUILDER_PEOPLE;
  protected readonly tree = signal<FilterGroup>(
    createFilterGroup('and', [createFilterExpression('name', 'contains', 'alice')]),
  );
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
  );`,
  template: `  <cngx-filter-builder [fields]="fields" [(value)]="tree" />`,
  templateChrome: `  <div class="status-row">
    <span class="status-badge">Matching rows: {{ rows().length }} / {{ people.length }}</span>
  </div>
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
  </table>`,
};
