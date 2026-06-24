import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: 10 000 nodes perf smoke',
  subtitle:
    'A 100 x 100 tree (100 parents, 100 children each) built in setup. With <code>[initiallyExpanded]="\'none\'"</code> only the collapsed roots render up front. A render and scroll smoke test - open the panel, expand a branch, and confirm it stays responsive.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxTreeSelect'],
  moduleImports: [
    "import { CngxTreeSelect } from '@cngx/forms/select';",
    "import type { CngxTreeNode } from '@cngx/utils';",
  ],
  imports: ['CngxTreeSelect'],
  setup: `protected readonly nodes: CngxTreeNode<string>[] = Array.from({ length: 100 }, (_, p) => ({
    value: 'p' + p,
    label: 'Group ' + p,
    children: Array.from({ length: 100 }, (_, c) => ({
      value: 'p' + p + '-c' + c,
      label: 'Item ' + p + '.' + c,
    })),
  }));
  protected readonly values = signal<string[]>([]);
  protected readonly nodeId = (value: string) => value;`,
  template: `  <cngx-tree-select
    [label]="'Large tree'"
    [nodes]="nodes"
    [(values)]="values"
    [nodeIdFn]="nodeId"
    [initiallyExpanded]="'none'"
    [clearable]="true"
    placeholder="Open to browse 10 000 nodes…"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">selected count</span>
      <span class="event-value">{{ values().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ values().slice(0, 6).join(', ') || '—' }}{{ values().length > 6 ? ', …' : '' }}</span>
    </div>
  </div>`,
};
