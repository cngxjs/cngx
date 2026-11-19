import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Template slots',
  subtitle: 'Project <code>cngxPending</code>, <code>cngxSucceeded</code>, <code>cngxFailed</code> templates for full control. The <code>cngxFailed</code> template receives the error as <code>let-err</code>.',
  description: 'Slot-projection escape hatch: replace each terminal-state template with custom markup (Material spinner in the pending slot, retry prompt with the error message in the failed slot). Use when string labels are not enough. Both outcomes are spoken with the text of the rendered template: success speaks the <code>cngxSucceeded</code> text, failure the <code>cngxFailed</code> text, so a screen reader hears what the button shows. The dashed box below logs what the polite live region next to the button receives.',
  level: 'organism',
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
    'import { mirrorScreenReader } from \'../../../../fixtures\';',
  ],
  imports: ['CngxActionButton', 'CngxPending', 'CngxSucceeded', 'CngxFailed', 'MatProgressSpinnerModule'],
  setup: `protected readonly submitAction = () => new Promise<void>((resolve, reject) =>
    setTimeout(() => Math.random() > 0.4 ? resolve() : reject(new Error('Random failure')), 1200),
  );`,
  template: `
  <button cngxActionButton tone="primary" [action]="submitAction">
    Submit Order
    <ng-template cngxPending>
      <span style="display:inline-flex;align-items:center;gap:6px">
        <mat-spinner diameter="16" /> Processing...
      </span>
    </ng-template>
    <ng-template cngxSucceeded>Order placed!</ng-template>
    <ng-template cngxFailed let-err>{{ err }} - retry?</ng-template>
  </button>`,
  setupChrome: `
  // Mirrors the busy state and the live region writes into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'button', selector: 'button[cngxactionbutton]' },
  ]);`,
  templateChrome: `
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
