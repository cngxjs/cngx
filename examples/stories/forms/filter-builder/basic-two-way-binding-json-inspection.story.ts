import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic — two-way binding + JSON inspection',
  subtitle: 'Default editors (string/number/boolean/date). Type or click to add filters; the <code>[(value)]</code> tree is mirrored in the JSON panel below.',
  description: 'Recursive query-builder for cngx — composable FilterGroup / FilterExpression tree, pluggable value editors, three logic operators (and/or/xor) plus orthogonal negated modifier.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxFilterBuilder',
    'CngxFilterBuilderPresenter',
    'CngxFilterGroup',
    'CngxFilterExpression',
  ],
  moduleImports: [
    'import { CngxFilterBuilder, createEmptyFilterRoot, type FilterGroup } from \'@cngx/forms/filter-builder\';',
    'import { FILTER_BUILDER_FIELDS } from \'../../../fixtures\';',
  ],
  imports: ['CngxFilterBuilder'],
  setup: `protected readonly fields = FILTER_BUILDER_FIELDS;
  protected readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  protected formatTree(t: FilterGroup): string {
    return JSON.stringify(t, null, 2);
  }
  protected resetTree(): void {
    this.tree.set(createEmptyFilterRoot());
  }`,
  template: `
  <div class="demo-form">
    <cngx-filter-builder [fields]="fields" [(value)]="tree" />
    <div class="status-row">
      <button class="chip" (click)="resetTree()">Reset to empty</button>
    </div>
    <pre class="code-block"><code>{{ formatTree(tree()) }}</code></pre>
  </div>
      `,
};
