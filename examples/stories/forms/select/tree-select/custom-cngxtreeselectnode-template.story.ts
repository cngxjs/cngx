import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: custom cngxtreeselectnode template',
  subtitle:
    'A projected <code>*cngxTreeSelectNode</code> replaces the built-in row while the panel keeps its <code>role="treeitem"</code> wrapper and ARIA wiring. The context exposes every reactive flag plus the <code>toggleExpand</code> and <code>handleSelect</code> callbacks so custom markup still routes through cascade, commit, and announce.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxTreeSelect', 'CngxTreeSelectNode'],
  moduleImports: [
    "import { CngxTreeSelect, CngxTreeSelectNode } from '@cngx/forms/select';",
    "import { CngxCheckboxIndicator } from '@cngx/common/display';",
    "import type { CngxTreeNode } from '@cngx/utils';",
  ],
  imports: ['CngxTreeSelect', 'CngxTreeSelectNode', 'CngxCheckboxIndicator'],
  setup: `protected readonly nodes: CngxTreeNode<string>[] = [
    {
      value: 'frontend',
      label: 'Frontend',
      children: [
        { value: 'angular', label: 'Angular' },
        { value: 'signals', label: 'Signals' },
        { value: 'rxjs', label: 'RxJS' },
      ],
    },
    {
      value: 'backend',
      label: 'Backend',
      children: [
        { value: 'node', label: 'Node' },
        { value: 'postgres', label: 'Postgres' },
      ],
    },
  ];
  protected readonly values = signal<string[]>([]);
  protected readonly nodeId = (value: string) => value;`,
  template: `  <cngx-tree-select
    [label]="'Tech stack'"
    [nodes]="nodes"
    [(values)]="values"
    [nodeIdFn]="nodeId"
    [cascadeChildren]="true"
    [initiallyExpanded]="'all'"
    placeholder="Pick technologies…"
  >
    <ng-template
      cngxTreeSelectNode
      let-node
      let-selected="selected"
      let-indeterminate="indeterminate"
      let-expanded="expanded"
      let-hasChildren="hasChildren"
      let-toggleExpand="toggleExpand"
      let-handleSelect="handleSelect"
    >
      <span
        class="tree-node-row"
        [style.padding-left]="node.depth + 'rem'"
        (click)="handleSelect()"
      >
        @if (hasChildren) {
          <button
            type="button"
            tabindex="-1"
            class="tree-node-twisty"
            [attr.aria-label]="expanded ? 'Collapse' : 'Expand'"
            (click)="toggleExpand(); $event.stopPropagation()"
          >
            {{ expanded ? '▾' : '▸' }}
          </button>
        }
        <cngx-checkbox-indicator [checked]="selected" [indeterminate]="indeterminate" />
        <span class="tree-node-label">{{ node.label }}</span>
      </span>
    </ng-template>
  </cngx-tree-select>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ values().join(', ') || '—' }}</span>
    </div>
  </div>`,
};
