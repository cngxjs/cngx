import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: basic single level toggle',
  subtitle:
    'A two-parent tree with leaf children. With <code>[cascadeChildren]</code> off (the default), every node toggles on its own - selecting a parent does not pull in its children, and a parent with some children selected reports an indeterminate dash.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'signal-forms',
  apiComponents: ['CngxTreeSelect'],
  moduleImports: [
    "import { CngxTreeSelect } from '@cngx/forms/select';",
    "import type { CngxTreeNode } from '@cngx/utils';",
  ],
  imports: ['CngxTreeSelect'],
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
        { value: 'redis', label: 'Redis' },
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
    [initiallyExpanded]="'all'"
    [clearable]="true"
    placeholder="Pick technologies…"
  />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ values().join(', ') || '—' }}</span>
    </div>
  </div>`,
};
