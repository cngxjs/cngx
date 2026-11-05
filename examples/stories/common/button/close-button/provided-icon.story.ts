import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Provided icon',
  subtitle: 'Swap the close glyph of every close button in a subtree with <code>provideCloseIcon</code>.',
  description: 'Provide a component with <code>provideCloseIcon</code> (the <code>CNGX_CLOSE_ICON</code> token) and every <code>cngxCloseButton</code> below the provider that projects nothing renders it in place of the default X. Here it sits in <code>viewProviders</code>, so only this demo is affected; at the app root it reaches alerts, toasts, banners and popovers too (<code>provideFeedback(withCloseIcon(...))</code> forwards to it). A projected glyph still wins on its own button, as the third button shows. The glyph stays in the <code>aria-hidden</code> span, so <code>aria-label</code> on the host remains the name. The fixture sits next to this story as <code>_circle-close.component.ts</code>. The dashed box below mirrors the role and name a screen reader gets for each button: the names are exposed, not painted, whichever glyph renders.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxCloseButton', 'CngxIcon'],
  moduleImports: [
    "import { CngxCloseButton, provideCloseIcon } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
    "import { CircleClose } from './_circle-close.component';",
    "import { mirrorScreenReader } from '../../../../fixtures';",
  ],
  imports: ['CngxCloseButton', 'CngxIcon'],
  viewProviders: ['provideCloseIcon(CircleClose)'],
  template: `
  <div class="demo-inline-actions">
    <button cngxCloseButton aria-label="Close panel"></button>
    <button cngxCloseButton aria-label="Dismiss notice"></button>
    <button cngxCloseButton aria-label="Collapse">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 13H5v-2h14v2z" /></svg>
      </cngx-icon>
    </button>
  </div>`,
  setupChrome: `
  // Mirrors the accessibility layer of the buttons into the box below.
  protected readonly sr = mirrorScreenReader([
    { label: 'panel', selector: 'button[cngxclosebutton]:nth-of-type(1)' },
    { label: 'notice', selector: 'button[cngxclosebutton]:nth-of-type(2)' },
    { label: 'collapse', selector: 'button[cngxclosebutton]:nth-of-type(3)' },
  ]);`,
  templateChrome: `
  <div class="cngx-ex-sr-output">
    <p class="cngx-ex-sr-output__title">Screen reader hears</p>
    <dl class="cngx-ex-sr-output__list">
      @for (row of sr.rows(); track row.label) {
        <dt>{{ row.label }} role</dt>
        <dd>{{ row.role }}</dd>
        <dt>{{ row.label }} name</dt>
        <dd>"{{ row.name }}"</dd>
      }
    </dl>
    <p class="cngx-ex-sr-output__note">
      Read live from the DOM attributes the accessibility layer exposes; the names are not painted, the provided and the projected glyph are both aria-hidden. The name approximates accname: aria-labelledby, then aria-label, then the text without aria-hidden or hidden parts; the browser accessibility tree stays the reference.
    </p>
  </div>`,
};
