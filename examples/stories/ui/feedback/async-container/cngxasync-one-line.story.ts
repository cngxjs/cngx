import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsync: one line',
  subtitle: 'The simplest usage. One structural directive, no templates, no configuration. Content appears when data arrives.',
  description: 'Bare-minimum binding: <code>*cngxAsync="state; let data"</code> on a single element. No skeleton, no error template, just content rendered when the state succeeds.',
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
  <ul *cngxAsync="simple; let data" class="demo-stack" style="list-style:none;padding:0;margin:0;gap:4px">
    @for (name of data; track name) {
      <li class="demo-card-tile">{{ name }}</li>
    }
  </ul>`,
  templateChrome: `<div class="button-row" style="margin-bottom:16px">
    <button (click)="loadSimple()" class="chip" type="button">Load</button>
    <button (click)="emptySimple()" class="chip" type="button">Empty</button>
    <button (click)="errorSimple()" class="chip" type="button">Error</button>
    <button (click)="simple.reset()" class="chip" type="button">Reset</button>
    <span class="demo-hint" style="align-self:center">Status: {{ simple.status() }}</span>
  </div>`,
};
