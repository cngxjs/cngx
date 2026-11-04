import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Random outcome',
  subtitle: 'The action resolves or rejects randomly. Click multiple times to see both states. Feedback auto-resets after 2 seconds. Uses string labels - no templates needed.',
  description: 'String-label fast-path: success/failure decided by a random Promise resolver, both terminal states reachable from a single button. Shows the organism has zero boilerplate when you only need the default templates. It sits on the native <code>&lt;button&gt;</code> with the <code>cngxButton</code> axes, and the labels share one cell, so the button keeps the width of its widest label in every state. Pick fast (80 ms) to see idle go straight to the result with no spinner, medium (200 ms) to watch the pending cell held through its dwell and the button refuse a second click until the result lands, or slow (1.5 s) for a long run.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'visual-variants'],
  apiComponents: [
    'CngxActionButton',
  ],
  moduleImports: [
    'import { signal } from \'@angular/core\';',
    'import { CngxActionButton } from \'@cngx/ui\';',
  ],
  imports: ['CngxActionButton'],
  setup: `protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), this.latencyMs()),
  );`,
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
  template: `
  <button cngxActionButton tone="primary" [action]="submitAction"
    pendingLabel="Rolling..." succeededLabel="Won!" failedLabel="Lost">
    Roll the Dice
  </button>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <div role="radiogroup" aria-label="Run latency" style="display:inline-flex;gap:12px">
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-action-button-latency"
               [checked]="latency() === 'fast'"
               (change)="latency.set('fast')" />
        fast (80 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-action-button-latency"
               [checked]="latency() === 'medium'"
               (change)="latency.set('medium')" />
        medium (200 ms)
      </label>
      <label style="display:inline-flex;gap:4px;align-items:center">
        <input type="radio" name="cngx-action-button-latency"
               [checked]="latency() === 'slow'"
               (change)="latency.set('slow')" />
        slow (1.5 s)
      </label>
    </div>
  </div>`,
};
