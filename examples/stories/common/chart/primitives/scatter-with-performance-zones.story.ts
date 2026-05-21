import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Scatter with performance zones',
  subtitle:
    'Scatter plot of (price, sales) points layered over low / mid / high performance zones via three stacked <code>cngxBand</code>s. Bands span the full chart width; their Y range partitions the value space into traffic-light tiers.',
  description:
    'Composes <code>cngxScatter</code> with three <code>cngxBand</code>s that paint the qualitative tiers behind the points. Each band sets its colour through a public custom property so the visual tier is data-driven, not hard-coded into the scatter atom.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['composition', 'visual-variants'],
  apiComponents: ['CngxChart', 'CngxAxis', 'CngxScatter', 'CngxBand'],
  moduleImports: [
    "import { CngxChart, CngxAxis, CngxScatter, CngxBand } from '@cngx/common/chart';",
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxScatter', 'CngxBand'],
  setup: `protected readonly scatterData: readonly { x: number; y: number }[] = [
    { x: 12, y: 18 }, { x: 22, y: 24 }, { x: 18, y: 30 }, { x: 35, y: 42 },
    { x: 48, y: 55 }, { x: 56, y: 62 }, { x: 64, y: 78 }, { x: 72, y: 70 },
    { x: 80, y: 88 }, { x: 88, y: 82 }, { x: 30, y: 12 }, { x: 95, y: 60 },
  ];
  protected readonly scatterX = (d: { x: number; y: number }): number => d.x;
  protected readonly scatterY = (d: { x: number; y: number }): number => d.y;
  protected readonly priceFmt = (v: unknown): string => '$' + Number(v);`,
  template: `  <div style="border:1px solid var(--cngx-color-border, #e5e7eb); border-radius:4px; padding:8px; display:inline-block; max-width:100%; box-sizing:border-box">
    <cngx-chart
      [data]="scatterData"
      [summaryAccessor]="scatterY"
      [width]="500"
      [height]="240"
      aria-label="Price-vs-sales scatter with low, mid, and high performance zones."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 100]" [ticks]="6" [format]="priceFmt" [grid]="true"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 100]" [ticks]="6" [grid]="true"></svg:g>
      <svg:g cngxBand [from]="0" [to]="33" label="low"
        style="--cngx-band-color: var(--cngx-color-danger, #d2452f); --cngx-band-opacity: 0.10"
      ></svg:g>
      <svg:g cngxBand [from]="33" [to]="66" label="mid"
        style="--cngx-band-color: var(--cngx-color-warning, #f5a623); --cngx-band-opacity: 0.10"
      ></svg:g>
      <svg:g cngxBand [from]="66" [to]="100" label="high"
        style="--cngx-band-color: var(--cngx-color-success, #1f9d55); --cngx-band-opacity: 0.12"
      ></svg:g>
      <svg:g cngxScatter [x]="scatterX" [y]="scatterY" [radius]="5"></svg:g>
    </cngx-chart>
  </div>`,
};
