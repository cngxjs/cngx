import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTooltip: Placement',
  subtitle:
    'Set <code>tooltipPlacement</code> to position the tooltip relative to the trigger.',
  description:
    'Four cardinal placements (<code>top</code>, <code>bottom</code>, <code>left</code>, <code>right</code>) routed through the directive\'s placement effect. In browsers that support CSS Anchor Positioning the value resolves via <code>POSITION_AREA</code>; the Floating UI fallback maps it through <code>FLOATING_PLACEMENT</code> when <code>provideFloatingFallback()</code> is registered.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition'],
  apiComponents: ['CngxTooltip'],
  moduleImports: ["import { CngxTooltip } from '@cngx/common/popover';"],
  imports: ['CngxTooltip'],
  template: `
  <div style="display:grid;grid-template-columns:repeat(3,auto);gap:16px;justify-content:center;
              padding:60px 20px">
    <span></span>
    <button type="button" cngxTooltip="Top tooltip" tooltipPlacement="top" class="chip">Top</button>
    <span></span>
    <button type="button" cngxTooltip="Left tooltip" tooltipPlacement="left" class="chip">Left</button>
    <span></span>
    <button type="button" cngxTooltip="Right tooltip" tooltipPlacement="right" class="chip">Right</button>
    <span></span>
    <button type="button" cngxTooltip="Bottom tooltip" tooltipPlacement="bottom" class="chip">Bottom</button>
    <span></span>
  </div>`,
};
