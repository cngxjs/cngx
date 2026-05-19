import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Content States',
  subtitle: 'Use <code>[loading]</code>, <code>[error]</code>, <code>[empty]</code> inputs with matching templates for content lifecycle.',
  description: 'Rich popover molecule with header/body/footer slots, variant styling, arrow, close button, content state templates, and async action buttons.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: [
    'CngxPopoverPanel',
    'CngxPopoverAction',
  ],
  moduleImports: [
    'import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverLoading, CngxPopoverError } from \'@cngx/common/popover\';',
  ],
  imports: ['CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader', 'CngxPopoverBody', 'CngxPopoverLoading', 'CngxPopoverError'],
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
  <div style="display:flex;gap:12px;flex-wrap:wrap;padding-top:20px">
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
