import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterBuilder: between range editor via the value-editor slot',
  subtitle:
    'The builtin <code>between</code> operator is opt-in: no field offers it until a <code>FilterFieldDef.operators</code> list names it. Its value shape is <code>[min, max]</code>, so the demo serves it with a two-input range editor in the <code>*cngxFilterBuilderValueEditor</code> slot - the slot context exposes <code>expression</code> precisely so an editor can switch UI on the operator.',
  description:
    'The Age field lists <code>between</code> next to <code>gte</code>/<code>lte</code>. The slot template renders paired min/max inputs for <code>between</code> and falls back to plain inputs for every other operator. A half-filled range (one empty bound) is a no-op that keeps all rows visible; both bounds evaluate inclusively through the presenter predicate driving the table. Fully custom operator keys take the same route after a <code>withOperators({ key: { evaluate } })</code> registration.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'integration'],
  framework: 'signal-forms',
  apiComponents: ['CngxFilterBuilder', 'CngxFilterBuilderValueEditor'],
  moduleImports: [
    "import { CngxFilterBuilder, CngxFilterBuilderPresenter, CngxFilterBuilderValueEditor, createFilterExpression, createFilterGroup, type FilterFieldDef, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_PEOPLE, type FilterBuilderPerson } from '../../../../fixtures';",
  ],
  imports: ['CngxFilterBuilder', 'CngxFilterBuilderValueEditor'],
  setup: `protected readonly fields: readonly FilterFieldDef[] = [
    { key: 'age', label: 'Age', editorType: 'number', operators: ['between', 'gte', 'lte'] },
    { key: 'name', label: 'Name', editorType: 'string' },
  ];
  protected readonly people = FILTER_BUILDER_PEOPLE;
  protected readonly tree = signal<FilterGroup>(
    createFilterGroup('and', [createFilterExpression('age', 'between', [30, 40])]),
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
  );
  protected rangeBound(value: unknown, index: number): number | string {
    if (!Array.isArray(value)) {
      return '';
    }
    const bound: unknown = value[index];
    return typeof bound === 'number' ? bound : '';
  }
  protected setRangeBound(
    value: unknown,
    setValue: (v: unknown) => void,
    index: number,
    event: Event,
  ): void {
    const raw = (event.target as HTMLInputElement).value;
    const bound = raw === '' ? null : Number(raw);
    const current: readonly unknown[] =
      Array.isArray(value) && value.length === 2 ? value : [null, null];
    setValue(index === 0 ? [bound, current[1] ?? null] : [current[0] ?? null, bound]);
  }
  protected setNumberValue(setValue: (v: unknown) => void, event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    setValue(raw === '' ? null : Number(raw));
  }
  protected setStringValue(setValue: (v: unknown) => void, event: Event): void {
    setValue((event.target as HTMLInputElement).value);
  }`,
  template: `  <cngx-filter-builder [fields]="fields" [(value)]="tree">
    <ng-template
      cngxFilterBuilderValueEditor
      let-value="value"
      let-setValue="setValue"
      let-expression="expression"
      let-fieldDef="fieldDef"
    >
      @if (expression.operator === 'between') {
        <span style="display: inline-flex; gap: 0.25rem; align-items: center;">
          <input
            type="number"
            aria-label="Minimum age"
            [value]="rangeBound(value, 0)"
            (input)="setRangeBound(value, setValue, 0, $event)"
          />
          <span aria-hidden="true">to</span>
          <input
            type="number"
            aria-label="Maximum age"
            [value]="rangeBound(value, 1)"
            (input)="setRangeBound(value, setValue, 1, $event)"
          />
        </span>
      } @else if (fieldDef.editorType === 'number') {
        <input
          type="number"
          [attr.aria-label]="fieldDef.label"
          [value]="value ?? ''"
          (input)="setNumberValue(setValue, $event)"
        />
      } @else {
        <input
          type="text"
          [attr.aria-label]="fieldDef.label"
          [value]="value ?? ''"
          (input)="setStringValue(setValue, $event)"
        />
      }
    </ng-template>
  </cngx-filter-builder>`,
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
