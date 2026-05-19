import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: '*cngxAsync — One Line',
  subtitle: 'The simplest usage. One structural directive, no templates, no configuration. Content appears when data arrives.',
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
    <span style="color:var(--cngx-muted,#64748b);font-size:0.875rem;align-self:center">Status: {{ simple.status() }}</span>
  </div>

  <ul *cngxAsync="simple; let data" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:4px">
    @for (name of data; track name) {
      <li style="padding:8px 12px;background:var(--cngx-card-bg,#f8fafc);border-radius:4px">{{ name }}</li>
    }
  </ul>`,
};
