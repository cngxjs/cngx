import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: Content states',
  subtitle:
    'Bind <code>[loading]</code>, <code>[error]</code>, or a single <code>[state]</code> <code>CngxAsyncState</code>. Matching <code>cngxPopoverLoading</code> / <code>cngxPopoverError</code> templates swap into the body slot.',
  description:
    'When any content state is active the panel sets <code>aria-busy</code>, clears its <code>aria-describedby</code> body pointer, and renders the matching slot template. The first popover fakes a 2s load; the second resolves with an error after 1.5s and shows the <code>cngxPopoverError</code> template with the rejection value as <code>$implicit</code>.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxPopoverPanel'],
  moduleImports: [
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverLoading, CngxPopoverError } from '@cngx/common/popover';",
  ],
  imports: [
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverHeader',
    'CngxPopoverBody',
    'CngxPopoverLoading',
    'CngxPopoverError',
  ],
  setup: `protected simulateLoad = signal(false);
  protected loadError = signal<string | undefined>(undefined);
  protected startLoading(): void {
    this.simulateLoad.set(true);
    this.loadError.set(undefined);
    setTimeout(() => {
      this.simulateLoad.set(false);
    }, 2000);
  }
  protected startLoadingWithError(): void {
    this.simulateLoad.set(true);
    this.loadError.set(undefined);
    setTimeout(() => {
      this.simulateLoad.set(false);
      this.loadError.set('Network timeout');
    }, 1500);
  }`,
  template: `
  <div class="demo-popover-stage" style="display:flex;gap:12px;flex-wrap:wrap">
    <div>
      <button [cngxPopoverTrigger]="loadPop.popover" (click)="loadPop.popover.toggle(); startLoading()" class="chip">
        Load Data
      </button>
      <cngx-popover-panel #loadPop [loading]="simulateLoad()" [showArrow]="true" placement="bottom">
        <span cngxPopoverHeader>User Details</span>
        <p cngxPopoverBody>Name: John Doe<br />Email: john&#64;example.com</p>
        <ng-template cngxPopoverLoading>
          <div style="display:flex;align-items:center;gap:8px">
            Loading user details...
          </div>
        </ng-template>
      </cngx-popover-panel>
    </div>

    <div>
      <button [cngxPopoverTrigger]="errPop.popover" (click)="errPop.popover.toggle(); startLoadingWithError()" class="chip">
        Load with Error
      </button>
      <cngx-popover-panel #errPop variant="danger" [loading]="simulateLoad()" [error]="loadError()"
                          [showArrow]="true" placement="bottom">
        <span cngxPopoverHeader>User Details</span>
        <p cngxPopoverBody>Content shown when loaded successfully.</p>
        <ng-template cngxPopoverLoading>Loading...</ng-template>
        <ng-template cngxPopoverError let-err>Failed: {{ err }}</ng-template>
      </cngx-popover-panel>
    </div>
  </div>`,
};
