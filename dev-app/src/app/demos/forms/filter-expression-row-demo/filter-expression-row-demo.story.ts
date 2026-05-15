import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Row — standalone',
  navLabel: 'Filter Row',
  navCategory: 'filter-builder',
  description:
    '<cngx-filter-row> wired into a table-column header. A single filter row outside the ' +
    'recursive builder; the row owns its FilterExpression via [(value)] and the page applies it ' +
    'as a predicate to the rows below.',
  apiComponents: ['CngxFilterRow'],
  overview:
    '<p><code>CngxFilterRow</code> is the dedicated single-row surface for column-header / ' +
    'quick-filter contexts. Pass <code>[fields]</code> + <code>[(value)]</code> and the row ' +
    'reads/writes the bound <code>FilterExpression | null</code> directly — no wrapping ' +
    'presenter, no <code>CNGX_FILTER_BUILDER_HOST</code> needed.</p>' +
    '<p>This pattern lifts a single row into a table-column header, a side panel, or any ' +
    'context where a full builder tree is overkill. The bound expression flows through ' +
    '<code>toFilterPredicate(group, fields)</code> the same way; we wrap it in a synthetic ' +
    'one-expression group for evaluation.</p>',
  moduleImports: [
    "import { computed } from '@angular/core';",
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

  protected readonly filtered = computed<readonly FilterBuilderPerson[]>(() => {
    const items = this.dataState.data() ?? [];
    const filters: FilterExpression[] = [];
    const n = this.nameFilter();
    const r = this.roleFilter();
    if (n) filters.push(n);
    if (r) filters.push(r);
    if (filters.length === 0) {
      return items;
    }
    const tree = createFilterGroup('and', filters);
    const predicate = toFilterPredicate(tree, this.fields);
    return predicate ? items.filter(predicate) : items;
  });

  constructor() {
    this.dataState.setSuccess(FILTER_BUILDER_PEOPLE);
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
      title: 'Per-column filter rows + filtered table',
      subtitle:
        'The Name and Role columns each ship a standalone <code>&lt;cngx-filter-row&gt;</code> ' +
        'pinned to a single field. Edit the operator / value and the table below filters in real time.',
      template: `
  <div class="demo-actions">
    <button type="button" (click)="refreshData()">Refresh</button>
    <button type="button" (click)="loadData()">Reload</button>
    <button type="button" (click)="failData()">Fail</button>
    <button type="button" (click)="emptyData()">Empty</button>
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
      <table class="demo-table">
        <thead>
          <tr>
            <th>
              <div class="demo-col-header">
                <span>Name</span>
                <cngx-filter-row [fields]="[nameField]" [(value)]="nameFilter" />
              </div>
            </th>
            <th>
              <div class="demo-col-header">
                <span>Role</span>
                <cngx-filter-row [fields]="[roleField]" [(value)]="roleFilter" />
              </div>
            </th>
            <th>Age</th>
            <th>Active</th>
          </tr>
        </thead>
        <tbody>
          @for (p of filtered(); track p.name) {
            <tr>
              <td>{{ p.name }}</td>
              <td>{{ p.role }}</td>
              <td>{{ p.age }}</td>
              <td>{{ p.active ? 'yes' : 'no' }}</td>
            </tr>
          } @empty {
            <tr><td colspan="4">No rows match the current filters.</td></tr>
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
    <span class="status-badge">Name filter: {{ nameFilter() | json }}</span>
    <span class="status-badge">Role filter: {{ roleFilter() | json }}</span>
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
.demo-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 0.875rem; }
.demo-table th, .demo-table td { padding: 6px 10px; border-bottom: 1px solid var(--cngx-border, #ddd); text-align: left; vertical-align: top; }
.demo-table th { background: var(--cngx-surface-variant, #f5f5f5); font-weight: 600; }
.demo-col-header { display: flex; flex-direction: column; gap: 4px; }
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
