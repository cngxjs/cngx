import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: dismiss on outside click only via withDismissOn',
  subtitle:
    "<code>provideSelectConfigAt(withDismissOn('outside'))</code> narrows the dismiss gesture for the subtree to an outside click: Escape no longer closes the panel, so a keyboard user keeps browsing the tree until they click away. A per-instance input still wins.",
  description:
    'Open the panel and press Escape - it stays open. Click anywhere outside the panel and it closes. Useful when Escape should clear a search inside the panel rather than dismiss the whole thing.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  framework: 'template-only',
  apiComponents: ['CngxTreeSelect'],
  moduleImports: [
    "import { CngxTreeSelect, provideSelectConfigAt, withDismissOn } from '@cngx/forms/select';",
    "import type { CngxTreeNode } from '@cngx/utils';",
  ],
  imports: ['CngxTreeSelect'],
  viewProviders: ["...provideSelectConfigAt(withDismissOn('outside'))"],
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
  protected readonly nodeId = (value: string) => value;
  protected readonly open = signal(false);`,
  templateChromeBefore: `<p class="demo-hint">Open the panel, press Escape (stays open), then click outside (closes).</p>`,
  template: `<cngx-tree-select
  [label]="'Tech stack'"
  [nodes]="nodes"
  [(values)]="values"
  [nodeIdFn]="nodeId"
  [initiallyExpanded]="'all'"
  (openedChange)="open.set($event)"
  placeholder="Pick technologies…"
/>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Panel</span><span class="event-value">{{ open() ? 'open' : 'closed' }}</span></div>
    <div class="event-row"><span class="event-label">values</span><span class="event-value">{{ values().join(', ') || '-' }}</span></div>
  </div>`,
};
