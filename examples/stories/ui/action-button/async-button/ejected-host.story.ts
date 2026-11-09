import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxActionButton: Ejected host',
  subtitle:
    'Your own action button on the brains: <code>CngxButtonBrain</code>, <code>CngxAsyncClick</code> and <code>CngxActionStatusBrain</code> in <code>hostDirectives</code>, plus <code>provideActionStatusHost()</code>.',
  description:
    '<code>cngxActionButton</code> is skin over host directives; this host is another skin over the same ones. <code>demoEjectedAction</code> declares <code>CngxButtonBrain</code> (<code>aria-disabled</code>, the activation guard, <code>data-busy</code>), <code>CngxAsyncClick</code> (the run and the live region next to the button) and <code>CngxActionStatusBrain</code> (which label cell shows, and what the region speaks). <code>provideButtonHost()</code> names the host; <code>provideActionStatusHost()</code> hands the status announcement to the region and makes a bound <code>[externalState]</code> refuse clicks while it runs. Each label span carries <code>[cngxActionStatusCell]</code>, so only the active cell is visible and names the button; the host brings its own look and the one-grid-cell stack rule for <code>.cngx-action-status-cell</code>. A <code>cngxSucceeded</code> template replaces a label, and its text is what the region speaks. The fixture sits next to this story as <code>_ejected-action.component.ts</code>. The dashed box below mirrors what a screen reader gets for both buttons.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['composition', 'async-state', 'a11y-pattern'],
  apiComponents: [
    'CngxActionStatusBrain',
    'CngxActionStatusCell',
    'CngxButtonBrain',
    'CngxAsyncClick',
    'CngxActionButton',
  ],
  moduleImports: [
    "import { CngxSucceeded } from '@cngx/common/interactive';",
    "import { EjectedAction } from './_ejected-action.component';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['EjectedAction', 'CngxSucceeded'],
  setup: `
  protected readonly save = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 1200));

  protected readonly remove = (): Promise<void> =>
    new Promise((_, reject) => setTimeout(() => reject(new Error('403 Forbidden')), 1000));`,
  template: `
  <div style="display:flex;gap:.5rem;align-items:center;flex-wrap:wrap">
    <button demoEjectedAction [action]="save" pendingLabel="Saving...">
      Save draft
      <ng-template cngxSucceeded>Draft saved</ng-template>
    </button>
    <button demoEjectedAction [action]="remove" pendingLabel="Deleting..." failedLabel="Not allowed">
      Delete
    </button>
  </div>`,
  setupChrome: `
  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'save', selector: 'button[demoejectedaction]:first-of-type' },
    { label: 'delete', selector: 'button[demoejectedaction]:last-of-type' },
  ]);`,
  templateChrome: `
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
        <dt>{{ row.label }} state</dt>
        <dd>aria-disabled {{ row.disabled }}, aria-busy {{ row.busy }}</dd>
      }
      @for (entry of sr.heard(); track entry.n) {
        <dt>announced #{{ entry.n }}</dt>
        <dd>{{ entry.text }}</dd>
      } @empty {
        <dt>announced</dt>
        <dd>-</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes, plus the last five texts written to a live region, newest last; none of it is painted. The name approximates accname: the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
