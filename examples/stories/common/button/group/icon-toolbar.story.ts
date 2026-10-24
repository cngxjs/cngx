import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxButtonGroup: Icon toolbar',
  subtitle: 'A group of groups: labelled sub-groups of icon buttons, spaced apart, one <code>variant</code> and <code>size</code> for all.',
  description: 'When the direct children of a group are groups, the outer group spaces them by <code>--cngx-button-group-gap</code> instead of joining them, floored to <code>--cngx-target-gap</code> on a coarse pointer. A nested group without its own <code>variant</code> or <code>size</code> inherits the outer one. Every group, outer and inner, needs a name, and every icon button needs its own <code>aria-label</code>. Each button is its own Tab stop; a roving-tabindex toolbar is a later addition.',
  level: 'molecule',
  audience: ['dev', 'a11y', 'design'],
  artifact: 'standalone',
  focus: ['composition', 'a11y-pattern'],
  apiComponents: ['CngxButtonGroup', 'CngxIconButton', 'CngxIcon'],
  moduleImports: [
    "import { CngxButtonGroup, CngxIconButton } from '@cngx/common/button';",
    "import { CngxIcon } from '@cngx/common/display';",
  ],
  imports: ['CngxButtonGroup', 'CngxIconButton', 'CngxIcon'],
  template: `
  <div cngxButtonGroup variant="outline" size="sm" aria-label="Editor actions">
    <div cngxButtonGroup aria-label="Clipboard">
      <button cngxIconButton aria-label="Cut">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="18" r="3" /><circle cx="18" cy="18" r="3" /><path d="M8.1 15.9 19 4M15.9 15.9 5 4" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton aria-label="Copy">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton aria-label="Paste">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1M9 10h6M9 14h6" /></svg>
        </cngx-icon>
      </button>
    </div>
    <div cngxButtonGroup aria-label="Zoom">
      <button cngxIconButton aria-label="Zoom out">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M8 11h6" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton aria-label="Zoom in">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4M8 11h6M11 8v6" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton aria-label="Fit to window">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
        </cngx-icon>
      </button>
    </div>
    <div cngxButtonGroup aria-label="History">
      <button cngxIconButton aria-label="Undo">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5" /><path d="M4 9h11a5 5 0 0 1 0 10h-3" /></svg>
        </cngx-icon>
      </button>
      <button cngxIconButton aria-label="Redo">
        <cngx-icon>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 14 5-5-5-5" /><path d="M20 9H9a5 5 0 0 0 0 10h3" /></svg>
        </cngx-icon>
      </button>
    </div>
  </div>`,
};
