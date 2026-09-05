import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreeSelect: type to find expand to reveal',
  subtitle:
    'The APG type-ahead baseline only walks the visible nodes - a match under a collapsed ancestor stays unreachable. With <code>[expandToReveal]</code> the panel resolves the miss against the full tree: the first matching node gets its ancestors expanded and the highlight lands on it, VS-Code style. Off (the default), typing never mutates expansion state.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  framework: 'signal-forms',
  apiComponents: ['CngxTreeSelect'],
  references: [
    {
      label: 'WAI-ARIA APG: Tree View pattern (type-ahead)',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/treeview/',
    },
    {
      label: 'WAI-ARIA 1.2: treeitem + aria-checked',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#treeitem',
    },
  ],
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
    {
      value: 'tooling',
      label: 'Tooling',
      children: [
        { value: 'vite', label: 'Vite' },
        { value: 'webpack', label: 'Webpack' },
      ],
    },
  ];
  protected readonly values = signal<string[]>([]);
  protected readonly reveal = signal(true);
  protected readonly nodeId = (value: string) => value;`,
  template: `  <cngx-tree-select
    [label]="'Tech stack'"
    [nodes]="nodes"
    [(values)]="values"
    [nodeIdFn]="nodeId"
    [expandToReveal]="reveal()"
    placeholder="Pick technologies…"
  />`,
  templateChromeBefore: `<p class="hint-row" style="margin:0 0 12px">
    All branches start collapsed. Open the panel and type <kbd>p</kbd> - the only
    match (Postgres) sits under the collapsed Backend branch. With the toggle on,
    Backend expands and the highlight moves onto Postgres; with it off, nothing
    happens.
  </p>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <label style="display:inline-flex;align-items:center;gap:6px">
        <input type="checkbox" [checked]="reveal()" (change)="reveal.set(!reveal())" />
        expandToReveal
      </label>
    </div>
    <div class="event-row">
      <span class="event-label">values</span>
      <span class="event-value">{{ values().join(', ') || '-' }}</span>
    </div>
  </div>`,
};
