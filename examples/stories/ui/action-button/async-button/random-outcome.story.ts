import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Random outcome',
  subtitle: 'The action resolves or rejects randomly. Click multiple times to see both states. Feedback auto-resets after 2 seconds. Uses string labels - no templates needed.',
  description: 'String-label fast-path: success/failure decided by a random Promise resolver, both terminal states reachable from a single button. Shows the organism has zero boilerplate when you only need the default templates. It sits on the native <code>&lt;button&gt;</code> with the <code>cngxButton</code> axes, and the labels share one cell, so the button keeps the width of its widest label in every state. A run under the show delay goes from idle straight to the result with no spinner; a longer run holds the pending cell through its dwell, and the button refuses a second click until the result lands. The outcome is spoken as well: the polite live region <code>cngxAsyncClick</code> renders next to the button receives the succeeded or failed label.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'visual-variants'],
  apiComponents: [
    'CngxActionButton',
  ],
  moduleImports: [
    'import { CngxActionButton } from \'@cngx/ui\';',
    'import { wrapDemoAction, mirrorScreenReader } from \'../../../../fixtures\';',
  ],
  imports: ['CngxActionButton'],
  setup: `protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), 80),
  );`,
  setupChrome: `
  protected readonly latency = signal<'fast' | 'medium' | 'slow'>('medium');

  // The wait added in front of submitAction's own 80 ms, per latency picked below.
  private extraMs(): number {
    switch (this.latency()) {
      case 'fast':
        return 0;
      case 'medium':
        return 120;
      default:
        return 1420;
    }
  }

  // Runs submitAction after the picked extra wait; its own outcome decides the run.
  private readonly latencyKnob = wrapDemoAction(this, 'submitAction', (original) => () =>
    new Promise<void>((resolve) => setTimeout(resolve, this.extraMs())).then(() => original()),
  );

  // Mirrors the busy state and the live region writes into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'button', selector: 'button[cngxactionbutton]' },
  ]);`,
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
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} aria-busy</dt>
        <dd>{{ row.busy }}</dd>
      }
      @for (entry of sr.heard(); track entry.n) {
        <dt>#{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      The last five texts written to the polite live region next to the button, newest last. They are spoken as well as painted on the button; two writes in one frame may be voiced once, depending on the screen reader.
    </p>
  </div>`,
};
