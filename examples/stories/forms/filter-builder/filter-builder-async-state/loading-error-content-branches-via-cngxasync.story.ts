import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxFilterBuilder: loading error content branches via cngxAsync',
  subtitle:
    'Press <code>Load</code> to seed fields, <code>Fail</code> to surface the error template, or <code>Refresh</code> to reload the schema while the rendered builder stays on screen.',
  description:
    'Renders <code>&lt;cngx-filter-builder&gt;</code> through <code>*cngxAsync</code> once its field schema has loaded. The skeleton and error templates cover the first load; a refresh or a failed reload keeps the builder and its tree, because a structural directive renders one template at a time.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'composition', 'error-handling'],
  framework: 'signal-forms',
  apiComponents: ['CngxFilterBuilder', 'CngxAsync'],
  moduleImports: [
    "import { CngxAsync, createManualState } from '@cngx/common/data';",
    "import { CngxFilterBuilder, createEmptyFilterRoot, type FilterFieldDef, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS } from '../../../fixtures';",
  ],
  imports: [
    'CngxFilterBuilder',
    'CngxAsync',
    'JsonPipe',
  ],
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
    <div class="button-row">
      <button type="button" class="chip" (click)="loadFields()">Load</button>
      <button type="button" class="chip" (click)="refreshFields()">Refresh</button>
      <button type="button" class="chip" (click)="failFields()">Fail</button>
      <button type="button" class="chip" (click)="resetState()">Reset</button>
    </div>

    @if (state.status() === 'idle') {
      <p class="demo-empty">Press <strong>Load</strong> to fetch the filter schema.</p>
    }

    <div [attr.aria-busy]="state.isBusy()">
      <cngx-filter-builder
        *cngxAsync="state; let data; skeleton: skeletonTpl; error: errorTpl"
        [fields]="data"
        [(value)]="tree"
      />
    </div>

    <ng-template #skeletonTpl>
      <div class="demo-skeleton">
        <div class="demo-skeleton-row"></div>
        <div class="demo-skeleton-row"></div>
        <div class="demo-skeleton-row"></div>
      </div>
    </ng-template>

    <ng-template #errorTpl let-err>
      <div role="alert" class="demo-error">
        <strong>Schema load failed:</strong> {{ (err)?.message ?? 'unknown error' }}
      </div>
    </ng-template>

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
