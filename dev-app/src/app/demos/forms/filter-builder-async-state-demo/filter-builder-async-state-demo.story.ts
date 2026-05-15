import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Filter Builder — async-container wrap',
  navLabel: 'Filter Builder Async State',
  navCategory: 'filter-builder',
  description:
    'Wraps <cngx-filter-builder> in <cngx-async-container> for state-driven UI. ' +
    'Demonstrates the consumer-side loading / error / refreshing pattern after Phase C ' +
    'removed the in-shell async-state branches.',
  apiComponents: ['CngxFilterBuilder', 'CngxAsyncContainer'],
  overview:
    '<p>Phase C of the Filter-Builder closure dropped the <code>[cngxFilterBuilderState]</code> ' +
    'input and the in-shell loading / error branches. Consumers wrap the builder in ' +
    '<code>&lt;cngx-async-container [state]&gt;</code> when their field list is fetched ' +
    'asynchronously or transitions through refresh / error states.</p>' +
    '<p>The demo seeds a <code>ManualAsyncState&lt;readonly FilterFieldDef[]&gt;</code> and ' +
    'lets you trigger every state. The <code>cngxAsyncSkeleton</code> / ' +
    '<code>cngxAsyncContent</code> / <code>cngxAsyncError</code> templates own the visual ' +
    'branches; the builder itself only renders inside <code>cngxAsyncContent</code>, fed by ' +
    '<code>data</code> from the resolved state.</p>',
  moduleImports: [
    "import { computed } from '@angular/core';",
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncErrorTpl, CngxAsyncEmptyTpl } from '@cngx/ui/feedback';",
    "import { createManualState } from '@cngx/common/data';",
    "import { CngxFilterBuilder, createEmptyFilterRoot, type FilterFieldDef, type FilterGroup } from '@cngx/forms/filter-builder';",
    "import { FILTER_BUILDER_FIELDS } from '../../../fixtures';",
  ],
  setup: `
  protected readonly state = createManualState<readonly FilterFieldDef[]>();
  protected readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  protected readonly fieldsFromState = computed<readonly FilterFieldDef[]>(
    () => this.state.data() ?? [],
  );

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
  }
  `,
  sections: [
    {
      title: 'Loading + error + content branches via <cngx-async-container>',
      subtitle:
        'Press <code>Load</code> to seed fields, <code>Fail</code> to surface the error template, ' +
        'or <code>Refresh</code> to drive the refresh-indicator overlay above the rendered builder.',
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
      imports: [
        'CngxFilterBuilder',
        'CngxAsyncContainer',
        'CngxAsyncSkeletonTpl',
        'CngxAsyncContentTpl',
        'CngxAsyncEmptyTpl',
        'CngxAsyncErrorTpl',
        'JsonPipe',
      ],
      css: `
.demo-actions { display: flex; gap: 8px; margin-bottom: 12px; }
.demo-actions button { padding: 4px 10px; cursor: pointer; }
.demo-skeleton { display: flex; flex-direction: column; gap: 8px; }
.demo-skeleton-row {
  height: 28px; background: var(--cngx-skeleton-bg, #e0e0e0);
  border-radius: 4px; opacity: 0.6;
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
