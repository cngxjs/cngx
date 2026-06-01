import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTooltip: Basic tooltip',
  subtitle:
    'Hover or focus the button to reveal the tooltip. Default placement is <code>top</code>, default open delay is 300 ms.',
  description:
    'A bare <code>cngxTooltip="..."</code> directive on three buttons. The directive creates a sibling <code>role="tooltip"</code> element, points the trigger\'s <code>aria-describedby</code> at it while visible, and unwinds both on blur or pointer leave.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'composition'],
  references: [
    {
      label: 'WAI-ARIA APG: Tooltip',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/',
    },
    {
      label: 'WCAG 1.4.13 Content on Hover or Focus',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html',
    },
  ],
  apiComponents: ['CngxTooltip'],
  moduleImports: ["import { CngxTooltip } from '@cngx/common/popover';"],
  imports: ['CngxTooltip'],
  template: `
  <div class="demo-popover-stage--tall" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">
    <button type="button" cngxTooltip="Save your changes (Ctrl+S)" class="chip">Save</button>
    <button type="button" cngxTooltip="Undo last action (Ctrl+Z)" class="chip">Undo</button>
    <button type="button" cngxTooltip="Redo last action (Ctrl+Y)" class="chip">Redo</button>
  </div>`,
};
