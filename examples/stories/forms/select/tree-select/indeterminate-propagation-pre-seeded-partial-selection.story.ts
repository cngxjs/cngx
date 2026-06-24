import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: indeterminate propagation pre seeded partial selection',
  subtitle:
    'Seeded with a single child of Frontend, the parent renders an indeterminate dash rather than a check - some, but not all, descendants are selected. Toggling the parent (cascade on) resolves the dash to fully selected, then fully cleared.',
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
  // One child of Frontend pre-selected -> Frontend renders indeterminate.
  protected readonly values = signal<string[]>(['angular']);
  protected readonly nodeId = (value: string) => value;`,
  template: `  <cngx-tree-select
    [label]="'Tech stack'"
    [nodes]="nodes"
    [(values)]="values"
    [nodeIdFn]="nodeId"
    [cascadeChildren]="true"
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
