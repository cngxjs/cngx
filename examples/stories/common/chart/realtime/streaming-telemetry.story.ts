import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Streaming telemetry with injectChartBuffer',
  subtitle:
    'Feed a high-frequency producer through <code>injectChartBuffer</code> - a bounded ring buffer with LTTB downsampling and an rAF flush window - straight into <code>[data]</code>. Past the 500-point threshold the chart auto-promotes to the Canvas backend; <code>&lt;cngx-chart-announcer&gt;</code> voices trend flips and threshold crossings to assistive technology.',
  description:
    'The buffer caps at 1000 samples and downsamples to 600 perceptually-faithful points, so the sine + occasional spike keeps its shape without unbounded DOM growth. Toggle the connection to see the <code>[connectionState]</code> reconnecting overlay - a channel independent of the data <code>[state]</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'integration'],
  apiComponents: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxThreshold', 'CngxChartAnnouncer'],
  references: [
    {
      label: 'W3C WAI-ARIA: aria-live regions',
      href: 'https://www.w3.org/WAI/ARIA/apg/practices/live-regions/',
    },
    {
      label: 'LTTB downsampling (Steinarsson 2013)',
      href: 'https://skemman.is/handle/1946/15343',
    },
  ],
  moduleImports: [
    "import { injectChartBuffer, CngxChart, CngxAxis, CngxLine, CngxThreshold, CngxChartAnnouncer } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
    "import { inject, DestroyRef, afterNextRender } from '@angular/core';",
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxLine', 'CngxThreshold', 'CngxChartAnnouncer'],
  setup: `protected readonly buffer = injectChartBuffer<number>({
    capacity: 1000,
    downsampleTo: 600,
    xAccessor: (_d, i) => i,
    yAccessor: (d) => d,
  });
  protected readonly connection = createManualState<unknown>();`,
  setupChrome: `private readonly destroyRef = inject(DestroyRef);
  private tick = 0;
  private feed: ReturnType<typeof setInterval> | undefined;
  private readonly autostart = afterNextRender(() => this.startFeed());
  protected startFeed(): void {
    if (this.feed) {
      return;
    }
    this.feed = setInterval(() => {
      this.tick++;
      const sine = 50 + 30 * Math.sin(this.tick / 8);
      const spike = this.tick % 90 === 0 ? 45 : 0;
      this.buffer.push(sine + spike);
    }, 16);
    this.destroyRef.onDestroy(() => {
      if (this.feed) {
        clearInterval(this.feed);
      }
    });
  }
  protected toggleConnection(): void {
    if (this.connection.status() === 'refreshing') {
      this.connection.setSuccess(undefined);
    } else {
      this.connection.set('refreshing');
    }
  }`,
  templateChrome: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="toggleConnection()">toggle connection</button>
  </div>
  <div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">points: {{ buffer.length() }} · connection: {{ connection.status() }}</span>
  </div>`,
  template: `  <div class="cngx-ex-chart-frame cngx-ex-chart-frame--bottom-axis-room cngx-ex-chart-frame--left-axis-room">
    <cngx-chart
      #chart
      [data]="buffer.points()"
      [connectionState]="connection"
      [width]="480"
      [height]="200"
      aria-label="Live streaming telemetry buffered through injectChartBuffer."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 600]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 100]"></svg:g>
      <svg:g cngxLine></svg:g>
      <svg:g cngxThreshold [value]="80" [label]="'alert'" [dashed]="true"></svg:g>
    </cngx-chart>
    <cngx-chart-announcer [cngxChartAnnouncer]="chart" />
  </div>`,
};
