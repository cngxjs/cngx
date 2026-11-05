import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButton: Custom spinner',
  subtitle: 'Swap the busy glyph of every button in a subtree with <code>provideButtonSpinner</code>.',
  description: 'The busy layer stays the same for every cngx button: it covers the label so the width never jumps, it is <code>aria-hidden</code>, and it follows the show delay and min-dwell of the run. Only the glyph inside it is replaceable. Provide a component with <code>provideButtonSpinner</code> (here in <code>viewProviders</code>, so only this demo is affected) and <code>cngxButton</code>, <code>cngxIconButton</code>, <code>cngxCloseButton</code>, the menu buttons and <code>cngxActionButton</code> render it in place of the ring. Without a provider the built-in ring renders. <code>aria-busy</code> and the spoken result come from <code>cngxAsyncClick</code> either way. The fixture sits next to this story as <code>_dots-spinner.component.ts</code>.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['async-state', 'visual-variants'],
  apiComponents: ['CngxButton', 'CngxIconButton', 'CngxAsyncClick'],
  moduleImports: [
    "import { CngxButton, CngxIconButton, provideButtonSpinner } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CngxAsyncClick } from '@cngx/common/interactive';",
    "import { DotsSpinner } from './_dots-spinner.component';",
  ],
  imports: ['CngxButton', 'CngxIconButton', 'CngxIcon', 'CngxAsyncClick'],
  viewProviders: ['provideButtonSpinner(DotsSpinner)'],
  setup: `
  protected readonly save = (): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, 1500));`,
  template: `
  <div class="demo-inline-actions">
    <button cngxButton tone="primary" [cngxAsyncClick]="save">Save changes</button>
    <button cngxIconButton aria-label="Sync" [cngxAsyncClick]="save">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" /></svg>
      </cngx-icon>
    </button>
  </div>`,
};
