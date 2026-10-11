import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Header context labels',
  subtitle:
    'A <code>*cngxHeader</code> template receives <code>column</code> and the resolved <code>label</code>, so it can restyle a header without repeating the copy that <code>columnLabels</code> already translates.',
  description:
    'The header text resolves from the <code>columnLabels</code> entry, set here through <code>withTreetableLabels</code>. A column with neither a label nor a header template shows its key in a dev build and warns once; production renders the <code>unlabeledColumn</code> text (<code>Column {position}</code> in English) instead of the key. <code>withTreetableTemplates({ header })</code> registers one header template for every column at a component or route scope.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition'],
  apiComponents: ['CngxTreetable', 'CngxHeaderTpl'],
  moduleImports: [
    "import { CngxTreetable, CngxHeaderTpl, provideTreetableAt, withTreetableLabels } from '@cngx/data-display/treetable';",
    "import { ORG_TREE } from '../../../../fixtures';",
  ],
  imports: ['CngxTreetable', 'CngxHeaderTpl'],
  viewProviders: [
    "...provideTreetableAt(withTreetableLabels({ columnLabels: { name: 'Employee', role: 'Position', location: 'Office' } }))",
  ],
  setup: `protected readonly orgTree = ORG_TREE;`,
  template: `<cngx-treetable [tree]="orgTree">
  <ng-template [cngxHeader]="'name'" let-label="label" let-column="column">
    <span [attr.data-column]="column">{{ label }}</span>
  </ng-template>
  <ng-template [cngxHeader]="'role'" let-label="label" let-column="column">
    <span [attr.data-column]="column">{{ label }}</span>
  </ng-template>
  <ng-template [cngxHeader]="'location'" let-label="label" let-column="column">
    <span [attr.data-column]="column">{{ label }}</span>
  </ng-template>
</cngx-treetable>`,
};
