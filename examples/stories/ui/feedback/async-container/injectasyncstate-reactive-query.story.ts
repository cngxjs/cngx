import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncContainer: injectAsyncState reactive query',
  subtitle: 'Auto-loads when signal dependencies change. Type in the filter - the query re-fires after 50ms debounce. Watch the status transitions: <code>loading</code> to <code>success</code> on first load, <code>refreshing</code> to <code>success</code> on filter change (old data stays visible).',
  description: 'Read-path factory variant: <code>injectAsyncState()</code> reacts to signal reads inside the loader. Typing in the filter input transitions through <code>refreshing</code> while keeping previously-loaded data on screen, so the UI never blanks.',
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
  template: `  <div class="demo-row-center" style="margin-bottom:16px">
    <label for="people-filter" class="cngx-sr-only">Filter people</label>
    <input id="people-filter" class="demo-async-input" placeholder="Filter people..." [value]="filter()"
      (input)="setFilter($any($event.target).value)" />
    <button (click)="people.refresh()" class="chip" type="button">Refresh</button>
  </div>

  <cngx-async-container [state]="people" ariaLabel="People"
    toastSuccess="People loaded" toastError="Failed to load">

    <ng-template cngxAsyncSkeleton>
      <div class="demo-stack--tight" style="display:flex;flex-direction:column">
        @for (i of [1,2,3,4,5]; track i) {
          <div class="demo-skeleton-bar" style="height:24px"></div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul class="demo-stack" style="list-style:none;padding:0;margin:0;gap:4px">
        @for (name of data; track name) {
          <li class="demo-card-tile">{{ name }}</li>
        } @empty {
          <li class="demo-filter-empty">No matches for "{{ filter() }}"</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncEmpty>
      <div class="demo-empty-state-block">
        No matches for "{{ filter() }}"
      </div>
    </ng-template>
  </cngx-async-container>`,
  templateChrome: `<div class="event-grid" style="margin-bottom:12px">
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
  </div>`,
};
