import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDonut: Async state machine',
  subtitle:
    'Bind <code>[state]</code> to a <code>CngxAsyncState&lt;number&gt;</code> and the donut routes through skeleton / empty / error / content branches automatically.',
  description:
    'Drives a single donut through every async-state branch. The empty button reaches the empty view by entering <code>success</code> without setting data (<code>state.reset()</code> + <code>state.set("success")</code>); the preset paints its empty fallback instead of a 0% ring.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'visual-variants'],
  apiComponents: ['CngxDonut'],
  moduleImports: [
    "import { CngxDonut } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxDonut'],
  setup: `protected readonly state = createManualState<number>();
  protected showSkeleton(): void {
    this.state.reset();
    this.state.set('loading');
  }
  protected showSuccess(): void {
    this.state.setSuccess(72);
  }
  protected showEmpty(): void {
    this.state.reset();
    this.state.set('success');
  }
  protected showError(): void {
    this.state.reset();
    this.state.setError(new Error('Score unavailable'));
  }`,
  template: `  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showEmpty()">empty</button>
    <button type="button" class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span class="cngx-ex-status-readout" style="min-width:80px">status: {{ state.status() }}</span>
    <cngx-donut [value]="72" [max]="100" [size]="80" [thickness]="10" [label]="'72%'" [state]="state" aria-label="Demo score" />
  </div>`,
};
