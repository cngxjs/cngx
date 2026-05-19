import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Line + area + threshold + band',
  subtitle: 'A multi-layer chart with a target threshold and a "watch zone" band.',
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
    'import { CngxChart, CngxAxis, CngxLine, CngxArea, CngxThreshold, CngxBand } from \'@cngx/common/chart\';',
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxArea', 'CngxThreshold', 'CngxBand'],
  template: `
  <div style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px; display: inline-block; max-width: 100%; box-sizing: border-box">
    <cngx-chart
      [data]="[8, 12, 14, 9, 18, 22, 25, 19, 16, 24, 28, 32]"
      [width]="480"
      [height]="160"
      aria-label="Monthly performance trend with watch-zone band and target threshold."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6" [grid]="true"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true"></svg:g>
      <svg:g cngxBand [from]="20" [to]="30" label="watch"></svg:g>
      <svg:g cngxArea></svg:g>
      <svg:g cngxLine [strokeWidth]="2"></svg:g>
      <svg:g cngxThreshold [value]="25" [label]="'target'" [dashed]="true"></svg:g>
    </cngx-chart>
  </div>`,
};
