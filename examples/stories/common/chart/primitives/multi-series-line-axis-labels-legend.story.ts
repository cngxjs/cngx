import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Multi-series line + axis labels + legend',
  subtitle: 'Two metrics on shared scales. Adds [label]="..." on each axis for X/Y titles, and pairs the chart with a presentational <cngx-chart-legend> driven by an [items] array — decoupled from the layer atoms by design.',
  description: 'Compose <cngx-chart> + [cngxAxis] + layer atoms ([cngxLine], [cngxArea], [cngxBar], [cngxScatter], [cngxThreshold], [cngxBand]) directly. The seven preset molecules wrap these primitives; this demo shows how to compose them.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: [
    'CngxChart',
    'CngxAxis',
    'CngxLine',
    'CngxArea',
    'CngxBar',
    'CngxScatter',
    'CngxThreshold',
    'CngxBand',
  ],
  moduleImports: [
    'import { CngxChart, CngxAxis, CngxLine, CngxChartLegend } from \'@cngx/common/chart\';',
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxChartLegend'],
  setup: `protected readonly months: readonly string[] = [
  'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
];`,
  template: `
  <div style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px 8px 32px 40px; display: inline-block; max-width: 100%; box-sizing: border-box">
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
      style="--cngx-line-color: var(--primary, #3b82f6)"
    ></svg:g>
    <svg:g cngxLine
      [data]="[2, 4, 3, 8, 6, 5, 9, 12, 8, 10, 7, 6]"
      [strokeWidth]="2"
      style="--cngx-line-color: var(--danger, #d2452f)"
    ></svg:g>
  </cngx-chart>
  </div>
  <cngx-chart-legend
    [items]="[
      { label: 'Traffic', color: 'var(--primary, #3b82f6)' },
      { label: 'Errors',  color: 'var(--danger, #d2452f)' }
    ]"
    style="margin-top:8px"
  />`,
};
