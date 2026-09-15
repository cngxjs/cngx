import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Single select',
  subtitle:
    '<code>[tree]</code> takes a <code>Node&lt;T&gt;</code> root (or an array of roots); the grid flattens it, seeds a fully expanded state, and manages expand/collapse itself. <code>selectionMode="single"</code> holds at most one selected row. <code>(nodeClicked)</code> fires the full <code>FlatNode</code> on every row activation, mouse or keyboard.',
  description:
    'Headless tree table built on Angular CDK Table: an unstyled treegrid with expand/collapse, row selection, keyboard navigation and async-state integration. All visual styling resolves through CSS custom properties.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
  apiComponents: ['CngxTreetable'],
  moduleImports: [
    "import { CngxTreetable, type FlatNode } from '@cngx/data-display/treetable';",
    "import { ORG_TREE, type Employee } from '../../../../fixtures';",
  ],
  imports: ['CngxTreetable'],
  setup: `protected readonly orgTree = ORG_TREE;
  protected readonly lastClicked = signal<string | undefined>(undefined);

  protected handleNodeClick(node: FlatNode<Employee>): void {
    this.lastClicked.set(node.value.name);
  }`,
  template: `  <cngx-treetable
    #tt
    [tree]="orgTree"
    selectionMode="single"
    (nodeClicked)="handleNodeClick($event)"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Last clicked</span>
      <span class="event-value">{{ lastClicked() ?? '-' }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Selected ids</span>
      <span class="event-value">{{ tt.selectedIds().size }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Expanded ids</span>
      <span class="event-value">{{ tt.expandedIds().size }}</span>
    </div>
  </div>`,
};
