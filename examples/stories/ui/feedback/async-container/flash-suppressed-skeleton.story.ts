import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsyncContainer: flash-suppressed skeleton',
  subtitle:
    'A first load faster than <code>showDelay</code> never renders the skeleton; a slow load shows it and holds for <code>minDwell</code>. A quick refresh never flashes the bar. Defaults: 120ms / 400ms.',
  description:
    'The first-load skeleton view and the refresh bar are gated by createVisibilityGate. A fast load or quick refresh stays under the show delay and never flashes; a slow load shows the skeleton after the delay and holds it for the min-dwell. The content, empty and error branches render immediately, and the region aria-busy stays truthful throughout.',
  level: 'molecule',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'behavior', 'a11y-pattern'],
  apiComponents: ['CngxAsyncContainer'],
  moduleImports: [
    "import { CngxAsyncContainer, CngxAsyncSkeletonTpl, CngxAsyncContentTpl, CngxAsyncEmptyTpl, CngxAsyncErrorTpl } from '@cngx/ui/feedback';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxAsyncContainer',
    'CngxAsyncSkeletonTpl',
    'CngxAsyncContentTpl',
    'CngxAsyncEmptyTpl',
    'CngxAsyncErrorTpl',
  ],
  setup: `protected readonly state = createManualState<string[]>();`,
  setupChrome: `  private timer?: ReturnType<typeof setTimeout>;
  protected load(durationMs: number): void {
    clearTimeout(this.timer);
    this.state.set('loading');
    this.timer = setTimeout(() => this.state.setSuccess(['Alice', 'Bob', 'Carol']), durationMs);
  }
  protected refresh(durationMs: number): void {
    clearTimeout(this.timer);
    if (!this.state.hasData()) {
      this.state.setSuccess(['Alice', 'Bob', 'Carol']);
    }
    this.state.set('refreshing');
    this.timer = setTimeout(() => this.state.setSuccess(['Alice', 'Bob', 'Carol']), durationMs);
  }`,
  template: `  <cngx-async-container [state]="state">
    <ng-template cngxAsyncSkeleton>
      <div style="display:flex;flex-direction:column;gap:12px">
        @for (i of [1, 2, 3]; track i) {
          <div class="demo-skeleton-card">
            <div class="demo-skeleton-line demo-skeleton-line--md" style="width:40%"></div>
            <div class="demo-skeleton-line demo-skeleton-line--sm"></div>
          </div>
        }
      </div>
    </ng-template>

    <ng-template cngxAsyncContent let-data>
      <ul style="margin:0;padding-left:20px">
        @for (name of data; track name) {
          <li>{{ name }}</li>
        }
      </ul>
    </ng-template>

    <ng-template cngxAsyncEmpty>
      <p>No results.</p>
    </ng-template>

    <ng-template cngxAsyncError let-err>
      <p role="alert">{{ err }}</p>
    </ng-template>
  </cngx-async-container>`,
  templateChrome: `<div class="button-row">
    <button type="button" class="chip" (click)="load(80)">Fast first load (80ms)</button>
    <button type="button" class="chip" (click)="load(1500)">Slow first load (1.5s)</button>
    <button type="button" class="chip" (click)="refresh(80)">Quick refresh (80ms)</button>
    <button type="button" class="chip" (click)="refresh(1500)">Slow refresh (1.5s)</button>
  </div>`,
};
