import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'cngx-async-container — Full Control + Toast',
  subtitle: 'Four templates, built-in refresh bar, integrated toast on success/error. Uses <code>createManualState</code> for demo control.',
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
    'import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncEmptyTpl, CngxAsyncErrorTpl } from \'@cngx/ui/feedback\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxAsyncEmptyTpl', 'CngxAsyncErrorTpl'],
  setup: `protected readonly manual = createManualState<string[]>();
  protected loadManual(): void {
    this.manual.set('loading');
    setTimeout(() => this.manual.setSuccess(['Alpha', 'Beta', 'Gamma']), 2000);
  }
  protected refreshManual(): void {
    this.manual.set('refreshing');
    setTimeout(() => this.manual.setSuccess(['Alpha', 'Beta', 'Gamma', 'Delta']), 2000);
  }
  protected errorManual(): void {
    this.manual.set('loading');
    setTimeout(() => this.manual.setError('Connection refused'), 2000);
  }
  protected emptyManual(): void {
    this.manual.set('loading');
    setTimeout(() => this.manual.setSuccess([]), 2000);
  }`,
  template: `  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
    <button (click)="loadManual()" class="chip">Load</button>
    <button (click)="emptyManual()" class="chip">Empty</button>
    <button (click)="errorManual()" class="chip">Error</button>
    <button (click)="refreshManual()" class="chip" [disabled]="manual.isFirstLoad()">Refresh</button>
    <button (click)="manual.reset()" class="chip">Reset</button>
  </div>

  <cngx-async-container [state]="manual" ariaLabel="Items"
    toastSuccess="Loaded successfully" toastError="Failed to load">

    <ng-template cngxAsyncSkeleton>
      <div style="display:flex;flex-direction:column;gap:8px">
        @for (i of [1,2,3]; track i) {
          <div style="height:24px;background:var(--cngx-skeleton-bg,#e5e7eb);border-radius:4px"></div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">
        @for (name of data; track name) {
          <li style="padding:8px 12px;background:var(--cngx-card-bg,#f8fafc);border-radius:4px">{{ name }}</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncEmpty>
      <div style="text-align:center;padding:32px;color:var(--cngx-muted,#64748b)">
        <p style="margin:0 0 8px;font-size:1.125rem">No items</p>
        <p style="margin:0">Try loading with different parameters.</p>
      </div>
    </ng-template>

    <ng-template cngxAsyncError let-err>
      <div style="text-align:center;padding:24px;color:var(--cngx-alert-error-icon,#ef4444)">
        <p style="margin:0 0 8px;font-size:1.125rem">Load failed</p>
        <p style="margin:0 0 12px;opacity:0.8">{{ err }}</p>
        <button (click)="loadManual()" class="chip">Retry</button>
      </div>
    </ng-template>
  </cngx-async-container>`,
  templateChrome: `<div class="event-grid" style="margin-bottom:12px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ manual.status() }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">isFirstLoad</span>
      <span class="event-value">{{ manual.isFirstLoad() }}</span>
    </div>
  </div>`,
};
