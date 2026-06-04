import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAsync: with custom templates',
  subtitle: 'Pass skeleton, empty, and error templates via microsyntax. Each keyword becomes an input: <code>skeleton:</code>, <code>empty:</code>, <code>error:</code>.',
  description: 'Microsyntax escape hatch: <code>*cngxAsync</code> still drives the host element, but skeleton, empty and error templates are referenced by ID so each variant can be tuned without nesting a full <code>cngx-async-container</code>.',
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
  <ul *cngxAsync="simple; let data; skeleton: skelTpl; empty: emptyTpl; error: errTpl"
    class="demo-stack" style="list-style:none;padding:0;margin:0;gap:4px">
    @for (name of data; track name) {
      <li class="demo-card-tile">{{ name }}</li>
    }
  </ul>

  <ng-template #skelTpl>
    <div class="demo-stack--tight" style="display:flex;flex-direction:column">
      @for (i of [1,2,3]; track i) {
        <div class="demo-skeleton-bar" style="height:24px"></div>
      }
    </div>
  </ng-template>

  <ng-template #emptyTpl>
    <p class="demo-empty-text-small">No results found.</p>
  </ng-template>

  <ng-template #errTpl let-err>
    <p class="demo-error-text-small">{{ err }}</p>
  </ng-template>`,
  templateChrome: `<div class="button-row" style="margin-bottom:16px">
    <button (click)="loadSimple()" class="chip" type="button">Load</button>
    <button (click)="emptySimple()" class="chip" type="button">Empty</button>
    <button (click)="errorSimple()" class="chip" type="button">Error</button>
    <button (click)="simple.reset()" class="chip" type="button">Reset</button>
  </div>`,
};
