import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTooltip: Keyboard navigation',
  subtitle:
    'Tab through the buttons. Each focus event opens its tooltip after a 50 ms debounce; Escape dismisses without bubbling to a parent dialog.',
  description:
    'A toolbar of six tooltipped buttons. The focus handler installs a 50 ms <code>FOCUS_DEBOUNCE_MS</code> timer before calling <code>show()</code>, preventing a flood of SR announcements when the user holds Tab. The Escape handler calls <code>stopPropagation()</code> so it can close the tooltip without also closing an enclosing dialog or popover.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Tooltip',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/',
    },
    {
      label: 'WCAG 2.1.1 Keyboard',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html',
    },
  ],
  apiComponents: ['CngxTooltip'],
  moduleImports: ["import { CngxTooltip } from '@cngx/common/popover';"],
  imports: ['CngxTooltip'],
  template: `
  <p class="demo-tooltip-caption">
    Use Tab / Shift+Tab to navigate. Each button reveals its tooltip on focus.
  </p>
  <div class="demo-popover-stage" style="display:flex;gap:12px;flex-wrap:wrap">
    <button type="button" cngxTooltip="Bold text" class="chip">B</button>
    <button type="button" cngxTooltip="Italic text" class="chip">I</button>
    <button type="button" cngxTooltip="Underline text" class="chip">U</button>
    <button type="button" cngxTooltip="Strikethrough" class="chip">S</button>
    <button type="button" cngxTooltip="Insert link" class="chip">Link</button>
    <button type="button" cngxTooltip="Insert image" class="chip">Img</button>
  </div>`,
};
