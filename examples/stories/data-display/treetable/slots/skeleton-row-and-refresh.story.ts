import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: skeleton row and refresh',
  subtitle:
    'Project <code>*cngxSkeletonRow</code> to replace each placeholder row of the first load and <code>*cngxRefresh</code> to replace the "Refreshing" text shown below the grid while rows stay on screen. "First load" and "Refresh" drive the bound state; untick "Use custom slot templates" to compare with the built-in skeleton and text.',
  description:
    "The skeleton template repeats <code>[skeletonRowCount]</code> times (3 by default, 4 here) and receives <code>{ $implicit: index, rowCount }</code>; the refresh template has no context. Both regions are <code>aria-hidden</code>: <code>aria-busy</code> on the host and the treetable's polite live region carry the loading and refreshing announcements, so keep both templates visual-only. The selector is <code>cngxSkeletonRow</code>, not <code>cngxSkeleton</code>, so it never collides with the <code>[cngxSkeleton]</code> layout atom.",
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxTreetable', 'CngxSkeletonRowTpl', 'CngxRefreshTpl'],
  moduleImports: [
    "import { CngxRefreshTpl, CngxSkeletonRowTpl, CngxTreetable, provideTreetableAt, withTreetableLabels, type Node } from '@cngx/data-display/treetable';",
    "import { createManualState } from '@cngx/common/data';",
    "import { ORG_TREE, type Employee } from '../../../../fixtures';",
  ],
  imports: ['CngxTreetable', 'CngxSkeletonRowTpl', 'CngxRefreshTpl'],
  viewProviders: [
    "...provideTreetableAt(withTreetableLabels({ columnLabels: { name: 'Name', role: 'Role', location: 'Location' } }))",
  ],
  setup: `protected readonly loadState = createManualState<Node<Employee>[]>();
  protected readonly tree = computed(() => this.loadState.data() ?? []);
  protected readonly customSlots = signal(true);

  constructor() {
    this.firstLoad();
  }

  protected firstLoad(): void {
    this.loadState.reset();
    this.loadState.set('loading');
    setTimeout(() => this.loadState.setSuccess([ORG_TREE]), 1500);
  }

  protected refresh(): void {
    this.loadState.set('refreshing');
    setTimeout(() => this.loadState.setSuccess([ORG_TREE]), 1500);
  }`,
  template: `  <cngx-treetable [tree]="tree()" [state]="loadState" [skeletonRowCount]="4">
    @if (customSlots()) {
      <ng-template cngxSkeletonRow let-index let-rowCount="rowCount">
        <div class="demo-treetable-skeleton" [style.opacity]="1 - index / rowCount">
          <span class="demo-treetable-skeleton__index">{{ index + 1 }}/{{ rowCount }}</span>
          <span class="demo-treetable-skeleton__bar"></span>
        </div>
      </ng-template>
      <ng-template cngxRefresh>
        <span class="demo-treetable-refresh">Syncing the org chart</span>
      </ng-template>
    }
  </cngx-treetable>`,
  templateChromeBefore: `<div class="button-row" style="margin-bottom:12px">
    <button type="button" class="chip" (click)="firstLoad()">First load</button>
    <button type="button" class="chip" (click)="refresh()">Refresh</button>
    <label>
      <input
        type="checkbox"
        [checked]="customSlots()"
        (change)="customSlots.set($any($event.target).checked)"
      />
      Use custom slot templates
    </label>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ loadState.status() }}</span>
    </div>
  </div>`,
};
