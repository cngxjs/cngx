import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'With Footer Actions',
  subtitle: 'Use <code>cngx-popover-action</code> for dismiss and confirm buttons. Confirm buttons support async actions with status templates.',
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
    'import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter, CngxPopoverAction } from \'@cngx/common/popover\';',
    'import { CngxPending, CngxSucceeded, CngxFailed } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxPopoverPanel', 'CngxPopoverTrigger', 'CngxPopoverHeader', 'CngxPopoverBody', 'CngxPopoverFooter', 'CngxPopoverAction', 'CngxPending', 'CngxSucceeded', 'CngxFailed'],
  setup: `protected simulateSave = () => new Promise<void>(resolve => setTimeout(resolve, 1500));
  protected simulateDelete = () => new Promise<void>((_, reject) => setTimeout(() => reject('Permission denied'), 1000));`,
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
};
