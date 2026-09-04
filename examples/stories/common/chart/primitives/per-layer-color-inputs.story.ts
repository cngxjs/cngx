import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Per-layer [color] inputs',
  subtitle:
    'Every mark layer accepts a <code>[color]</code> input that wins over the CSS token cascade for that one layer - line, area, bar, scatter, threshold and band all share the contract. Unbound layers keep resolving <code>--cngx-line-color</code> and friends.',
  description:
    'Binds [color] on two of the three lines and on the threshold while the third line stays on the token cascade. The bound color survives the SVG-to-Canvas auto-switch because it travels inside the layer geometry, not in a stylesheet.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxThreshold'],
  references: [
    {
      label: 'WCAG 1.4.1 Use of Color',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html',
    },
  ],
  moduleImports: [
    "import { CngxChart, CngxAxis, CngxLine, CngxThreshold } from '@cngx/common/chart';",
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxThreshold'],
  setup: `protected readonly requests: readonly number[] = [12, 18, 15, 22, 26, 24, 30, 34, 31, 38];
  protected readonly errors: readonly number[] = [2, 3, 2, 5, 4, 6, 5, 8, 7, 9];
  protected readonly saturation: readonly number[] = [20, 21, 24, 23, 27, 29, 28, 33, 35, 36];`,
  template: `  <div class="cngx-ex-chart-frame">
    <cngx-chart
      [data]="requests"
      [width]="480"
      [height]="180"
      aria-label="Requests, errors and saturation series with a capacity threshold. Errors render in the danger color, saturation in violet, requests in the theme default."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 9]" [ticks]="5" [grid]="true"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true"></svg:g>
      <svg:g cngxLine [strokeWidth]="2"></svg:g>
      <svg:g cngxLine [data]="errors" [color]="'oklch(0.55 0.19 25)'" [strokeWidth]="2"></svg:g>
      <svg:g cngxLine [data]="saturation" [color]="'oklch(0.55 0.2 300)'" [strokeWidth]="2"></svg:g>
      <svg:g cngxThreshold [value]="32" [label]="'capacity'" [color]="'oklch(0.55 0.2 300)'" [dashed]="true"></svg:g>
    </cngx-chart>
  </div>`,
};
