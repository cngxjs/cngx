import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Time-series with threshold zones',
  subtitle: 'Time axis with Date data + three stacked thresholds (target / warn / critical). The line and area atoms read x via the [xAccessor] callback projecting Date; the chart\'s [summaryAccessor] feeds the auto-summary and SR data table.',
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
    'import { CngxChart, CngxAxis, CngxLine, CngxArea, CngxThreshold } from \'@cngx/common/chart\';',
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxArea', 'CngxThreshold'],
  setup: `protected readonly latencyData: readonly { t: Date; v: number }[] = [
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
};`,
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
};
