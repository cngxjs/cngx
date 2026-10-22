import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Busy with cngxAsyncClick',
  subtitle: 'Co-host <code>cngxAsyncClick</code>: the label stays in place under a spinner while the action runs.',
  description: 'The button does not own async state; <code>cngxAsyncClick</code> on the same element does. While its action is pending the button keeps the label in the layout (invisible), so the width never jumps, and draws a spinner ring over it. <code>aria-busy</code>, the double-click guard and the success or failure announcement all stay with <code>cngxAsyncClick</code>. Under reduced motion the ring stops turning. Toggle the failure switch to see the error path.',
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
  <button cngxButton tone="primary" [cngxAsyncClick]="save" #btn="cngxAsyncClick">
    @switch (btn.status()) {
      @case ('success') { Saved }
      @case ('error') { Try again }
      @default { Save changes }
    }
  </button>`,
  templateChrome: `
  <div class="button-row" style="margin-top:12px">
    <label><input type="checkbox" [checked]="fail()" (change)="fail.set(!fail())" /> Fail the next save</label>
  </div>`,
};
