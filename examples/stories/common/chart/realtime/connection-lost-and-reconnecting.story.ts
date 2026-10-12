import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxChart: connection lost and reconnecting',
  subtitle:
    'Bind <code>[connectionState]</code> and project <code>*cngxChartConnectionError</code> / <code>*cngxChartReconnecting</code> to replace the built-in "Connection lost" and "Reconnecting" overlays. Use the buttons to drive the connection; untick "Use custom slot templates" to see the defaults.',
  description:
    'The connection channel is independent of the data <code>[state]</code>: the drawn series stays on screen and the overlay sits on top of it. Status <code>error</code> renders the connection-lost overlay inside a <code>role="alert"</code> wrapper, status <code>refreshing</code> renders the reconnecting overlay inside a <code>role="status"</code> wrapper; both wrappers stay library-owned. Both templates receive <code>{ $implicit: error, error, width, height, small, plot }</code>, where <code>error</code> is the connection state\'s current error. <code>createManualState</code> only clears the error on success, so the reconnecting overlay still sees the error that dropped the connection.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['async-state', 'error-handling', 'composition'],
  apiComponents: [
    'CngxChart',
    'CngxChartConnectionError',
    'CngxChartReconnecting',
    'CngxAxis',
    'CngxLine',
  ],
  moduleImports: [
    "import { CngxAxis, CngxChart, CngxChartConnectionError, CngxChartReconnecting, CngxLine } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: [
    'CngxChart',
    'CngxAxis',
    'CngxLine',
    'CngxChartConnectionError',
    'CngxChartReconnecting',
  ],
  setup: `protected readonly readings: readonly number[] = [18, 22, 21, 26, 30, 28, 33, 31, 35, 34, 38, 36];
  protected readonly connection = createManualState<unknown>();
  protected readonly customSlots = signal(true);
  protected errorText(error: unknown): string {
    return error instanceof Error ? error.message : 'unknown error';
  }`,
  setupChrome: `protected dropConnection(): void {
    this.connection.setError(new Error('Socket closed (code 1006)'));
  }
  protected reconnect(): void {
    this.connection.set('refreshing');
  }
  protected restore(): void {
    this.connection.setSuccess(undefined);
  }`,
  templateChromeBefore: `<div class="button-row" style="margin-bottom:16px">
    <button type="button" class="chip" (click)="dropConnection()">Drop connection</button>
    <button type="button" class="chip" (click)="reconnect()">Start reconnecting</button>
    <button type="button" class="chip" (click)="restore()">Restore connection</button>
    <label>
      <input
        type="checkbox"
        [checked]="customSlots()"
        (change)="customSlots.set($any($event.target).checked)"
      />
      Use custom slot templates
    </label>
  </div>`,
  template: `  <div class="cngx-ex-chart-frame">
    <cngx-chart
      [data]="readings"
      [connectionState]="connection"
      [width]="480"
      [height]="200"
      aria-label="Server load over the last 12 minutes, in percent."
    >
      <svg:g cngxAxis position="bottom" type="linear" [domain]="[0, 11]"></svg:g>
      <svg:g cngxAxis position="left" type="linear" [domain]="[0, 50]"></svg:g>
      <svg:g cngxLine></svg:g>
      @if (customSlots()) {
        <ng-template cngxChartConnectionError let-error let-small="small">
          <span class="demo-chart-connection">
            <strong>Live feed lost</strong>
            @if (!small) {
              <span>{{ errorText(error) }}</span>
            }
          </span>
        </ng-template>
        <ng-template cngxChartReconnecting let-error let-plot="plot">
          <span class="demo-chart-connection">
            Reconnecting after "{{ errorText(error) }}" (plot {{ plot.width }} wide)
          </span>
        </ng-template>
      }
    </cngx-chart>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">connection: {{ connection.status() }}</span>
  </div>`,
};
