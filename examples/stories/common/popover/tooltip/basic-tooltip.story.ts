import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic Tooltip',
  subtitle: 'Hover or focus the button to see the tooltip. Default placement is <code>top</code>, default delay is 300ms.',
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
  <div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;padding-top:40px">
    <button cngxTooltip="Save your changes (Ctrl+S)" class="chip">Save</button>
    <button cngxTooltip="Undo last action (Ctrl+Z)" class="chip">Undo</button>
    <button cngxTooltip="Redo last action (Ctrl+Y)" class="chip">Redo</button>
  </div>`,
};
