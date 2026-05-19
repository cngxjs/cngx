import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'injectAsyncState — Reactive Query',
  subtitle: 'Auto-loads when signal dependencies change. Type in the filter — the query re-fires after 50ms debounce. Watch the status transitions: <code>loading → success</code> on first load, <code>refreshing → success</code> on filter change (old data stays visible).',
  description: 'Coordinates skeleton, content, empty, error, refresh, and toast from a single CngxAsyncState. Three factory functions, two template APIs, composable with other feedback atoms.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'error-handling', 'composition'],
  apiComponents: [
    'CngxAsyncContainer',
    'CngxAsync',
  ],
  moduleImports: [
    'import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncEmptyTpl } from \'@cngx/ui/feedback\';',
    'import { injectAsyncState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncEmptyTpl'],
  setup: `private readonly filterText = signal('');
  protected readonly filter = this.filterText.asReadonly();
  protected readonly people = injectAsyncState<string[]>(() => {
    const f = this.filter();
    return new Promise<string[]>(resolve => {
      setTimeout(() => {
        const all = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];
        resolve(f ? all.filter(n => n.toLowerCase().includes(f.toLowerCase())) : all);
      }, 1500);
    });
  });
  protected setFilter(value: string): void {
    this.filterText.set(value);
  }`,
  template: `
  <div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">
    <input placeholder="Filter people..." [value]="filter()"
      (input)="setFilter($any($event.target).value)"
      style="padding:8px 12px;border:1px solid var(--cngx-color-border,#ddd);border-radius:6px;width:240px" />
    <button (click)="people.refresh()" class="chip">Refresh</button>
  </div>

  <div class="event-grid" style="margin-bottom:12px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ people.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isFirstLoad</span>
      <span class="event-value">{{ people.isFirstLoad() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isRefreshing</span>
      <span class="event-value">{{ people.isRefreshing() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Filter</span>
      <span class="event-value">{{ filter() || '(none)' }}</span>
    </div>
  </div>

  <cngx-async-container [state]="people" ariaLabel="People"
    toastSuccess="People loaded" toastError="Failed to load">

    <ng-template cngxAsyncSkeleton>
      <div style="display:flex;flex-direction:column;gap:8px">
        @for (i of [1,2,3,4,5]; track i) {
          <div style="height:24px;background:var(--cngx-skeleton-bg,#e5e7eb);border-radius:4px"></div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">
        @for (name of data; track name) {
          <li style="padding:8px 12px;background:var(--cngx-card-bg,#f8fafc);border-radius:4px">{{ name }}</li>
        } @empty {
          <li style="padding:16px;color:var(--cngx-muted,#64748b);text-align:center">No matches for "{{ filter() }}"</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncEmpty>
      <div style="text-align:center;padding:24px;color:var(--cngx-muted,#64748b)">
        No matches for "{{ filter() }}"
      </div>
    </ng-template>
  </cngx-async-container>`,
};
