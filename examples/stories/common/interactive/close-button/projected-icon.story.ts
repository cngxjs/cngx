import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Projected icon',
  subtitle: 'Project any element into <code>&lt;cngx-close-button&gt;</code> to replace the default X glyph per-instance. The button shell, ARIA, focus ring, and click bubbling stay with the molecule.',
  description: 'The default template renders a stroke-style X SVG. When the consumer projects content into the host, that content replaces the default. The wrapping <code>&lt;button type="button"&gt;</code>, the host class, and the <code>aria-label</code> are unaffected. For app-wide swaps (every alert, toast, popover uses the same icon) prefer the <code>CNGX_CLOSE_ICON</code> DI token wired through <code>provideFeedback(withCloseIcon(...))</code>. Per-instance projection is for one-off chrome that does not warrant a global override.',
  level: 'molecule',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: [
    'CngxCloseButton',
  ],
  moduleImports: [
    'import { CngxCloseButton } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCloseButton'],
  template: `
  <div style="display:flex; gap:16px; align-items:center">
    <cngx-close-button label="Default close" />

    <cngx-close-button label="Close with circle">
      <svg viewBox="0 0 24 24" aria-hidden="true"
        fill="none" stroke="currentColor" stroke-width="2"
        style="width:1em; height:1em; display:block">
        <circle cx="12" cy="12" r="9" />
        <path d="M9 9l6 6M15 9l-6 6" />
      </svg>
    </cngx-close-button>

    <cngx-close-button label="Collapse">
      <svg viewBox="0 0 24 24" aria-hidden="true"
        fill="currentColor"
        style="width:1em; height:1em; display:block">
        <path d="M19 13H5v-2h14v2z" />
      </svg>
    </cngx-close-button>
  </div>`,
};
