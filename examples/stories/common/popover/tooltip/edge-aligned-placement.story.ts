import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTooltip: Edge-aligned placement',
  subtitle:
    'The eight <code>-start</code> / <code>-end</code> placements line the tooltip up with one edge of the trigger.',
  description:
    'Each tooltip text is wider than its trigger, so the aligned edge is visible: <code>bottom-start</code> shares the trigger\'s start edge, <code>right-end</code> its bottom edge. The <code>tooltipOffset</code> gap (8px by default) sits on the main axis only, between trigger and tooltip; the cross axis stays flush. In browsers that support CSS Anchor Positioning the gap is a main-axis margin, the Floating UI fallback produces the same geometry through its offset middleware. Under <code>dir="rtl"</code> the start and end edges mirror.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants', 'rtl'],
  apiComponents: ['CngxTooltip'],
  moduleImports: ["import { CngxTooltip } from '@cngx/common/popover';"],
  imports: ['CngxTooltip'],
  template: `
  <div style="display:grid;grid-template-columns:repeat(4,auto);gap:56px 24px;justify-content:center;
              padding:64px 200px">
    <button type="button" cngxTooltip="Aligned to the start edge" tooltipPlacement="top-start" class="chip">top-start</button>
    <button type="button" cngxTooltip="Aligned to the end edge" tooltipPlacement="top-end" class="chip">top-end</button>
    <button type="button" cngxTooltip="Aligned to the start edge" tooltipPlacement="bottom-start" class="chip">bottom-start</button>
    <button type="button" cngxTooltip="Aligned to the end edge" tooltipPlacement="bottom-end" class="chip">bottom-end</button>
    <button type="button" cngxTooltip="Aligned to the top edge" tooltipPlacement="right-start" class="chip">right-start</button>
    <button type="button" cngxTooltip="Aligned to the bottom edge" tooltipPlacement="right-end" class="chip">right-end</button>
    <button type="button" cngxTooltip="Aligned to the top edge" tooltipPlacement="left-start" class="chip">left-start</button>
    <button type="button" cngxTooltip="Aligned to the bottom edge" tooltipPlacement="left-end" class="chip">left-end</button>
  </div>`,
};
