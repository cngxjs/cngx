import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Controlled expansion',
  subtitle:
    'Both state sets are <code>model()</code> inputs: bind <code>[(expandedIds)]</code> and <code>[(selectedIds)]</code> to own them from outside. Type the signals as <code>signal&lt;ReadonlySet&lt;string&gt;&gt;</code> - the models are declared over <code>ReadonlySet</code>, so a <code>signal&lt;Set&lt;string&gt;&gt;</code> two-way binding fails under <code>strictTemplates</code>.',
  description:
    'Default ids are the node path indices joined by "-" ("0", "0-1"). A pre-bound non-empty set suppresses the default fully-expanded seeding, and ids that vanish after a tree swap are pruned automatically so they never re-attach to different nodes.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxTreetable'],
  moduleImports: [
    "import { CngxTreetable, flattenTree } from '@cngx/data-display/treetable';",
    "import { ORG_TREE } from '../../../../fixtures';",
  ],
  imports: ['CngxTreetable'],
  setup: `protected readonly orgTree = ORG_TREE;
  // ReadonlySet matches the model<ReadonlySet<string>> inputs; a
  // signal<Set<string>> two-way binding fails under strictTemplates.
  protected readonly expandedIds = signal<ReadonlySet<string>>(new Set(['0', '0-0']));
  protected readonly selectedIds = signal<ReadonlySet<string>>(new Set());`,
  setupChrome: `private readonly parentIds = flattenTree(ORG_TREE)
    .filter((n) => n.hasChildren)
    .map((n) => n.id);
  protected readonly expandedList = computed(() => [...this.expandedIds()].join(', ') || '-');

  protected handleExpandAll(): void {
    this.expandedIds.set(new Set(this.parentIds));
  }

  protected handleCollapseAll(): void {
    this.expandedIds.set(new Set());
  }`,
  template: `  <cngx-treetable
    [tree]="orgTree"
    selectionMode="multi"
    [(expandedIds)]="expandedIds"
    [(selectedIds)]="selectedIds"
  />`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="handleExpandAll()">Expand all</button>
    <button type="button" class="chip" (click)="handleCollapseAll()">Collapse all</button>
  </div>
<div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">Expanded ids</span>
      <span class="event-value">{{ expandedList() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Selected ids</span>
      <span class="event-value">{{ selectedIds().size }}</span>
    </div>
  </div>`,
};
