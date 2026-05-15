import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Row — standalone',
  navLabel: 'Filter Row',
  navCategory: 'filter-builder',
  description:
    'Per-column <cngx-filter-row> headers wired into a CngxAsyncContainer-driven roster fetch. ' +
    'Every column-filter mutation re-fetches: skeleton on first load, refresh-bar on subsequent ' +
    'predicate changes — same UX as a server-side table filter.',
  apiComponents: ['CngxFilterRow', 'CngxAsyncContainer'],
  overview:
    '<p><code>CngxFilterRow</code> is the dedicated single-row surface for column-header / ' +
    'quick-filter contexts. Each row owns one <code>FilterExpression | null</code> via ' +
    '<code>[(value)]</code>; an <code>effect</code> reads both row signals, derives a single ' +
    '<code>FilterGroup</code>, and triggers a simulated fetch on every mutation.</p>' +
    '<p>The roster lives in <code>dataState.data()</code> and renders <em>only</em> from inside ' +
    '<code>cngxAsyncContent</code>. The skeleton, empty, and error templates own the other ' +
    'branches. A request token dedupes superseded fetches when the user types fast.</p>',
  moduleImports: [
    "import { computed, effect, untracked } from '@angular/core';",
    "import { createManualState } from '@cngx/common/data';",
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncEmptyTpl, CngxAsyncErrorTpl } from '@cngx/ui/feedback';",
    "import { CngxFilterRow, createFilterGroup, toFilterPredicate, type FilterExpression } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS, FILTER_BUILDER_PEOPLE, type FilterBuilderPerson } from '../../../fixtures';",
  ],
  setup: `
  protected readonly fields = FILTER_BUILDER_FIELDS;
  protected readonly nameField = FILTER_BUILDER_FIELDS.find((f) => f.key === 'name')!;
  protected readonly roleField = FILTER_BUILDER_FIELDS.find((f) => f.key === 'role')!;
  protected readonly nameFilter = signal<FilterExpression | null>(null);
  protected readonly roleFilter = signal<FilterExpression | null>(null);
  protected readonly dataState = createManualState<readonly FilterBuilderPerson[]>();

  protected readonly predicate = computed<((item: FilterBuilderPerson) => boolean) | null>(() => {
    const filters: FilterExpression[] = [];
    const n = this.nameFilter();
    const r = this.roleFilter();
    if (n) filters.push(n);
    if (r) filters.push(r);
    if (filters.length === 0) {
      return null;
    }
    return toFilterPredicate(createFilterGroup('and', filters), this.fields);
  });

  private fetchToken = 0;
  private failNext = false;

  constructor() {
    effect(() => {
      const fn = this.predicate();
      untracked(() => this.fetchPeople(fn));
    });
  }

  private fetchPeople(predicate: ((item: FilterBuilderPerson) => boolean) | null): void {
    const myToken = ++this.fetchToken;
    // reset() drops the prior success, so isFirstLoad flips back to true and
    // resolveAsyncView() returns 'skeleton' for the loading status. Every
    // column-filter mutation gets the same first-load UX as the initial
    // fetch — visible skeleton, not a thin refresh bar over stale rows.
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
    this.fetchPeople(this.predicate());
  }

  protected failNextFetch(): void {
    this.failNext = true;
    this.refetch();
  }
  `,
  sections: [
    {
      title: 'Per-column filter rows + filtered table',
      subtitle:
        'The Name and Role columns each ship a standalone <code>&lt;cngx-filter-row&gt;</code> ' +
        'pinned to a single field. Edit the operator / value and the table below filters in real time.',
      template: `
  <div class="demo-actions">
    <button type="button" (click)="refetch()">Refetch</button>
    <button type="button" (click)="failNextFetch()">Fail next</button>
  </div>

  <div class="demo-col-headers">
    <div class="demo-col-header">
      <span>Name</span>
      <cngx-filter-row [fields]="[nameField]" [(value)]="nameFilter" />
    </div>
    <div class="demo-col-header">
      <span>Role</span>
      <cngx-filter-row [fields]="[roleField]" [(value)]="roleFilter" />
    </div>
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
      <table class="demo-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Age</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          @for (p of rows; track p.name) {
            <tr>
              <td>{{ p.name }}</td>
              <td>{{ p.role }}</td>
              <td>{{ p.age }}</td>
              <td>{{ p.active ? 'yes' : 'no' }}</td>
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

  <div class="status-row">
    <span class="status-badge">Status: {{ dataState.status() }}</span>
    <span class="status-badge">Showing: {{ (dataState.data() ?? []).length }}</span>
  </div>
      `,
      imports: [
        'CngxFilterRow',
        'JsonPipe',
        'CngxAsyncContainer',
        'CngxAsyncSkeletonTpl',
        'CngxAsyncContentTpl',
        'CngxAsyncEmptyTpl',
        'CngxAsyncErrorTpl',
      ],
      css: `
.demo-actions { display: flex; gap: 8px; margin: 12px 0; }
.demo-actions button { padding: 4px 10px; cursor: pointer; }
.demo-col-headers {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 8px 12px;
  background: var(--cngx-surface-variant, #f5f5f5);
  border: 1px solid var(--cngx-border, #ddd);
  border-bottom: none;
}
.demo-col-header { display: flex; flex-direction: column; gap: 4px; font-weight: 600; }
.demo-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
.demo-table th, .demo-table td { padding: 6px 10px; border-bottom: 1px solid var(--cngx-border, #ddd); text-align: left; vertical-align: top; }
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
    {
      title: 'Pre-seeded filter',
      subtitle:
        'Seeded filter expression flows in via signal; clearing it through the row remove button writes <code>null</code>.',
      template: `
  <cngx-filter-row [fields]="[nameField]" [(value)]="nameFilter" />
  <pre class="code-block">{{ nameFilter() | json }}</pre>
      `,
      imports: ['CngxFilterRow', 'JsonPipe'],
    },
  ],
};
