import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async state machine',
  subtitle: 'Bind [state] to a CngxAsyncState and the sparkline routes through skeleton / empty / error / content branches automatically. Toggle the buttons below to flip the state.',
  description: 'Inline mini line chart for KPI cards and dashboard tiles. Composes <cngx-chart> + <cngx-line> + optional <cngx-area> with hidden axes.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxSparkline',
  ],
  moduleImports: [
    'import { CngxSparkline } from \'@cngx/common/chart\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxSparkline'],
  setup: `protected readonly stateDemoData: readonly number[] = [12, 18, 14, 22, 19, 28, 24];
protected readonly state = createManualState<readonly number[]>();
protected showSkeleton(): void {
  this.state.reset();
  this.state.set('loading');
}
protected showSuccess(): void {
  this.state.setSuccess(this.stateDemoData);
}
protected showEmpty(): void {
  this.state.reset();
  this.state.setSuccess([]);
}
protected showError(): void {
  this.state.reset();
  this.state.setError(new Error('Network unreachable'));
}`,
  template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--cngx-color-text-muted);min-width:80px">
      status: {{ state.status() }}
    </span>
    <cngx-sparkline
      [data]="stateDemoData"
      [state]="state"
      [showArea]="true"
      [width]="160"
      [height]="40"
    />
  </div>`,
};
