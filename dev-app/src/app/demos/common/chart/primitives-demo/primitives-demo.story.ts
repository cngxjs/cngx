import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Chart Primitives',
  navLabel: 'Primitives',
  navCategory: 'chart',
  description:
    'Compose <cngx-chart> + <cngx-axis> + layer atoms (<cngx-line>, <cngx-area>, <cngx-bar>, <cngx-scatter>, <cngx-threshold>, <cngx-band>) directly. The seven preset molecules wrap these primitives; this demo shows the underlying composition.',
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
  overview:
    '<p>Every preset molecule is a thin wrapper over <code>&lt;cngx-chart&gt;</code> + axes + ' +
    'layer atoms. When the presets do not fit a use case (multi-layer dashboards, custom ' +
    'A11y wiring, mixed visualisations), compose the primitives directly. The full ' +
    'two-level CSS cascade and reactive ARIA contract is identical.</p>',
  moduleImports: [
    "import { CngxChart, CngxAxis, CngxLine, CngxArea, CngxThreshold, CngxBand } from '@cngx/common/chart';",
  ],
  sections: [
    {
      title: 'Line + area + threshold + band',
      subtitle: 'A multi-layer chart with a target threshold and a "watch zone" band.',
      imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxArea', 'CngxThreshold', 'CngxBand'],
      template: `
  <cngx-chart
    [data]="[8, 12, 14, 9, 18, 22, 25, 19, 16, 24, 28, 32]"
    [width]="480"
    [height]="160"
    aria-label="Monthly performance trend with watch-zone band and target threshold."
    style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px"
  >
    <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6"></svg:g>
    <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]"></svg:g>
    <svg:g cngxBand [from]="20" [to]="30" label="watch"></svg:g>
    <svg:g cngxArea></svg:g>
    <svg:g cngxLine [strokeWidth]="2"></svg:g>
    <svg:g cngxThreshold [value]="25" [label]="'target'" [dashed]="true"></svg:g>
  </cngx-chart>`,
    },
  ],
};
