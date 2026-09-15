import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Custom cell and empty',
  subtitle:
    'An <code>&lt;ng-template [cngxCell]="\'role\'"&gt;</code> replaces the body cell of one column, matched by key. The context carries the full <code>FlatNode</code> as <code>$implicit</code> (<code>let-node</code>) plus the resolved cell <code>value</code> - there is no column key in the context. <code>&lt;ng-template cngxEmpty&gt;</code> replaces the built-in empty surface when the tree resolves to no rows.',
  description:
    'Columns derive from the primitive keys of the first node value; cells without a template render the raw value. The role cell renders a <code>&lt;cngx-tag&gt;</code> whose color is derived from the node data instead of hand-written pill CSS.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxTreetable', 'CngxCellTpl', 'CngxEmptyTpl'],
  moduleImports: [
    "import { CngxTreetable, CngxCellTpl, CngxEmptyTpl, type FlatNode, type Node } from '@cngx/data-display/treetable';",
    "import { CngxTag, type CngxTagColor } from '@cngx/common/display';",
    "import { ORG_TREE, type Employee } from '../../../../fixtures';",
  ],
  imports: ['CngxTreetable', 'CngxCellTpl', 'CngxEmptyTpl', 'CngxTag'],
  setup: `protected readonly tree = signal<Node<Employee>[]>([ORG_TREE]);

  protected tagColor(node: FlatNode<Employee>): CngxTagColor {
    if (node.depth === 0) {
      return 'info';
    }
    return node.hasChildren ? 'success' : 'neutral';
  }`,
  setupChrome: `protected handleEmptyToggle(empty: boolean): void {
    this.tree.set(empty ? [] : [ORG_TREE]);
  }`,
  template: `  <cngx-treetable [tree]="tree()">
    <ng-template [cngxCell]="'name'" let-node>
      <strong>{{ node.value.name }}</strong>
    </ng-template>
    <ng-template [cngxCell]="'role'" let-node let-value="value">
      <cngx-tag [color]="tagColor(node)" variant="subtle" size="sm">{{ value }}</cngx-tag>
    </ng-template>
    <ng-template cngxEmpty>
      <p>No employees found.</p>
    </ng-template>
  </cngx-treetable>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="checkbox" (change)="handleEmptyToggle($any($event.target).checked)" />
      Empty tree
    </label>
  </div>`,
};
