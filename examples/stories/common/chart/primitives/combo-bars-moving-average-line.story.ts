import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Combo bars moving-average line',
  subtitle:
    'Bars carry monthly values, an overlay line plots the 3-month moving average via a local <code>[data]</code> input. Both layers share scales; the band x-axis aligns ticks with bar centres rather than edges.',
  description:
    'Composes <code>&lt;cngx-chart&gt;</code>, two <code>cngxAxis</code> nodes, <code>cngxBar</code> for the monthly values, and a second <code>cngxLine</code> with its own <code>[data]</code> for the overlay. Shows how multiple atoms read the chart\'s axes while one of them overrides the dataset, all without forking the chart.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxChart', 'CngxAxis', 'CngxBar', 'CngxLine'],
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
    "import { CngxChart, CngxAxis, CngxLine, CngxBar } from '@cngx/common/chart';",
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxBar', 'CngxLine'],
  setup: `protected readonly months: readonly string[] = [
    'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec',
  ];
  protected readonly monthByIndex = (_: unknown, i: number): string => this.months[i];`,
  template: `  <div class="cngx-ex-chart-frame cngx-ex-chart-frame--bottom-axis-room">
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
        style="--cngx-line-color: var(--cngx-color-primary, #f5a623)"
      ></svg:g>
    </cngx-chart>
  </div>`,
};
