import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncContainer: full control with toast',
  subtitle: 'Four templates, built-in refresh bar, integrated toast on success/error. Uses <code>createManualState</code> for demo control.',
  description: 'Full surface variant: skeleton, content, empty, and error templates all overridden, plus the integrated toast bridge fires on success/error transitions. Four buttons exercise every state path.',
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
  template: `  <cngx-async-container [state]="manual" ariaLabel="Items"
    toastSuccess="Loaded successfully" toastError="Failed to load">

    <ng-template cngxAsyncSkeleton>
      <div class="demo-stack--tight" style="display:flex;flex-direction:column">
        @for (i of [1,2,3]; track i) {
          <div class="demo-skeleton-bar" style="height:24px"></div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul class="demo-stack" style="list-style:none;padding:0;margin:0;gap:4px">
        @for (name of data; track name) {
          <li class="demo-card-tile">{{ name }}</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncEmpty>
      <div class="demo-empty-state-block--large demo-empty-state-block">
        <p style="margin:0 0 8px;font-size:1.125rem">No items</p>
        <p style="margin:0">Try loading with different parameters.</p>
      </div>
    </ng-template>

    <ng-template cngxAsyncError let-err>
      <div class="demo-error-block">
        <p style="margin:0 0 8px;font-size:1.125rem">Load failed</p>
        <p style="margin:0 0 12px;opacity:0.8">{{ err }}</p>
        <button (click)="loadManual()" class="chip" type="button">Retry</button>
      </div>
    </ng-template>
  </cngx-async-container>`,
  templateChrome: `<div class="button-row" style="margin-bottom:16px">
    <button (click)="loadManual()" class="chip" type="button">Load</button>
    <button (click)="emptyManual()" class="chip" type="button">Empty</button>
    <button (click)="errorManual()" class="chip" type="button">Error</button>
    <button (click)="refreshManual()" class="chip" type="button" [disabled]="manual.isFirstLoad()">Refresh</button>
    <button (click)="manual.reset()" class="chip" type="button">Reset</button>
  </div>
<div class="event-grid" style="margin-bottom:12px">
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
