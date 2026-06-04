import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncContainer: composition with overlay and toast',
  subtitle: 'Stack atoms freely. <code>[firstLoadOnly]</code> restricts the overlay to the initial load - refresh uses the container\'s built-in bar instead, avoiding content jumps under the backdrop.',
  description: 'Three feedback atoms composed at once: <code>cngx-loading-overlay</code> wraps the container for first-load only, the container drives the skeleton + content templates, and the integrated toast bridge fires on success/error. Refresh uses the container bar instead of the overlay.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'error-handling', 'composition'],
  apiComponents: [
    'CngxAsyncContainer',
    'CngxAsync',
  ],
  moduleImports: [
    'import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxLoadingOverlay } from \'@cngx/ui/feedback\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAsyncContainer', 'CngxAsyncSkeletonTpl', 'CngxAsyncContentTpl', 'CngxLoadingOverlay'],
  setup: `protected readonly composed = createManualState<string[]>();
  protected loadComposed(): void {
    this.composed.set('loading');
    setTimeout(() => this.composed.setSuccess(['Item A', 'Item B', 'Item C']), 2000);
  }
  protected refreshComposed(): void {
    this.composed.set('refreshing');
    setTimeout(() => this.composed.setSuccess(['Item A', 'Item B', 'Item C', 'Item D']), 4000);
  }
  protected errorComposed(): void {
    this.composed.set('loading');
    setTimeout(() => this.composed.setError('Timeout'), 2000);
  }`,
  template: `
  <cngx-loading-overlay [state]="composed" [firstLoadOnly]="true" label="Loading data">
    <cngx-async-container [state]="composed" ariaLabel="Composed demo"
      toastSuccess="Data loaded" toastError="Load failed">

      <ng-template cngxAsyncSkeleton>
        <div class="demo-stack--tight" style="display:flex;flex-direction:column">
          @for (i of [1,2,3]; track i) {
            <div class="demo-skeleton-bar" style="height:32px"></div>
          }
        </div>
      </ng-template>

      <ng-template cngxAsyncContent let-data>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
          @for (item of data; track item) {
            <div class="demo-card-cell">{{ item }}</div>
          }
        </div>
      </ng-template>
    </cngx-async-container>
  </cngx-loading-overlay>`,
  templateChrome: `<div class="button-row" style="margin-bottom:16px">
    <button (click)="loadComposed()" class="chip" type="button">Load</button>
    <button (click)="refreshComposed()" class="chip" type="button" [disabled]="composed.isFirstLoad()">Refresh (with overlay)</button>
    <button (click)="errorComposed()" class="chip" type="button">Error</button>
    <button (click)="composed.reset()" class="chip" type="button">Reset</button>
  </div>`,
};
