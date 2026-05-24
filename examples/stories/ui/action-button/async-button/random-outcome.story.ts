import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: random outcome',
  subtitle: 'The action resolves or rejects randomly. Click multiple times to see both states. Feedback auto-resets after 2 seconds. Uses string labels - no templates needed.',
  description: 'String-label fast-path: success/failure decided by a random Promise resolver, both terminal states reachable from a single button. Shows that the molecule has zero boilerplate when you only need the default templates.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'visual-variants'],
  apiComponents: [
    'CngxActionButton',
  ],
  moduleImports: [
    'import { CngxActionButton } from \'@cngx/ui\';',
  ],
  imports: ['CngxActionButton'],
  setup: `protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), 1200),
  );`,
  template: `
  <cngx-action-button [action]="submitAction"
    pendingLabel="Rolling..." succeededLabel="Won!" failedLabel="Lost">
    Roll the Dice
  </cngx-action-button>`,
};
