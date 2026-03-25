import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'ActionButton',
  navLabel: 'ActionButton',
  description:
    'Action button molecule with built-in status templates. Zero boilerplate alternative to CngxAsyncClick.',
  apiComponents: ['CngxActionButton', 'CngxPending', 'CngxSucceeded', 'CngxFailed'],
  overview:
    '<p><code>CngxActionButton</code> wraps async actions into a button with automatic state management. ' +
    'Use string labels for simple cases or project <code>cngxPending</code>/<code>cngxSucceeded</code>/<code>cngxFailed</code> ' +
    'templates for custom UI per state. No <code>@if</code> boilerplate needed.</p>',
  moduleImports: [
    "import { CngxActionButton, CngxPending, CngxSucceeded, CngxFailed } from '@cngx/ui';",
    "import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';",
  ],
  setup: `
  protected readonly saveAction = () => new Promise<void>(resolve => setTimeout(resolve, 1500));
  protected readonly deleteAction = () => new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('403 Forbidden')), 1000),
  );
  protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), 1200),
  );
  `,
  sections: [
    {
      title: 'String Labels',
      subtitle:
        'The simplest usage: pass <code>pendingLabel</code>, <code>succeededLabel</code>, <code>failedLabel</code> as strings. ' +
        'Default content is shown when idle.',
      imports: ['CngxActionButton'],
      template: `
  <div class="button-row" style="gap:12px">
    <cngx-action-button [action]="saveAction" pendingLabel="Saving..." succeededLabel="Saved!">
      Save Draft
    </cngx-action-button>
    <cngx-action-button [action]="deleteAction" pendingLabel="Deleting..." failedLabel="Failed!">
      Delete
    </cngx-action-button>
  </div>`,
    },
    {
      title: 'Template Slots',
      subtitle:
        'Project <code>cngxPending</code>, <code>cngxSucceeded</code>, <code>cngxFailed</code> templates for full control. ' +
        'The <code>cngxFailed</code> template receives the error as <code>let-err</code>.',
      imports: ['CngxActionButton', 'CngxPending', 'CngxSucceeded', 'CngxFailed', 'MatProgressSpinnerModule'],
      template: `
  <div class="button-row">
    <cngx-action-button [action]="submitAction">
      Submit Order
      <ng-template cngxPending>
        <span style="display:inline-flex;align-items:center;gap:6px">
          <mat-spinner diameter="16" /> Processing...
        </span>
      </ng-template>
      <ng-template cngxSucceeded>Order placed!</ng-template>
      <ng-template cngxFailed let-err>{{ err }} -- retry?</ng-template>
    </cngx-action-button>
  </div>`,
    },
    {
      title: 'Random Outcome',
      subtitle:
        'The action resolves or rejects randomly. Click multiple times to see both states. ' +
        'Feedback auto-resets after 2 seconds. Uses string labels — no templates needed.',
      imports: ['CngxActionButton'],
      template: `
  <div class="button-row">
    <cngx-action-button [action]="submitAction"
      pendingLabel="Rolling..." succeededLabel="Won!" failedLabel="Lost">
      Roll the Dice
    </cngx-action-button>
  </div>`,
    },
  ],
};
