import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Loading + error + content branches via <cngx-async-container>',
  subtitle: 'Press <code>Load</code> to seed fields, <code>Fail</code> to surface the error template, or <code>Refresh</code> to drive the refresh-indicator overlay above the rendered builder.',
  description: 'Wraps <cngx-filter-builder> in <cngx-async-container> for state-driven UI. Demonstrates the consumer-side loading / error / refreshing pattern after Phase C removed the in-shell async-state branches.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'composition', 'error-handling'],
  framework: 'signal-forms',
  apiComponents: [
    'CngxFilterBuilder',
    'CngxAsyncContainer',
  ],
  moduleImports: [
    'import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncErrorTpl, CngxAsyncEmptyTpl } from \'@cngx/ui/feedback\';',
    'import { createManualState } from \'@cngx/common/data\';',
    'import { CngxFilterBuilder, createEmptyFilterRoot, type FilterFieldDef, type FilterGroup } from \'@cngx/forms/filter-builder\';',
    'import { FILTER_BUILDER_FIELDS } from \'../../../fixtures\';',
  ],
  imports: ['CngxFilterBuilder', 'CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncEmptyTpl', 'CngxAsyncErrorTpl', 'JsonPipe'],
  setup: `protected readonly state = createManualState<readonly FilterFieldDef[]>();
  protected readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  protected loadFields(): void {
    this.state.set('loading');
    setTimeout(() => this.state.setSuccess(FILTER_BUILDER_FIELDS), 600);
  }
  protected failFields(): void {
    this.state.set('loading');
    setTimeout(() => this.state.setError(new Error('Field schema unavailable')), 400);
  }
  protected refreshFields(): void {
    this.state.set('refreshing');
    setTimeout(() => this.state.setSuccess(FILTER_BUILDER_FIELDS), 500);
  }
  protected resetState(): void {
    this.state.reset();
    this.tree.set(createEmptyFilterRoot());
  }`,
  template: `
  <div class="demo-form">
    <div class="demo-actions">
      <button type="button" (click)="loadFields()">Load</button>
      <button type="button" (click)="refreshFields()">Refresh</button>
      <button type="button" (click)="failFields()">Fail</button>
      <button type="button" (click)="resetState()">Reset</button>
    </div>

    <cngx-async-container [state]="state" ariaLabel="Filter schema">
      <ng-template cngxAsyncSkeleton>
        <div class="demo-skeleton">
          <div class="demo-skeleton-row"></div>
          <div class="demo-skeleton-row"></div>
          <div class="demo-skeleton-row"></div>
        </div>
      </ng-template>

      <ng-template cngxAsyncEmpty>
        <p class="demo-empty">Press <strong>Load</strong> to fetch the filter schema.</p>
      </ng-template>

      <ng-template cngxAsyncContent let-data>
        <cngx-filter-builder [fields]="data" [(value)]="tree" />
      </ng-template>

      <ng-template cngxAsyncError let-err>
        <div role="alert" class="demo-error">
          <strong>Schema load failed:</strong> {{ (err)?.message ?? 'unknown error' }}
        </div>
      </ng-template>
    </cngx-async-container>

    <pre class="code-block"><code>{{ tree() | json }}</code></pre>
  </div>
      `,
  css: `
.demo-actions { display: flex; gap: var(--cngx-demo-actions-gap, 8px); margin-bottom: var(--cngx-demo-actions-mb, 12px); }
.demo-actions button { padding: var(--cngx-demo-button-pad, 4px 10px); cursor: pointer; }
.demo-skeleton { display: flex; flex-direction: column; gap: var(--cngx-demo-skeleton-gap, 8px); }
.demo-skeleton-row {
  height: var(--cngx-demo-skeleton-row-h, 28px);
  background: var(--cngx-skeleton-bg, #e0e0e0);
  border-radius: var(--cngx-demo-skeleton-radius, 4px);
  opacity: var(--cngx-demo-skeleton-opacity, 0.6);
}
.demo-empty { color: var(--cngx-fg-muted, #666); font-style: italic; padding: var(--cngx-demo-empty-pad, 12px 0); }
.demo-error {
  color: var(--cngx-error, #b00020);
  padding: var(--cngx-demo-error-pad, 8px 12px);
  border: var(--cngx-demo-error-border, 1px solid currentColor);
  border-radius: var(--cngx-demo-error-radius, 4px);
  background: var(--cngx-demo-error-bg, rgba(176, 0, 32, 0.05));
}
      `,
};
