import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Line area threshold band',
  subtitle:
    'A multi-layer chart that stacks band, area, line, and threshold over the same axes. The "watch zone" band sits behind the line; the threshold draws a dashed target across the chart.',
  description:
    'Composes the four most common annotation layers in declaration order: a value band, an area fill, the line, and a threshold marker. Each layer reads the same axes, so they remain in sync without coupling between atoms.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
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
  template: `  <div class="cngx-ex-chart-frame">
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
