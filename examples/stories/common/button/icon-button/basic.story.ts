import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIconButton: Basic',
  subtitle: 'Square, icon-only, <code>ghost</code> by default; the accessible name is <code>aria-label</code>.',
  description: 'An icon button has no visible text, so its name comes from <code>aria-label</code> (or <code>aria-labelledby</code> / <code>title</code>); without one it warns <code>CNGX1071</code> in development. Name the action ("Delete row"), not the glyph ("Bin"). The box stays square at every size and matches the <code>md</code> button height; on a coarse pointer the hit area grows to 44px around the glyph without changing the visual size. A tooltip is optional and your call per icon: a close X or a bin needs none.',
  level: 'atom',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'visual-variants'],
  apiComponents: ['CngxIconButton', 'CngxIcon'],
  moduleImports: [
    "import { CngxIconButton } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
  ],
  imports: ['CngxIconButton', 'CngxIcon'],
  template: `
  <div style="display:flex; flex-direction:column; gap:16px">
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px">
      <button cngxIconButton aria-label="Edit row">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 20h4L19 9l-4-4L4 16v4z" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton="outline" aria-label="Duplicate row">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M4 16V4h12" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton="secondary" tone="primary" aria-label="Add row">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton tone="danger" aria-label="Delete row">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14" /></svg>
        </cngx-icon>
      </button>
    </div>
    <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px">
      <button cngxIconButton="outline" size="xs" aria-label="Add, extra small">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton="outline" size="sm" aria-label="Add, small">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton="outline" size="md" aria-label="Add, medium">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton="outline" size="lg" aria-label="Add, large">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </cngx-icon>
      </button>
    </div>
  </div>`,
};
