import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Placement',
  subtitle: 'Set <code>tooltipPlacement</code> to position the tooltip relative to the trigger.',
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
  <div style="display:grid;grid-template-columns:repeat(3,auto);gap:16px;justify-content:center;
              padding:60px 20px">
    <span></span>
    <button cngxTooltip="Top tooltip" tooltipPlacement="top" class="chip">Top</button>
    <span></span>
    <button cngxTooltip="Left tooltip" tooltipPlacement="left" class="chip">Left</button>
    <span></span>
    <button cngxTooltip="Right tooltip" tooltipPlacement="right" class="chip">Right</button>
    <span></span>
    <button cngxTooltip="Bottom tooltip" tooltipPlacement="bottom" class="chip">Bottom</button>
    <span></span>
  </div>`,
};
