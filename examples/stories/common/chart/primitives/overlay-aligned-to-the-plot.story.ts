import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: An HTML overlay aligned to the plot area',
  subtitle:
    'Project an *cngxChartOverlay template and the chart lays your HTML over the marks itself. Toggle the alignment to see what a box-aligned overlay gets wrong.',
  description:
    'The <code>*cngxChartOverlay</code> slot renders your HTML in the plot area, inset by the chart. There is no <code>exportAs</code>, no <code>plot()</code>/<code>dimensions()</code> division, and no wrapper you have to remember to make a containing block: the frame the chart emits is already the marks rectangle, so the tint fills it with <code>inset: 0</code>. The box-aligned mistake this exists to prevent is the toggle: negating the four <code>--cngx-chart-plot-*</code> custom properties expands the tint back out over the tick labels, which is what aligning to the host box would do. Reach for the instance (<code>#chart="cngxChart"</code>, <code>plot()</code>) only when the overlay must live outside the chart box, or when you need the rectangle in TypeScript rather than in a template.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxChart', 'CngxChartOverlay', 'CngxAxis'],
  moduleImports: [
    "import { CngxChart, CngxLine, CngxAxis, CngxChartOverlay } from '@cngx/common/chart';",
  ],
  imports: ['CngxChart', 'CngxLine', 'CngxAxis', 'CngxChartOverlay'],
  setup: `protected readonly load: readonly number[] = [
    18400, 24100, 31500, 27300, 44200, 52800, 48600, 61200, 57400, 72900, 68300, 80100,
  ];
  protected readonly thousands = (v: unknown): string => Number(v).toLocaleString('en-US');`,
  template: `<cngx-chart
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

    <!-- The chart positions this frame over the plot area itself. The tint
         fills it with inset: 0; the box-aligned toggle negates the plot
         custom properties to expand back over the tick labels. -->
    <ng-template cngxChartOverlay>
      <div class="cngx-ex-plot-overlay" [style.inset]="alignToPlot() ? '0' : boxInset">
        <span>peak window</span>
      </div>
    </ng-template>
  </cngx-chart>`,
  setupChrome: `protected readonly alignToPlot = signal(true);
  /**
   * Inside the chart subtree the four --cngx-chart-plot-* percentages are
   * readable, so negating them expands the tint from the plot frame back
   * out to the host box - the misalignment that covers the tick labels.
   */
  protected readonly boxInset =
    'calc(-1 * var(--cngx-chart-plot-block-start, 0px)) calc(-1 * var(--cngx-chart-plot-inline-end, 0px)) calc(-1 * var(--cngx-chart-plot-block-end, 0px)) calc(-1 * var(--cngx-chart-plot-inline-start, 0px))';`,
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
