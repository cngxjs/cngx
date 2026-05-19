import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Template Slots',
  subtitle: 'Project <code>cngxPending</code>, <code>cngxSucceeded</code>, <code>cngxFailed</code> templates for full control. The <code>cngxFailed</code> template receives the error as <code>let-err</code>.',
  description: 'Action button molecule with built-in status templates. Zero boilerplate alternative to CngxAsyncClick.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'visual-variants'],
  apiComponents: [
    'CngxActionButton',
    'CngxPending',
    'CngxSucceeded',
    'CngxFailed',
  ],
  moduleImports: [
    'import { CngxActionButton, CngxPending, CngxSucceeded, CngxFailed } from \'@cngx/ui\';',
    'import { MatProgressSpinnerModule } from \'@angular/material/progress-spinner\';',
  ],
  imports: ['CngxActionButton', 'CngxPending', 'CngxSucceeded', 'CngxFailed', 'MatProgressSpinnerModule'],
  setup: `protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), 1200),
  );`,
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
};
