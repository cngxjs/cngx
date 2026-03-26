import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Popover Panel',
  navLabel: 'PopoverPanel',
  navCategory: 'popover',
  description:
    'Rich popover molecule with header/body/footer slots, variant styling, arrow, close button, content state templates, and async action buttons.',
  apiComponents: ['CngxPopoverPanel', 'CngxPopoverAction'],
  overview:
    '<p><code>cngx-popover-panel</code> composes <code>CngxPopover</code> with structured layout, ' +
    'variant-based styling, and content state management. Use <code>cngx-popover-action</code> for ' +
    'async footer buttons with <code>cngxPending</code>/<code>cngxSucceeded</code>/<code>cngxFailed</code> templates.</p>',
  moduleImports: [
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter, CngxPopoverAction, CngxPopoverLoading, CngxPopoverError } from '@cngx/common/popover';",
    "import { CngxPending, CngxSucceeded, CngxFailed } from '@cngx/common/interactive';",
  ],
  setup: `
  protected simulateSave = () => new Promise<void>(resolve => setTimeout(resolve, 1500));
  protected simulateDelete = () => new Promise<void>((_, reject) => setTimeout(() => reject('Permission denied'), 1000));
  protected simulateLoad = signal(false);
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
  }
  `,
  sections: [
    {
      title: 'Variants',
      subtitle:
        'The <code>variant</code> input is a free-form string mapped to CSS class <code>cngx-popover-panel--{variant}</code>. ' +
        'Five are pre-themed: <code>default</code>, <code>info</code>, <code>success</code>, <code>warning</code>, <code>danger</code>.',
      imports: ['CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader', 'CngxPopoverBody'],
      template: `
  <div style="display:flex;gap:12px;flex-wrap:wrap;padding-top:20px">
    @for (v of ['default', 'info', 'success', 'warning', 'danger']; track v) {
      <div>
        <button [cngxPopoverTrigger]="vp.popover" (click)="vp.popover.toggle()" class="chip">{{ v }}</button>
        <cngx-popover-panel #vp [variant]="v" [showClose]="true" [showArrow]="true" placement="bottom">
          <span cngxPopoverHeader>{{ v }} panel</span>
          <p cngxPopoverBody>This is a {{ v }} popover panel with arrow and close button.</p>
        </cngx-popover-panel>
      </div>
    }
  </div>`,
    },
    {
      title: 'With Footer Actions',
      subtitle:
        'Use <code>cngx-popover-action</code> for dismiss and confirm buttons. Confirm buttons support async actions with status templates.',
      imports: [
        'CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader',
        'CngxPopoverBody', 'CngxPopoverFooter', 'CngxPopoverAction',
        'CngxPending', 'CngxSucceeded', 'CngxFailed',
      ],
      template: `
  <div style="display:flex;gap:16px;flex-wrap:wrap;padding-top:20px">
    <div>
      <button [cngxPopoverTrigger]="savePop.popover" (click)="savePop.popover.toggle()" class="chip">
        Save Confirm
      </button>
      <cngx-popover-panel #savePop variant="info" [showClose]="true" [showArrow]="true"
                          [hasFooter]="true" placement="bottom">
        <span cngxPopoverHeader>Save Changes?</span>
        <p cngxPopoverBody>Your unsaved changes will be saved to the server.</p>
        <div cngxPopoverFooter>
          <cngx-popover-action role="dismiss">Cancel</cngx-popover-action>
          <cngx-popover-action role="confirm" [action]="simulateSave" variant="primary">
            Save
            <ng-template cngxPending>Saving...</ng-template>
            <ng-template cngxSucceeded>Saved!</ng-template>
          </cngx-popover-action>
        </div>
      </cngx-popover-panel>
    </div>

    <div>
      <button [cngxPopoverTrigger]="delPop.popover" (click)="delPop.popover.toggle()" class="chip">
        Delete Confirm
      </button>
      <cngx-popover-panel #delPop variant="danger" [showClose]="true" [showArrow]="true"
                          [hasFooter]="true" placement="bottom">
        <span cngxPopoverHeader>Delete Item?</span>
        <p cngxPopoverBody>This action cannot be undone.</p>
        <div cngxPopoverFooter>
          <cngx-popover-action role="dismiss">Cancel</cngx-popover-action>
          <cngx-popover-action role="confirm" [action]="simulateDelete" variant="danger">
            Delete
            <ng-template cngxPending>Deleting...</ng-template>
            <ng-template cngxFailed let-err>{{ err }}</ng-template>
          </cngx-popover-action>
        </div>
      </cngx-popover-panel>
    </div>
  </div>`,
    },
    {
      title: 'Content States',
      subtitle:
        'Use <code>[loading]</code>, <code>[error]</code>, <code>[empty]</code> inputs with matching templates for content lifecycle.',
      imports: ['CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader', 'CngxPopoverBody', 'CngxPopoverLoading', 'CngxPopoverError'],
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
    },
  ],
};
