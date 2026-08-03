import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: An HTML overlay aligned to the plot area',
  subtitle:
    'The chart publishes its resolved plot rectangle, so an HTML layer over the chart can cover the marks rather than the axis gutter. Toggle the alignment to see what the box-aligned version gets wrong.',
  description:
    'The overlay reads <code>plot</code> off the chart instance through its <code>exportAs</code> reference, which is the route an HTML sibling has. The four <code>--cngx-chart-plot-*</code> custom properties the chart writes to its own host carry the same numbers as percentages, but custom properties only inherit downwards and everything projected into <code>&lt;cngx-chart&gt;</code> lands inside its SVG - so an HTML overlay is always a sibling and never sees them. Use them from inside the chart subtree; use the instance from outside. Aligning to the host box instead puts the tint over the tick labels, which is the mistake the plot rectangle exists to prevent.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxChart', 'CngxAxis'],
  moduleImports: ["import { CngxChart, CngxLine, CngxAxis } from '@cngx/common/chart';"],
  imports: ['CngxChart', 'CngxLine', 'CngxAxis'],
  setup: `protected readonly load: readonly number[] = [
    18400, 24100, 31500, 27300, 44200, 52800, 48600, 61200, 57400, 72900, 68300, 80100,
  ];
  protected readonly thousands = (v: unknown): string => Number(v).toLocaleString('en-US');
  /**
   * viewBox units -> a percentage of the host box, which is what CSS
   * wants. The extent comes from the chart's own dimensions() rather
   * than from a copy of the bound width, so this works unchanged on a
   * responsive chart that has no [width] to copy.
   */
  protected readonly pct = (v: number, extent: number): string => \`\${(v / extent) * 100}%\`;`,
  template: `<div class="cngx-ex-chart-overlay-host">
    <cngx-chart
      #chart="cngxChart"
      [data]="load"
      [width]="480"
      [height]="200"
      aria-label="Request load by month"
    >
      <svg:g
        cngxAxis
        position="left"
        type="linear"
        [domain]="[0, 100000]"
        [format]="thousands"
        [grid]="true"
      ></svg:g>
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6"></svg:g>
      <svg:g cngxLine [data]="load"></svg:g>
    </cngx-chart>

    <!-- A sibling of the chart, so it reads the rectangle off the
         instance rather than inheriting the host custom properties. -->
    <div
      class="cngx-ex-plot-overlay"
      [style.left]="alignToPlot() ? pct(chart.plot().x0, chart.dimensions().width) : '0%'"
      [style.top]="alignToPlot() ? pct(chart.plot().y0, chart.dimensions().height) : '0%'"
      [style.width]="alignToPlot() ? pct(chart.plot().width, chart.dimensions().width) : '100%'"
      [style.height]="alignToPlot() ? pct(chart.plot().height, chart.dimensions().height) : '100%'"
    >
      <span>peak window</span>
    </div>
  </div>`,
  setupChrome: `protected readonly alignToPlot = signal(true);`,
  templateChrome: `<div class="button-row">
    <button type="button" (click)="alignToPlot.set(true)" [attr.aria-pressed]="alignToPlot()">
      Align to plot area
    </button>
    <button type="button" (click)="alignToPlot.set(false)" [attr.aria-pressed]="!alignToPlot()">
      Align to host box
    </button>
  </div>
  <p class="status-row">
    Overlay inset: {{ alignToPlot() ? 'plot area (covers only the marks)' : 'host box (covers the tick labels too)' }}
  </p>`,
};
