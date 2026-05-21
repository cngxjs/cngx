import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDeviationBar: Async state machine',
  subtitle:
    'Bind <code>[state]</code> to a <code>CngxAsyncState&lt;number&gt;</code> and the deviation bar routes through skeleton / empty / error / content branches automatically.',
  description:
    'Same four-state machine the other chart presets follow. Empty is reached by entering <code>success</code> without setting data (<code>state.reset()</code> + <code>state.set("success")</code>); the preset paints its empty fallback rather than the bar.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'visual-variants'],
  apiComponents: ['CngxDeviationBar'],
  moduleImports: [
    "import { CngxDeviationBar } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxDeviationBar'],
  setup: `protected readonly state = createManualState<number>();
  protected showSkeleton(): void {
    this.state.reset();
    this.state.set('loading');
  }
  protected showSuccess(): void {
    this.state.setSuccess(35);
  }
  protected showEmpty(): void {
    this.state.reset();
    this.state.set('success');
  }
  protected showError(): void {
    this.state.reset();
    this.state.setError(new Error('Lookup failed'));
  }`,
  template: `  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showEmpty()">empty</button>
    <button type="button" class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span class="cngx-ex-status-readout" style="min-width:80px">status: {{ state.status() }}</span>
    <cngx-deviation-bar [value]="35" [magnitude]="100" [state]="state" aria-label="Demo variance" />
  </div>`,
};
