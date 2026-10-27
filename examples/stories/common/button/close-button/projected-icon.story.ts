import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Projected icon',
  subtitle: 'Project any glyph into <code>&lt;button cngxCloseButton&gt;</code> to replace the default X per instance. The name, the focus ring and the click stay with the button.',
  description: 'The default template renders a stroke-style X SVG. When you project content, it replaces the default; a <code>cngx-icon</code> sizes itself, a bare <code>svg</code> or <code>img</code> is sized to the button font. The glyph sits in an <code>aria-hidden</code> span, so projected text never becomes the name; <code>aria-label</code> on the host stays the only name. For app-wide swaps (every alert, toast, popover uses the same icon) prefer the <code>CNGX_CLOSE_ICON</code> DI token wired through <code>provideFeedback(withCloseIcon(...))</code>. Per-instance projection is for one-off chrome that does not warrant a global override.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxCloseButton', 'CngxIcon'],
  moduleImports: [
    "import { CngxCloseButton } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
  ],
  imports: ['CngxCloseButton', 'CngxIcon'],
  template: `
  <div style="display:flex; gap:16px; align-items:center">
    <button cngxCloseButton aria-label="Default close"></button>

    <button cngxCloseButton aria-label="Close with circle">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9l6 6M15 9l-6 6" />
        </svg>
      </cngx-icon>
    </button>

    <button cngxCloseButton aria-label="Collapse">
      <cngx-icon>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13H5v-2h14v2z" />
        </svg>
      </cngx-icon>
    </button>
  </div>`,
};
