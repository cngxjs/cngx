import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: '*cngxAsync — With Custom Templates',
  subtitle: 'Pass skeleton, empty, and error templates via microsyntax. Each keyword becomes an input: <code>skeleton:</code>, <code>empty:</code>, <code>error:</code>.',
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
    'import { CngxAsync, createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAsync'],
  setup: `protected readonly simple = createManualState<string[]>();
  protected loadSimple(): void {
    this.simple.set('loading');
    setTimeout(() => this.simple.setSuccess(['Alice', 'Bob', 'Charlie']), 2000);
  }
  protected emptySimple(): void {
    this.simple.set('loading');
    setTimeout(() => this.simple.setSuccess([]), 2000);
  }
  protected errorSimple(): void {
    this.simple.set('loading');
    setTimeout(() => this.simple.setError('Network error'), 2000);
  }`,
  template: `
  <div style="display:flex;gap:8px;margin-bottom:16px">
    <button (click)="loadSimple()" class="chip">Load</button>
    <button (click)="emptySimple()" class="chip">Empty</button>
    <button (click)="errorSimple()" class="chip">Error</button>
    <button (click)="simple.reset()" class="chip">Reset</button>
  </div>

  <ul *cngxAsync="simple; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl"
    style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">
    @for (name of data; track name) {
      <li style="padding:8px 12px;background:var(--cngx-card-bg,#f8fafc);border-radius:4px">{{ name }}</li>
    }
  </ul>

  <ng-template #skelTpl>
    <div style="display:flex;flex-direction:column;gap:8px">
      @for (i of [1,2,3]; track i) {
        <div style="height:24px;background:var(--cngx-skeleton-bg,#e5e7eb);border-radius:4px"></div>
      }
    </div>
  </ng-template>

  <ng-template #emptyTpl>
    <p style="text-align:center;padding:24px;color:var(--cngx-muted,#64748b);margin:0">No results found.</p>
  </ng-template>

  <ng-template #errTpl let-err>
    <p style="text-align:center;padding:24px;color:var(--cngx-alert-error-icon,#ef4444);margin:0">{{ err }}</p>
  </ng-template>`,
};
