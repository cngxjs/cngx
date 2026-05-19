import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Composition — Overlay + Container + Toast',
  subtitle: 'Stack atoms freely. <code>[firstLoadOnly]</code> restricts the overlay to the initial load — refresh uses the container\'s built-in bar instead, avoiding content jumps under the backdrop.',
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
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px">
    <button (click)="loadComposed()" class="chip">Load</button>
    <button (click)="refreshComposed()" class="chip" [disabled]="composed.isFirstLoad()">Refresh (with overlay)</button>
    <button (click)="errorComposed()" class="chip">Error</button>
    <button (click)="composed.reset()" class="chip">Reset</button>
  </div>

  <cngx-loading-overlay [state]="composed" [firstLoadOnly]="true" label="Loading data">
    <cngx-async-container [state]="composed" ariaLabel="Composed demo"
      toastSuccess="Data loaded" toastError="Load failed">

      <ng-template cngxAsyncSkeleton>
        <div style="display:flex;flex-direction:column;gap:8px">
          @for (i of [1,2,3]; track i) {
            <div style="height:32px;background:var(--cngx-skeleton-bg,#e5e7eb);border-radius:6px"></div>
          }
        </div>
      </ng-template>

      <ng-template cngxAsyncContent let-data>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">
          @for (item of data; track item) {
            <div style="padding:16px;background:var(--cngx-card-bg,#f8fafc);border-radius:6px;text-align:center">
              {{ item }}
            </div>
          }
        </div>
      </ng-template>
    </cngx-async-container>
  </cngx-loading-overlay>`,
};
