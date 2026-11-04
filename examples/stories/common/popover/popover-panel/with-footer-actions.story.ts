import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPopoverPanel: With footer actions',
  subtitle:
    'Compose <code>cngx-popover-action</code> inside <code>cngxPopoverFooter</code>. <code>role="dismiss"</code> closes the panel; <code>role="confirm"</code> runs an async action with <code>cngxPending</code> / <code>cngxSucceeded</code> / <code>cngxFailed</code> templates.',
    description:
    'A confirm panel pairs a dismiss button with an async confirm. The confirm button drives <code>CngxAsyncClick</code> under the hood, so the projected templates swap based on the returned promise. The first popover resolves and renders the success template; the second rejects and surfaces the rejection value via <code>cngxFailed</code> with <code>$implicit</code>. Pick fast (80 ms) to see a confirm settle with no busy template, medium (200 ms) to watch the pending template held through its dwell while the action refuses a second click, or slow (1.5 s) for a long run.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxPopoverPanel', 'CngxPopoverAction'],
  moduleImports: [
    "import { signal } from '@angular/core';",
    "import { CngxPopoverPanel, CngxPopoverTrigger, CngxPopoverHeader, CngxPopoverBody, CngxPopoverFooter, CngxPopoverAction } from '@cngx/common/popover';",
    "import { CngxPending, CngxSucceeded, CngxFailed } from '@cngx/common/interactive';",
  ],
  imports: [
    'CngxPopoverPanel',
    'CngxPopoverTrigger',
    'CngxPopoverHeader',
    'CngxPopoverBody',
    'CngxPopoverFooter',
    'CngxPopoverAction',
    'CngxPending',
    'CngxSucceeded',
    'CngxFailed',
  ],
  setup: `protected simulateSave = () => new Promise<void>(resolve => setTimeout(resolve, this.latencyMs()));
  protected simulateDelete = () => new Promise<void>((_, reject) => setTimeout(() => reject('Permission denied'), this.latencyMs()));`,
  setupChrome: `
  protected readonly latency = signal<'fast' | 'medium' | 'slow'>('medium');

  protected latencyMs(): number {
    switch (this.latency()) {
      case 'fast':
        return 80;
      case 'medium':
        return 200;
      default:
        return 1500;
    }
  }`,
  templateChrome: `
  <div class="button-row" style="margin-bottom:12px">
    <div role="radiogroup" aria-label="Confirm latency" style="display:inline-flex;gap:12px">
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-popover-footer-latency"
               [checked]="latency() === 'fast'"
               (change)="latency.set('fast')" />
        fast (80 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-popover-footer-latency"
               [checked]="latency() === 'medium'"
               (change)="latency.set('medium')" />
        medium (200 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-popover-footer-latency"
               [checked]="latency() === 'slow'"
               (change)="latency.set('slow')" />
        slow (1.5 s)
      </label>
    </div>
  </div>`,
  template: `
  <div class="demo-popover-stage" style="display:flex;gap:16px;flex-wrap:wrap">
    <div>
      <button type="button" [cngxPopoverTrigger]="savePop.popover" (click)="savePop.popover.toggle()" class="chip">
        Save Confirm
      </button>
      <cngx-popover-panel #savePop variant="info" [showClose]="true" [showArrow]="true" placement="bottom">
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
      <button type="button" [cngxPopoverTrigger]="delPop.popover" (click)="delPop.popover.toggle()" class="chip">
        Delete Confirm
      </button>
      <cngx-popover-panel #delPop variant="danger" [showClose]="true" [showArrow]="true" placement="bottom">
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
