import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Builder — CngxFilter bridge',
  navLabel: 'Filter Builder Bridge',
  navCategory: 'filter-builder',
  description:
    'Wires <cngx-filter-builder> to CngxFilter and a CngxAsyncContainer-driven roster fetch. ' +
    'Every filter mutation re-fetches: skeleton on first load, refresh-bar on subsequent ' +
    'predicate changes — same UX as a real server-side filter.',
  apiComponents: ['CngxFilterBuilder', 'CngxFilter', 'CngxAsyncContainer'],
  overview:
    '<p>The presenter exposes <code>predicate: Signal&lt;((item: T) =&gt; boolean) | null&gt;</code> as a pure ' +
    'derivation of <code>tree()</code> and <code>fields()</code>. An <code>effect</code> reads it, pushes ' +
    'it into <code>CngxFilter.setPredicate</code> for the active-count badge, and triggers a ' +
    'simulated fetch against <code>dataState</code>: <code>refreshing</code> on subsequent loads, ' +
    '<code>loading</code> on the very first.</p>' +
    '<p>The table renders <em>only</em> from <code>dataState.data()</code> inside ' +
    '<code>cngxAsyncContent</code>. The skeleton / empty / error templates own the other ' +
    'branches. Result: every filter change drives the same UX as a refresh — visible ' +
    'feedback, deduped by a request token so superseded fetches drop their result.</p>' +
    '<p>The <code>untracked()</code> wraps in the effect prevent the dataState transitions ' +
    'from feeding back into the effect (the effect would otherwise subscribe to ' +
    '<code>dataState.data()</code> via the in-effect read and loop).</p>',
  moduleImports: [
    "import { CngxFilter, createManualState } from '@cngx/common/data';",
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncErrorTpl, CngxAsyncEmptyTpl } from '@cngx/ui/feedback';",
    "import { effect, untracked, viewChild } from '@angular/core';",
    "import { CngxFilterBuilder, CngxFilterBuilderPresenter, createEmptyFilterRoot, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS, FILTER_BUILDER_PEOPLE, type FilterBuilderPerson } from '../../../fixtures';",
  ],
  setup: `
  protected readonly fields = FILTER_BUILDER_FIELDS;
  protected readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  protected readonly dataState = createManualState<readonly FilterBuilderPerson[]>();
  protected readonly filterRef = viewChild(CngxFilter<FilterBuilderPerson>);
  protected readonly presenterRef = viewChild.required(CngxFilterBuilder, {
    read: CngxFilterBuilderPresenter,
  });

  private fetchToken = 0;
  private failNext = false;
  private lastPredicate: ((item: FilterBuilderPerson) => boolean) | null | undefined = undefined;

  constructor() {
    effect(() => {
      const fn = this.presenterRef().predicate() as ((item: FilterBuilderPerson) => boolean) | null;
      // filterRef tracked: the table re-mounts on every fetch and the new
      // CngxFilter instance needs setPredicate re-bound. lastPredicate dedupe
      // blocks the re-mount → fetch → re-mount loop.
      const filter = this.filterRef();
      untracked(() => {
        filter?.setPredicate(fn);
        if (fn !== this.lastPredicate) {
          this.lastPredicate = fn;
          this.fetchPeople(fn);
        }
      });
    });
  }

  private fetchPeople(predicate: ((item: FilterBuilderPerson) => boolean) | null): void {
    const myToken = ++this.fetchToken;
    // reset() flips isFirstLoad back to true so resolveAsyncView returns
    // 'skeleton', not the thin refresh-bar. Same UX every fetch.
    this.dataState.reset();
    this.dataState.set('loading');
    setTimeout(() => {
      if (myToken !== this.fetchToken) {
        return;
      }
      if (this.failNext) {
        this.failNext = false;
        this.dataState.setError(new Error('Roster fetch failed'));
        return;
      }
      const items = predicate ? FILTER_BUILDER_PEOPLE.filter(predicate) : FILTER_BUILDER_PEOPLE;
      this.dataState.setSuccess(items);
    }, 500);
  }

  protected refetch(): void {
    this.fetchPeople(this.presenterRef().predicate() as ((item: FilterBuilderPerson) => boolean) | null);
  }

  protected failNextFetch(): void {
    this.failNext = true;
    this.refetch();
  }
  `,
  sections: [
    {
      title: 'Builder + filtered table',
      subtitle:
        'Build a filter tree on the left; the table below filters in real time. ' +
        'Active filter count is read from <code>CngxFilter.activeCount()</code>.',
      template: `
  <div class="demo-form">
    <cngx-filter-builder [fields]="fields" [(value)]="tree" />

    <div class="demo-actions">
      <button type="button" (click)="refetch()">Refetch</button>
      <button type="button" (click)="failNextFetch()">Fail next</button>
    </div>

    <div class="status-row">
      <span class="status-badge">Active filters: {{ filterRef()?.activeCount() ?? 0 }}</span>
      <span class="status-badge">Status: {{ dataState.status() }}</span>
      <span class="status-badge">Showing: {{ (dataState.data() ?? []).length }}</span>
    </div>

    <cngx-async-container [state]="dataState" ariaLabel="Roster">
      <ng-template cngxAsyncSkeleton>
        <div class="demo-skeleton">
          <div class="demo-skeleton-row"></div>
          <div class="demo-skeleton-row"></div>
          <div class="demo-skeleton-row"></div>
          <div class="demo-skeleton-row"></div>
        </div>
      </ng-template>

      <ng-template cngxAsyncEmpty>
        <p class="demo-empty">No rows match the current filters.</p>
      </ng-template>

      <ng-template cngxAsyncContent let-rows>
        <table class="demo-table" [cngxFilter]="null">
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
              <th>Active</th>
              <th>Role</th>
              <th>Birthday</th>
            </tr>
          </thead>
          <tbody>
            @for (p of rows; track p.name) {
              <tr>
                <td>{{ p.name }}</td>
                <td>{{ p.age }}</td>
                <td>{{ p.active ? 'yes' : 'no' }}</td>
                <td>{{ p.role }}</td>
                <td>{{ p.birthday }}</td>
              </tr>
            }
          </tbody>
        </table>
      </ng-template>

      <ng-template cngxAsyncError let-err>
        <div role="alert" class="demo-error">
          <strong>Roster load failed:</strong> {{ (err)?.message ?? 'unknown error' }}
        </div>
      </ng-template>
    </cngx-async-container>
  </div>
      `,
      imports: [
        'CngxFilterBuilder',
        'CngxFilter',
        'CngxAsyncContainer',
        'CngxAsyncSkeletonTpl',
        'CngxAsyncContentTpl',
        'CngxAsyncEmptyTpl',
        'CngxAsyncErrorTpl',
      ],
      css: `
.demo-actions { display: flex; gap: 8px; margin: 12px 0; }
.demo-actions button { padding: 4px 10px; cursor: pointer; }
.demo-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.875rem; }
.demo-table th, .demo-table td { padding: 6px 10px; border-bottom: 1px solid var(--cngx-border, #ddd); text-align: left; }
.demo-table th { background: var(--cngx-surface-variant, #f5f5f5); font-weight: 600; }
.demo-skeleton { display: flex; flex-direction: column; gap: 8px; padding: 8px 0; }
.demo-skeleton-row {
  height: 24px;
  background: var(--cngx-skeleton-bg, #e0e0e0);
  border-radius: 4px;
  opacity: 0.6;
}
.demo-empty { color: var(--cngx-fg-muted, #666); font-style: italic; padding: 12px 0; }
.demo-error {
  color: var(--cngx-error, #b00020);
  padding: 8px 12px;
  border: 1px solid currentColor;
  border-radius: 4px;
  background: rgba(176, 0, 32, 0.05);
}
      `,
    },
  ],
};
