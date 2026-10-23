import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: chip display parents, leaves or all',
  subtitle:
    "<code>[chipDisplay]</code> decides which selected nodes become trigger chips. <code>'parents'</code> shows one chip for a fully selected subtree, <code>'leaves'</code> shows the descendants instead of their parent, <code>'all'</code> shows every selected value. The strip stays on one line and folds the rest into a <code>+N</code> chip after <code>[maxVisibleChips]</code>.",
  description:
    "Without the input the tree resolves <code>'parents'</code> when <code>[cascadeChildren]</code> is on and <code>'all'</code> otherwise. A parent counts as fully selected when its own value and every enabled descendant are selected. Removing a summarizing parent chip deselects its subtree in one <code>cascade-toggle</code> commit; every other chip deselects its one value. The <code>+N</code> chip is <code>aria-hidden</code>; while values are hidden the trigger carries the whole displayed selection in a visually hidden summary, so a screen reader hears every chip. Frontend starts fully selected and Backend partly, so each mode shows a different strip.",
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxTreeSelect'],
  moduleImports: [
    "import { CngxTreeSelect, type CngxTreeSelectChipDisplay } from '@cngx/forms/select';",
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
  protected readonly values = signal<string[]>(['frontend', 'angular', 'signals', 'rxjs', 'node']);
  protected readonly nodeId = (value: string) => value;
  protected readonly chipDisplay = signal<CngxTreeSelectChipDisplay>('parents');`,
  template: `  <cngx-tree-select
    [label]="'Tech stack'"
    [nodes]="nodes"
    [(values)]="values"
    [nodeIdFn]="nodeId"
    [cascadeChildren]="true"
    [chipDisplay]="chipDisplay()"
    [maxVisibleChips]="3"
    [initiallyExpanded]="'all'"
    [clearable]="true"
    placeholder="Pick technologies"
  />`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <label>
      <input type="radio" name="tree-chip-display" value="parents"
        [checked]="chipDisplay() === 'parents'" (change)="chipDisplay.set('parents')" />
      parents
    </label>
    <label>
      <input type="radio" name="tree-chip-display" value="leaves"
        [checked]="chipDisplay() === 'leaves'" (change)="chipDisplay.set('leaves')" />
      leaves
    </label>
    <label>
      <input type="radio" name="tree-chip-display" value="all"
        [checked]="chipDisplay() === 'all'" (change)="chipDisplay.set('all')" />
      all
    </label>
  </div>
  <div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ values().join(', ') || 'none' }}</span>
    </div>
  </div>`,
};
