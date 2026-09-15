import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Async state lifecycle',
  subtitle:
    'Bind <code>[state]</code> to any <code>CngxAsyncState</code> source and the grid resolves its own view: skeleton rows on first load, content on success, a refresh indicator over rows that stay on screen, the <code>*cngxError</code> surface on failure and <code>*cngxEmpty</code> after a load that produced nothing. The error template context carries the raw error as <code>$implicit</code> plus a <code>retry</code> callback that emits the <code>(retry)</code> output.',
  description:
    'The treetable never loads anything itself: the consumer owns the data flow (<code>createManualState</code> here, <code>injectAsyncState</code> over HTTP in production) and restarts it on <code>(retry)</code>. A bound state still in <code>idle</code> renders nothing, so start the load when binding. <code>aria-busy</code> mirrors the busy window and view transitions reach AT through a polite live region. A failure after a successful load keeps the rows on screen (content + error); the full error surface only replaces the grid when there is nothing to show.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling'],
  apiComponents: ['CngxTreetable', 'CngxErrorTpl', 'CngxEmptyTpl'],
  moduleImports: [
    "import { CngxTreetable, CngxEmptyTpl, CngxErrorTpl, type Node } from '@cngx/data-display/treetable';",
    "import { createManualState } from '@cngx/common/data';",
    "import { ORG_TREE, type Employee } from '../../../../fixtures';",
  ],
  imports: ['CngxTreetable', 'CngxEmptyTpl', 'CngxErrorTpl'],
  setup: `protected readonly loadState = createManualState<Node<Employee>[]>();
  protected readonly tree = computed(() => this.loadState.data() ?? []);
  protected readonly failNextLoad = signal(false);

  constructor() {
    this.reload();
  }

  protected reload(): void {
    this.loadState.set(this.loadState.isFirstLoad() ? 'loading' : 'refreshing');
    setTimeout(() => {
      if (this.failNextLoad()) {
        this.failNextLoad.set(false);
        this.loadState.setError(new Error('Org service unavailable'));
        return;
      }
      this.loadState.setSuccess([ORG_TREE]);
    }, 900);
  }`,
  setupChrome: `protected handleLoadEmpty(): void {
    this.loadState.set(this.loadState.isFirstLoad() ? 'loading' : 'refreshing');
    setTimeout(() => this.loadState.setSuccess([]), 600);
  }`,
  template: `  <cngx-treetable [tree]="tree()" [state]="loadState" (retry)="reload()">
    <ng-template cngxError let-error let-retry="retry">
      <p>Load failed: {{ $any(error).message }}</p>
      <button type="button" class="chip" (click)="retry()">Retry</button>
    </ng-template>
    <ng-template cngxEmpty>
      <p>No employees loaded.</p>
    </ng-template>
  </cngx-treetable>`,
  templateChrome: `<div class="button-row" style="margin-top:12px">
    <button type="button" class="chip" (click)="reload()">Reload</button>
    <button type="button" class="chip" (click)="handleLoadEmpty()">Load empty</button>
    <label style="margin-left:1rem">
      <input
        type="checkbox"
        [checked]="failNextLoad()"
        (change)="failNextLoad.set($any($event.target).checked)"
      />
      Fail next load
    </label>
  </div>
<div class="event-grid" style="margin-top:8px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ loadState.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">First load</span>
      <span class="event-value">{{ loadState.isFirstLoad() ? 'yes' : 'no' }}</span>
    </div>
  </div>`,
};
