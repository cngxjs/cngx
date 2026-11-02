import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Busy with cngxAsyncClick',
  subtitle: 'Co-host <code>cngxAsyncClick</code>: the label stays in place under a spinner while the action runs.',
  description: 'The button does not own async state; <code>cngxAsyncClick</code> on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. <code>aria-busy</code>, the double-click guard and the success or failure announcement all stay with <code>cngxAsyncClick</code>. Under reduced motion the ring stops turning. The label stays fixed on purpose: swapping it per status would change the accessible name under focus and the width after the run. Per-status labels belong to <code>CngxActionButton</code>. So the result of a run is not painted on the button at all: success and failure are spoken through the polite live region <code>cngxAsyncClick</code> renders next to the host. Toggle the failure switch to run the error path; the button looks the same either way, and the dashed box below mirrors what a screen reader gets.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxButton', 'CngxAsyncClick'],
  moduleImports: [
    "import { CngxButton } from '@cngx/common/button';",
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
  ],
  imports: ['CngxButton', 'CngxAsyncClick'],
  setup: `
  protected readonly fail = signal(false);

  protected readonly save = (): Promise<void> =>
    new Promise((resolve, reject) =>
      setTimeout(() => (this.fail() ? reject(new Error('Save failed')) : resolve()), 1500),
    );`,
  template: `
  <button cngxButton tone="primary" [cngxAsyncClick]="save" #btn="cngxAsyncClick">Save changes</button>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label><input type="checkbox" [checked]="fail()" (change)="fail.set(!fail())" /> Fail the next save</label>
  </div>
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      <dt>aria-busy</dt>
      <dd>{{ btn.pending() ? 'true' : '-' }}</dd>
      <dt>announced</dt>
      <dd>{{ btn.announcement() ? '"' + btn.announcement() + '"' : '-' }}</dd>
    </dl>
    <p class="cngx-ex-sr-output__note">
      Not shown on the button: the label stays fixed, the result is spoken only, for 2 s after the run settles.
    </p>
  </div>`,
};
