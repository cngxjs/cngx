import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Responsive fills parent width',
  subtitle:
    'Omit <code>[width]</code> and <code>[height]</code> and the chart switches into responsive mode: the host fills the parent width while height derives from <code>--cngx-chart-aspect-ratio</code> (default 16/9). The internal resize observer drives the scales, so axes and layers re-flow on every container resize.',
  description:
    'Same composition as the static line-area-threshold-band demo, but the wrapper carries <code>resize: horizontal</code> so the reader can drag its right edge and watch the chart re-flow live. The atoms inside do not change; the chart\'s responsive mode owns the dimension math.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxArea', 'CngxThreshold', 'CngxBand'],
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
    "import { CngxChart, CngxAxis, CngxLine, CngxArea, CngxThreshold, CngxBand } from '@cngx/common/chart';",
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxArea', 'CngxThreshold', 'CngxBand'],
  template: `  <div class="cngx-ex-chart-frame cngx-ex-chart-frame--responsive">
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
  <p class="cngx-ex-status-readout" style="margin-top:8px">
    The wrapper has <code>resize: horizontal</code>; drag its right edge to resize. The chart re-flows live.
  </p>`,
};
