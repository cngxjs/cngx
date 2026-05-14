import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Builder',
  navLabel: 'Filter Builder',
  navCategory: 'filter-builder',
  description:
    'Recursive query-builder for cngx — composable FilterGroup / FilterExpression tree, ' +
    'pluggable value editors, three logic operators (and/or/xor) plus orthogonal negated modifier.',
  apiComponents: [
    'CngxFilterBuilder',
    'CngxFilterBuilderPresenter',
    'CngxFilterGroup',
    'CngxFilterExpression',
  ],
  overview:
    '<p><code>cngx-filter-builder</code> is a recursive query-builder. ' +
    'The model is a discriminated-union tree (<code>FilterGroup</code> / <code>FilterExpression</code>) ' +
    'driven by a two-way <code>[(value)]</code> binding. ' +
    'Brain lives in <code>CngxFilterBuilderPresenter</code> (host directive); ' +
    'the component is a thin state-branch shell choosing between loading / error / empty / content branches.</p>' +
    '<p>Three logic operators ship: <code>and</code>, <code>or</code>, <code>xor</code>. ' +
    'The orthogonal <code>negated: boolean</code> modifier on every group is the sole negation surface — ' +
    '<code>negated: true</code> over <code>and</code> denotes <code>nand</code>; over <code>or</code> denotes <code>nor</code>.</p>' +
    '<p>Value editors swap via <code>CNGX_FILTER_EDITORS</code> (native string / number / date / boolean built in; ' +
    'consumers add custom editor types freely). Every visible region (add buttons, remove buttons, logic toggle, ' +
    'negation toggle, expression template, group template, loading / error / empty) is overrideable via a template slot.</p>',
  moduleImports: [
    "import { CngxFilterBuilder, createEmptyFilterRoot, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS, FILTER_BUILDER_SEED } from '../../../fixtures';",
  ],
  setup: `
  protected readonly fields = FILTER_BUILDER_FIELDS;
  protected readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  protected readonly seedTree = signal<FilterGroup>(FILTER_BUILDER_SEED);

  protected formatTree(t: FilterGroup): string {
    return JSON.stringify(t, null, 2);
  }

  protected resetTree(): void {
    this.tree.set(createEmptyFilterRoot());
  }
  `,
  sections: [
    {
      title: 'Basic — two-way binding + JSON inspection',
      subtitle:
        'Default editors (string/number/boolean/date). Type or click to add filters; ' +
        'the <code>[(value)]</code> tree is mirrored in the JSON panel below.',
      template: `
  <div class="demo-form">
    <cngx-filter-builder [fields]="fields" [(value)]="tree" />
    <div class="status-row">
      <button class="chip" (click)="resetTree()">Reset to empty</button>
    </div>
    <pre class="code-block"><code>{{ formatTree(tree()) }}</code></pre>
  </div>
      `,
      imports: ['CngxFilterBuilder'],
    },
    {
      title: 'Seeded tree — and+or composition',
      subtitle:
        'Pre-populated with two expressions joined by <code>and</code>. ' +
        'Add a nested group to compose <code>and / or</code> hierarchies.',
      template: `
  <div class="demo-form">
    <cngx-filter-builder [fields]="fields" [(value)]="seedTree" />
    <pre class="code-block"><code>{{ formatTree(seedTree()) }}</code></pre>
  </div>
      `,
      imports: ['CngxFilterBuilder'],
    },
  ],
};
