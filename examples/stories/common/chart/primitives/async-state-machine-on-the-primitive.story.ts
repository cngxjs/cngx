import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: Async state machine on the primitive',
  subtitle:
    'Bind <code>[state]</code> to <code>&lt;cngx-chart&gt;</code> and the primitive composition routes through loading / empty / error / content branches automatically. The default loading view is a centred spinner; default empty / error are inline text. Project richer fallbacks via <code>*cngxChartLoading</code> / <code>*cngxChartEmpty</code> / <code>*cngxChartError</code>.',
  description:
    'Same four-state machine the presets follow, but applied to the lowest-level primitive composition. Array-valued, so the empty branch is reached by <code>setSuccess([])</code>. This story projects <code>&lt;cngx-empty-state&gt;</code> from <code>@cngx/ui</code> into the empty and error slots to demonstrate richer fallback content.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['async-state', 'composition'],
  apiComponents: [
    'CngxChart',
    'CngxAxis',
    'CngxLine',
    'CngxArea',
    'CngxThreshold',
    'CngxBand',
    'CngxChartEmpty',
    'CngxChartError',
    'CngxEmptyState',
  ],
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
    "import { CngxChart, CngxAxis, CngxLine, CngxArea, CngxThreshold, CngxBand, CngxChartEmpty, CngxChartError } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
    "import { CngxEmptyState } from '@cngx/ui/empty-state';",
  ],
  imports: [
    'CngxChart',
    'CngxAxis',
    'CngxLine',
    'CngxArea',
    'CngxThreshold',
    'CngxBand',
    'CngxChartEmpty',
    'CngxChartError',
    'CngxEmptyState',
  ],
  setup: `protected readonly chartStateData: readonly number[] = [8, 12, 14, 9, 18, 22, 25, 19, 16, 24, 28, 32];
  protected readonly chartState = createManualState<readonly number[]>();`,
  setupChrome: `protected showSkeleton(): void {
    this.chartState.reset();
    this.chartState.set('loading');
  }
  protected showSuccess(): void {
    this.chartState.setSuccess(this.chartStateData);
  }
  protected showEmpty(): void {
    this.chartState.reset();
    this.chartState.setSuccess([]);
  }
  protected showError(): void {
    this.chartState.reset();
    this.chartState.setError(new Error('Telemetry feed offline'));
  }`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showSkeleton()">loading (spinner)</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showEmpty()">empty</button>
    <button type="button" class="chip" (click)="showError()">error</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ chartState.status() }}</span>
  </div>`,
  template: `  <div class="cngx-ex-chart-frame">
    <cngx-chart
      [data]="chartStateData"
      [state]="chartState"
      [width]="480"
      [height]="200"
      aria-label="Telemetry feed with custom empty and error fallbacks."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]" [ticks]="6" [grid]="true"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 40]" [grid]="true"></svg:g>
      <svg:g cngxBand [from]="20" [to]="30" label="watch"></svg:g>
      <svg:g cngxArea></svg:g>
      <svg:g cngxLine [strokeWidth]="2"></svg:g>
      <svg:g cngxThreshold [value]="25" [label]="'target'" [dashed]="true"></svg:g>
      <ng-template cngxChartEmpty let-small="small">
        @if (small) {
          <span class="cngx-ex-status-readout">No telemetry</span>
        } @else {
          <cngx-empty-state
            title="No telemetry yet"
            description="Connect a feed or pick a different time window."
          />
        }
      </ng-template>
      <ng-template cngxChartError let-err="error" let-small="small">
        @if (small) {
          <span class="cngx-ex-status-readout">Feed failed</span>
        } @else {
          <cngx-empty-state
            title="Telemetry feed failed"
            [description]="err?.message ?? 'Try again in a moment.'"
          />
        }
      </ng-template>
    </cngx-chart>
  </div>`,
};
