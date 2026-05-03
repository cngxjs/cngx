import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Chart Primitives',
  navLabel: 'Primitives',
  navCategory: 'chart',
  description:
    'Compose <cngx-chart> + [cngxAxis] + layer atoms ([cngxLine], [cngxArea], [cngxBar], [cngxScatter], [cngxThreshold], [cngxBand]) directly. The seven preset molecules wrap these primitives; this demo shows how to compose them.',
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
    'two-level CSS cascade and reactive ARIA contract is identical.</p>' +
    '<p>Layer atoms and <code>[cngxAxis]</code> are attribute directives applied to ' +
    '<code>&lt;svg:g&gt;</code> hosts so the SVG namespace boundary stays clean. Element ' +
    'selectors inside <code>&lt;svg&gt;</code> would create XHTML-namespaced wrappers and ' +
    'break layout for their SVG-namespaced children.</p>',
  moduleImports: [
    "import { CngxChart, CngxAxis, CngxLine, CngxArea, CngxBar, CngxScatter, CngxThreshold, CngxBand, CngxChartEmpty, CngxChartError } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
    "import { CngxEmptyState } from '@cngx/ui/empty-state';",
  ],
  setup: `
protected readonly monthFmt = (v: unknown): string => {
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const n = Number(v);
  return Number.isInteger(n) && n >= 0 && n < 12 ? months[n] : '';
};

protected readonly latencyData: readonly { t: Date; v: number }[] = [
  { t: new Date(2026, 0, 5), v: 145 },
  { t: new Date(2026, 0, 12), v: 168 },
  { t: new Date(2026, 0, 19), v: 192 },
  { t: new Date(2026, 0, 26), v: 220 },
  { t: new Date(2026, 1, 2), v: 285 },
  { t: new Date(2026, 1, 9), v: 240 },
  { t: new Date(2026, 1, 16), v: 195 },
];
protected readonly latencyDomain: readonly Date[] = [
  new Date(2026, 0, 5),
  new Date(2026, 1, 16),
];
protected readonly latencyTime = (d: { t: Date; v: number }): Date => d.t;
protected readonly latencyValue = (d: { t: Date; v: number }): number => d.v;
protected readonly dateFmt = (v: unknown): string => {
  const d = v instanceof Date ? v : new Date(Number(v));
  return d.toLocaleDateString('en', { month: 'short', day: '2-digit' });
};

protected readonly scatterData: readonly { x: number; y: number }[] = [
  { x: 12, y: 18 }, { x: 22, y: 24 }, { x: 18, y: 30 }, { x: 35, y: 42 },
  { x: 48, y: 55 }, { x: 56, y: 62 }, { x: 64, y: 78 }, { x: 72, y: 70 },
  { x: 80, y: 88 }, { x: 88, y: 82 }, { x: 30, y: 12 }, { x: 95, y: 60 },
];
protected readonly scatterX = (d: { x: number; y: number }): number => d.x;
protected readonly scatterY = (d: { x: number; y: number }): number => d.y;
protected readonly priceFmt = (v: unknown): string => '$' + Number(v);

protected readonly chartStateData: readonly number[] = [8, 12, 14, 9, 18, 22, 25, 19, 16, 24, 28, 32];
protected readonly chartState = createManualState<readonly number[]>();

protected showSkeleton(): void { this.chartState.reset(); this.chartState.set('loading'); }
protected showSuccess(): void { this.chartState.setSuccess(this.chartStateData); }
protected showEmpty(): void { this.chartState.reset(); this.chartState.setSuccess([]); }
protected showError(): void { this.chartState.reset(); this.chartState.setError(new Error('Telemetry feed offline')); }
`,
  sections: [
    {
      title: 'Line + area + threshold + band',
      subtitle: 'A multi-layer chart with a target threshold and a "watch zone" band.',
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
    },
    {
      title: 'Multi-series line',
      subtitle:
        'Two metrics on shared scales. The chart\'s [data] feeds the first line; the second line overrides via its own local [data] input. Per-line theming via the --cngx-line-color CSS variable.',
      imports: ['CngxChart', 'CngxAxis', 'CngxLine'],
      template: `
  <div style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px; display: inline-block; max-width: 100%; box-sizing: border-box">
  <cngx-chart
    [data]="[10, 12, 18, 22, 24, 28, 32, 30, 27, 26, 30, 35]"
    [width]="480"
    [height]="180"
    aria-label="Two-series traffic and error trend over twelve months."
  >
    <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6" [grid]="true"></svg:g>
    <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true"></svg:g>
    <svg:g cngxLine
      [strokeWidth]="2"
      style="--cngx-line-color: var(--primary, #3b82f6)"
    ></svg:g>
    <svg:g cngxLine
      [data]="[2, 4, 3, 8, 6, 5, 9, 12, 8, 10, 7, 6]"
      [strokeWidth]="2"
      style="--cngx-line-color: var(--danger, #d2452f)"
    ></svg:g>
  </cngx-chart>
  </div>
  <div style="display:flex;gap:16px;font-size:0.8125rem;color:var(--text-muted);margin-top:8px">
    <span><span style="display:inline-block;width:12px;height:2px;background:var(--primary,#3b82f6);vertical-align:middle;margin-right:4px"></span> Traffic</span>
    <span><span style="display:inline-block;width:12px;height:2px;background:var(--danger,#d2452f);vertical-align:middle;margin-right:4px"></span> Errors</span>
  </div>`,
    },
    {
      title: 'Combo: bars + moving-average line',
      subtitle:
        'Bars carry monthly values; an overlay line shows the 3-month moving average via local [data]. Both layers share the same scales — one X axis, one Y axis.',
      imports: ['CngxChart', 'CngxAxis', 'CngxBar', 'CngxLine'],
      template: `
  <div style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px; display: inline-block; max-width: 100%; box-sizing: border-box">
  <cngx-chart
    [data]="[8, 12, 14, 9, 18, 22, 25, 19, 16, 24, 28, 32]"
    [width]="520"
    [height]="200"
    aria-label="Monthly bars with three-month moving-average overlay."
  >
    <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="12" [format]="monthFmt"></svg:g>
    <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true"></svg:g>
    <svg:g cngxBar [gap]="0.18"></svg:g>
    <svg:g cngxLine
      [data]="[8, 10, 11.3, 11.7, 13.7, 16.3, 21.7, 22, 20, 19.7, 22.7, 28]"
      [strokeWidth]="2"
      style="--cngx-line-color: var(--accent, #f5a623)"
    ></svg:g>
  </cngx-chart>
  </div>`,
    },
    {
      title: 'Time-series with threshold zones',
      subtitle:
        'Time axis with Date data + three stacked thresholds (target / warn / critical). The line and area atoms read x via the [xAccessor] callback projecting Date; the chart\'s [summaryAccessor] feeds the auto-summary and SR data table.',
      imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxArea', 'CngxThreshold'],
      template: `
  <div style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px; display: inline-block; max-width: 100%; box-sizing: border-box">
  <cngx-chart
    [data]="latencyData"
    [summaryAccessor]="latencyValue"
    [width]="540"
    [height]="220"
    aria-label="P95 latency over six weeks with target, warn, and critical thresholds."
  >
    <svg:g cngxAxis position="bottom" type="time" [domain]="latencyDomain" [ticks]="6" [format]="dateFmt" [grid]="true"></svg:g>
    <svg:g cngxAxis position="left" type="linear" [domain]="[0, 500]" [grid]="true"></svg:g>
    <svg:g cngxArea [accessor]="latencyValue" [xAccessor]="latencyTime"></svg:g>
    <svg:g cngxLine [accessor]="latencyValue" [xAccessor]="latencyTime" [strokeWidth]="2"></svg:g>
    <svg:g cngxThreshold [value]="200" [label]="'target ≤ 200ms'" [dashed]="true"
      style="--cngx-threshold-color: var(--success, #1f9d55); --cngx-threshold-text-color: var(--success, #1f9d55)"
    ></svg:g>
    <svg:g cngxThreshold [value]="300" [label]="'warn'" [dashed]="true"
      style="--cngx-threshold-color: var(--warn, #f5a623); --cngx-threshold-text-color: var(--warn, #f5a623)"
    ></svg:g>
    <svg:g cngxThreshold [value]="400" [label]="'critical'" [dashed]="true"></svg:g>
  </cngx-chart>
  </div>`,
    },
    {
      title: 'Async state machine on the primitive',
      subtitle:
        'Bind [state] to <cngx-chart> and the primitive composition routes through loading / empty / error / content branches automatically. The default loading view is a centred spinner; default empty/error are inline text. Use the *cngxChartLoading / *cngxChartEmpty / *cngxChartError slots to project richer fallbacks (here: <cngx-empty-state> from @cngx/ui).',
      imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxArea', 'CngxThreshold', 'CngxBand', 'CngxChartEmpty', 'CngxChartError', 'CngxEmptyState'],
      template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (spinner)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
    <span style="font-size:0.75rem;color:var(--text-muted)">status: {{ chartState.status() }}</span>
  </div>
  <div style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px; display: inline-block; max-width: 100%; box-sizing: border-box">
  <cngx-chart
    [data]="chartStateData"
    [state]="chartState"
    [width]="480"
    [height]="200"
    aria-label="Telemetry feed with custom empty + error fallbacks."
  >
    <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6" [grid]="true"></svg:g>
    <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true"></svg:g>
    <svg:g cngxBand [from]="20" [to]="30" label="watch"></svg:g>
    <svg:g cngxArea></svg:g>
    <svg:g cngxLine [strokeWidth]="2"></svg:g>
    <svg:g cngxThreshold [value]="25" [label]="'target'" [dashed]="true"></svg:g>
    <ng-template cngxChartEmpty>
      <cngx-empty-state
        title="No telemetry yet"
        description="Connect a feed or pick a different time window."
      />
    </ng-template>
    <ng-template cngxChartError let-err="error">
      <cngx-empty-state
        title="Telemetry feed failed"
        [description]="err?.message ?? 'Try again in a moment.'"
      />
    </ng-template>
  </cngx-chart>
  </div>`,
    },
    {
      title: 'Responsive (fills parent width)',
      subtitle:
        'Omit [width]/[height] and the chart switches into responsive mode: host fills the parent width, height comes from the --cngx-chart-aspect-ratio CSS variable (default 16/9). The resize observer drives dimensions() which feeds the SVG sizing + scale math, so axes and layer atoms re-flow on every container resize. Open the dev tools and drag the viewport to see the live re-flow.',
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
  <p style="font-size:0.75rem;color:var(--text-muted);margin-top:8px">
    The wrapper has <code>resize: horizontal</code> — drag its right edge to resize.
    The chart re-flows live.
  </p>`,
    },
    {
      title: 'Scatter with performance zones',
      subtitle:
        'Scatter plot of (price, sales) points with low / mid / high performance zones via three stacked [cngxBand]s. Bands span the full chart width; their Y-range partitions the value space into traffic-light tiers.',
      imports: ['CngxChart', 'CngxAxis', 'CngxScatter', 'CngxBand'],
      template: `
  <div style="border:1px solid var(--border, #e5e7eb); border-radius: 4px; padding: 8px; display: inline-block; max-width: 100%; box-sizing: border-box">
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
      style="--cngx-band-color: var(--danger, #d2452f); --cngx-band-opacity: 0.10"
    ></svg:g>
    <svg:g cngxBand [from]="33" [to]="66" label="mid"
      style="--cngx-band-color: var(--warn, #f5a623); --cngx-band-opacity: 0.10"
    ></svg:g>
    <svg:g cngxBand [from]="66" [to]="100" label="high"
      style="--cngx-band-color: var(--success, #1f9d55); --cngx-band-opacity: 0.12"
    ></svg:g>
    <svg:g cngxScatter [x]="scatterX" [y]="scatterY" [radius]="5"></svg:g>
  </cngx-chart>
  </div>`,
    },
  ],
};
