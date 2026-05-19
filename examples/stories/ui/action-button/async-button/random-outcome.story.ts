import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Random Outcome',
  subtitle: 'The action resolves or rejects randomly. Click multiple times to see both states. Feedback auto-resets after 2 seconds. Uses string labels — no templates needed.',
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
    'import { CngxActionButton } from \'@cngx/ui\';',
  ],
  imports: ['CngxActionButton'],
  setupChrome: `protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), 1200),
  );`,
  template: ``,
  templateChrome: `<div class="button-row">
    <cngx-action-button [action]="submitAction"
      pendingLabel="Rolling..." succeededLabel="Won!" failedLabel="Lost">
      Roll the Dice
    </cngx-action-button>
  </div>`,
};
