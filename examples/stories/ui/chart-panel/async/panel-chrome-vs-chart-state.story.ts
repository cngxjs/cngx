import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChartPanel: Panel chrome vs chart state',
  subtitle:
    "Two independent async envelopes. The chart's <code>[state]</code> drives the body; the panel's <code>[state]</code> only dims the header actions. Neither reaches into the other.",
  description:
    'This is the demarcation the panel exists to hold. cngx-chart already owns the data-level view switch, its skeleton and error surfaces and its SR data table; reproducing that in the panel would put two managers on one state. Drive the two rows independently: a busy panel never blanks the chart, and a loading chart never dims the actions. aria-busy sits on the header, not on the group - on the region it would hold back the chart own live announcements and claim a stable chart is updating.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'integration'],
  apiComponents: ['CngxChartPanel'],
  moduleImports: [
    "import { CngxChartPanel, CngxChartPanelTitle, CngxChartPanelActions } from '@cngx/ui/chart-panel';",
    "import { CngxChart, CngxLine, CngxAxis } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxChartPanel',
    'CngxChartPanelTitle',
    'CngxChartPanelActions',
    'CngxChart',
    'CngxLine',
    'CngxAxis',
  ],
  setup: `protected readonly series: readonly number[] = [42, 51, 47, 63, 58, 71, 69, 82];

  /** Drives the chart body - skeleton, content, error. */
  protected readonly chartState = createManualState<readonly number[]>();

  /** Drives panel chrome only - a range switch, an export, a re-query. */
  protected readonly panelState = createManualState<void>();`,
  setupChrome: `protected chartLoading(): void {
    this.chartState.reset();
    this.chartState.set('loading');
  }
  protected chartSuccess(): void {
    this.chartState.setSuccess(this.series);
  }
  protected chartError(): void {
    this.chartState.reset();
    this.chartState.set('loading');
    this.chartState.setError(new Error('Series unavailable'));
  }
  protected panelBusy(): void {
    this.panelState.set('pending');
  }
  protected panelIdle(): void {
    this.panelState.reset();
  }`,
  template: `<cngx-chart-panel [state]="panelState" style="max-width:520px">
    <h3 cngxChartPanelTitle>Revenue by quarter</h3>
    <button cngxChartPanelActions type="button" class="chip">Change range</button>

    <cngx-chart
      [data]="series"
      [state]="chartState"
      [height]="180"
      aria-label="Net revenue by quarter"
    >
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 90]" [grid]="true"></svg:g>
      <svg:g
        cngxAxis
        [decorated]="false"
        position="bottom"
        type="linear"
        [domain]="[0, 7]"
      ></svg:g>
      <svg:g cngxLine [data]="series"></svg:g>
    </cngx-chart>
  </cngx-chart-panel>`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="chartLoading()">chart: loading</button>
    <button type="button" class="chip" (click)="chartSuccess()">chart: success</button>
    <button type="button" class="chip" (click)="chartError()">chart: error</button>
    <button type="button" class="chip" (click)="panelBusy()">panel: busy</button>
    <button type="button" class="chip" (click)="panelIdle()">panel: idle</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">chart: {{ chartState.status() }}</span>
    <span class="cngx-ex-status-readout">panel: {{ panelState.status() }}</span>
  </div>`,
};
