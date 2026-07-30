import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Warming series',
  subtitle:
    'A live-polling chart passes through a one-datum state on every reload. With no <code>[points]</code> binding the default <code>auto</code> mode marks that lone reading, so the chart never reads as broken while the buffer warms.',
  description:
    'Append readings one at a time. At a single datum, <code>cngxArea</code> + <code>cngxLine</code> would each draw an invisible zero-length path; instead the default <code>points="auto"</code> paints one dot. From the second reading on, the line and area take over and the dot disappears. The artifact binds no <code>[points]</code> - the fix is zero-config.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxChart', 'CngxAxis', 'CngxArea', 'CngxLine'],
  references: [
    {
      label: 'WCAG 1.1.1 Non-text Content',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/non-text-content.html',
    },
  ],
  moduleImports: [
    "import { CngxChart, CngxAxis, CngxArea, CngxLine } from '@cngx/common/chart';",
    "import { signal } from '@angular/core';",
  ],
  imports: ['CngxChart', 'CngxAxis', 'CngxArea', 'CngxLine'],
  setup: `protected readonly series = signal<readonly number[]>([]);`,
  setupChrome: `private readonly pool = [14, 22, 9, 27, 18, 25, 12, 20, 16, 24];
  protected appendReading(): void {
    const current = this.series();
    if (current.length >= this.pool.length) {
      return;
    }
    this.series.set([...current, this.pool[current.length]]);
  }
  protected resetSeries(): void {
    this.series.set([]);
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="appendReading()">Add reading</button>
    <button type="button" class="chip" (click)="resetSeries()">Reset</button>
    <span class="cngx-ex-status-readout">{{ series().length }} reading(s)</span>
  </div>`,
  template: `  <div class="cngx-ex-chart-frame cngx-ex-chart-frame--left-axis-room">
    <cngx-chart
      [data]="series()"
      [width]="480"
      [height]="160"
      aria-label="Readings collected so far while the buffer warms up."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 9]" [ticks]="5"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 30]" [grid]="true"></svg:g>
      <svg:g cngxArea></svg:g>
      <svg:g cngxLine [strokeWidth]="2"></svg:g>
    </cngx-chart>
  </div>`,
};
