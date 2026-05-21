import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSparkline: Async state machine',
  subtitle:
    'Bind <code>[state]</code> to a <code>CngxAsyncState&lt;readonly number[]&gt;</code> and the sparkline routes through skeleton / empty / error / content branches automatically.',
  description:
    'Array-valued chart, so the empty branch is reached by passing an empty array (<code>state.setSuccess([])</code>): the preset paints its empty fallback instead of an unbounded zero-length line. The other three states follow the standard contract.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'visual-variants'],
  apiComponents: ['CngxSparkline'],
  moduleImports: [
    "import { CngxSparkline } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
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
  template: `  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showEmpty()">empty</button>
    <button type="button" class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span class="cngx-ex-status-readout" style="min-width:80px">status: {{ state.status() }}</span>
    <cngx-sparkline
      [data]="stateDemoData"
      [state]="state"
      [showArea]="true"
      [width]="160"
      [height]="40"
    />
  </div>`,
};
