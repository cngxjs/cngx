import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Combo: bars + moving-average line',
  subtitle: 'Bars carry monthly values; an overlay line shows the 3-month moving average via local [data]. Both layers share the same scales — one X axis, one Y axis. Uses a band X axis so tick labels align with bar centres (a linear axis would place ticks at bar edges).',
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
    'import { CngxChart, CngxAxis, CngxLine, CngxBar } from \'@cngx/common/chart\';',
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxBar', 'CngxLine'],
  setup: `protected readonly months: readonly string[] = [
  'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'
];
protected readonly monthByIndex = (_: unknown, i: number): string => this.months[i];`,
  template: `
  <div style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px 8px 32px 8px; display: inline-block; max-width: 100%; box-sizing: border-box">
  <cngx-chart
    [data]="[8, 12, 14, 9, 18, 22, 25, 19, 16, 24, 28, 32]"
    [width]="520"
    [height]="200"
    aria-label="Monthly bars with three-month moving-average overlay."
  >
    <svg:g cngxAxis position="bottom" type="band" [domain]="months"></svg:g>
    <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true"></svg:g>
    <svg:g cngxBar [gap]="0.18"></svg:g>
    <svg:g cngxLine
      [data]="[8, 10, 11.3, 11.7, 13.7, 16.3, 21.7, 22, 20, 19.7, 22.7, 28]"
      [xAccessor]="monthByIndex"
      [strokeWidth]="2"
      style="--cngx-line-color: var(--accent, #f5a623)"
    ></svg:g>
  </cngx-chart>
  </div>`,
};
