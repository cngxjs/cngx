import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Multi series line axis labels legend',
  subtitle:
    'Two metrics on shared scales, each axis carries a <code>label</code>, and a presentational <code>&lt;cngx-chart-legend&gt;</code> reads an <code>[items]</code> array independent of the layer atoms.',
  description:
    'Composes two <code>cngxLine</code> atoms on the same axes (one inherits the chart\'s <code>[data]</code>, the other supplies its own array) and pairs the chart with a sibling legend. The legend stays decoupled from the lines, so it can be moved, restyled, or replaced without touching the chart body.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxChartLegend'],
  references: [
    {
      label: 'WCAG 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    },
    {
      label: 'W3C WAI: Complex images',
      href: 'https://www.w3.org/WAI/tutorials/images/complex/',
    },
  ],
  moduleImports: [
    "import { CngxChart, CngxAxis, CngxLine, CngxChartLegend } from '@cngx/common/chart';",
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxChartLegend'],
  template: `  <div class="cngx-ex-chart-frame cngx-ex-chart-frame--bottom-axis-room cngx-ex-chart-frame--left-axis-room">
    <cngx-chart
      [data]="[10, 12, 18, 22, 24, 28, 32, 30, 27, 26, 30, 35]"
      [width]="480"
      [height]="200"
      aria-label="Two-series traffic and error trend over twelve months."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6" [grid]="true" label="Months"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true" label="Requests / sec"></svg:g>
      <svg:g cngxLine
        [strokeWidth]="2"
        style="--cngx-line-color: var(--cngx-color-primary, #3b82f6)"
      ></svg:g>
      <svg:g cngxLine
        [data]="[2, 4, 3, 8, 6, 5, 9, 12, 8, 10, 7, 6]"
        [strokeWidth]="2"
        style="--cngx-line-color: var(--cngx-color-danger, #d2452f)"
      ></svg:g>
    </cngx-chart>
  </div>
  <cngx-chart-legend
    [items]="[
      { label: 'Traffic', color: 'var(--cngx-color-primary, #3b82f6)' },
      { label: 'Errors',  color: 'var(--cngx-color-danger, #d2452f)' }
    ]"
    style="margin-top:8px"
  />`,
};
