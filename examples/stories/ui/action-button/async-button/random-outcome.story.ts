import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Random outcome',
  subtitle: 'The action resolves or rejects randomly. Click multiple times to see both states. Feedback auto-resets after 2 seconds. Uses string labels - no templates needed.',
  description: 'String-label fast-path: success/failure decided by a random Promise resolver, both terminal states reachable from a single button. Shows the organism has zero boilerplate when you only need the default templates. It sits on the native <code>&lt;button&gt;</code> with the <code>cngxButton</code> axes, and the labels share one cell, so the button keeps the width of its widest label in every state.',
  level: 'organism',
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
  <button cngxActionButton tone="primary" [action]="submitAction"
    pendingLabel="Rolling..." succeededLabel="Won!" failedLabel="Lost">
    Roll the Dice
  </button>`,
};
