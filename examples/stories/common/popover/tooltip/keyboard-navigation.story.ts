import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Keyboard Navigation',
  subtitle: 'Tab through the buttons — tooltips appear on focus with a 50ms debounce to prevent screen reader announcement storms. Press Escape to dismiss without closing parent overlays.',
  description: 'String-input tooltip directive using the native Popover API. CSS Anchor Positioning, WCAG 1.4.13 compliant, SR-friendly.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxTooltip',
  ],
  moduleImports: [
    'import { CngxTooltip } from \'@cngx/common/popover\';',
  ],
  imports: ['CngxTooltip'],
  template: `
  <p style="font-size:0.875rem;color:var(--cngx-text-secondary,#666);margin-bottom:12px">
    Use Tab/Shift+Tab to navigate. Each button shows its tooltip on focus.
  </p>
  <div style="display:flex;gap:12px;flex-wrap:wrap;padding-top:20px">
    <button cngxTooltip="Bold text" class="chip">B</button>
    <button cngxTooltip="Italic text" class="chip">I</button>
    <button cngxTooltip="Underline text" class="chip">U</button>
    <button cngxTooltip="Strikethrough" class="chip">S</button>
    <button cngxTooltip="Insert link" class="chip">Link</button>
    <button cngxTooltip="Insert image" class="chip">Img</button>
  </div>`,
};
