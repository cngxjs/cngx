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
    "import { CngxSparkline } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxSparkline'],
  setup: `protected readonly stateDemoData: readonly number[] = [12, 18, 14, 22, 19, 28, 24];
  protected readonly state = createManualState<readonly number[]>();`,
  setupChrome: `protected showSkeleton(): void {
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
  template: `  <cngx-sparkline
    [data]="stateDemoData"
    [state]="state"
    [showArea]="true"
    [width]="160"
    [height]="40"
  />`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showEmpty()">empty</button>
    <button type="button" class="chip" (click)="showError()">error</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ state.status() }}</span>
  </div>`,
};
