import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Responsive (fills parent width)',
  subtitle: 'Omit [width]/[height] and the chart switches into responsive mode: host fills the parent width, height comes from the --cngx-chart-aspect-ratio CSS variable (default 16/9). The resize observer drives dimensions() which feeds the SVG sizing + scale math, so axes and layer atoms re-flow on every container resize. Open the dev tools and drag the viewport to see the live re-flow.',
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
  <div style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px; resize: horizontal; overflow: auto; max-width: 600px; min-width: 0; width: 100%; box-sizing: border-box">
    <cngx-chart
      [data]="[8, 12, 14, 9, 18, 22, 25, 19, 16, 24, 28, 32]"
      aria-label="Responsive monthly performance trend with watch-zone band and target threshold."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6" [grid]="true"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true"></svg:g>
      <svg:g cngxBand [from]="20" [to]="30" label="watch"></svg:g>
      <svg:g cngxArea></svg:g>
      <svg:g cngxLine [strokeWidth]="2"></svg:g>
      <svg:g cngxThreshold [value]="25" [label]="'target'" [dashed]="true"></svg:g>
    </cngx-chart>
  </div>
  <p style="font-size:0.75rem;color:var(--cngx-color-text-muted);margin-top:8px">
    The wrapper has <code>resize: horizontal</code> — drag its right edge to resize.
    The chart re-flows live.
  </p>`,
};
