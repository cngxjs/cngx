import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Builder — CngxFilter bridge',
  navLabel: 'Filter Builder Bridge',
  navCategory: 'filter-builder',
  description:
    'Wires <cngx-filter-builder> to CngxFilter via the presenter\'s predicate signal. ' +
    'Every change to the builder tree updates the filtered table below.',
  apiComponents: ['CngxFilterBuilder', 'CngxFilter'],
  overview:
    '<p>The presenter exposes <code>predicate: Signal&lt;((item: T) =&gt; boolean) | null&gt;</code> as a pure ' +
    'derivation of <code>tree()</code> and <code>fields()</code>. Consumers read it directly — no manual ' +
    'call to <code>toFilterPredicate()</code>, no per-mutation bridge wiring.</p>' +
    '<p>An <code>effect</code> reads <code>presenter.predicate()</code> and pushes the function into ' +
    '<code>CngxFilter.setPredicate</code>. The <code>untracked()</code> wrap on the call is required: ' +
    '<code>setPredicate</code> reads <code>CngxFilter</code>\'s internal predicates signal before writing it, ' +
    'so without <code>untracked()</code> the effect subscribes to that read and loops on every write.</p>' +
    '<p>The filtered list is a plain <code>computed</code> that reads the source items and the ' +
    '<code>filter.predicate()</code> signal.</p>',
  moduleImports: [
    "import { CngxFilter, createManualState } from '@cngx/common/data';",
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncErrorTpl, CngxAsyncEmptyTpl } from '@cngx/ui/feedback';",
    "import { effect, untracked, viewChild, computed } from '@angular/core';",
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

  protected readonly filtered = computed<readonly FilterBuilderPerson[]>(() => {
    const items = this.dataState.data() ?? [];
    const fn = this.filterRef()?.predicate() ?? null;
    return fn ? items.filter(fn) : items;
  });

  constructor() {
    this.dataState.setSuccess(FILTER_BUILDER_PEOPLE);
    effect(() => {
      const filter = this.filterRef();
      if (!filter) {
        return;
      }
      const fn = this.presenterRef().predicate();
      untracked(() => filter.setPredicate(fn as ((item: FilterBuilderPerson) => boolean) | null));
    });
  }

  protected loadData(): void {
    this.dataState.set('loading');
    setTimeout(() => this.dataState.setSuccess(FILTER_BUILDER_PEOPLE), 500);
  }

  protected refreshData(): void {
    this.dataState.set('refreshing');
    setTimeout(() => this.dataState.setSuccess(FILTER_BUILDER_PEOPLE), 500);
  }

  protected failData(): void {
    this.dataState.set('loading');
    setTimeout(() => this.dataState.setError(new Error('Roster fetch failed')), 400);
  }

  protected emptyData(): void {
    this.dataState.setSuccess([]);
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
      <button type="button" (click)="refreshData()">Refresh</button>
      <button type="button" (click)="loadData()">Reload</button>
      <button type="button" (click)="failData()">Fail</button>
      <button type="button" (click)="emptyData()">Empty</button>
    </div>

    <div class="status-row">
      <span class="status-badge">Active filters: {{ filterRef()?.activeCount() ?? 0 }}</span>
      <span class="status-badge">Showing: {{ filtered().length }} / {{ (dataState.data() ?? []).length }}</span>
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
        <p class="demo-empty">No people in the roster.</p>
      </ng-template>

      <ng-template cngxAsyncContent>
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
            @for (p of filtered(); track p.name) {
              <tr>
                <td>{{ p.name }}</td>
                <td>{{ p.age }}</td>
                <td>{{ p.active ? 'yes' : 'no' }}</td>
                <td>{{ p.role }}</td>
                <td>{{ p.birthday }}</td>
              </tr>
            } @empty {
              <tr><td colspan="5">No rows match the current filters.</td></tr>
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
