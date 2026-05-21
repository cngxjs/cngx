import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxBullet: Async state machine',
  subtitle:
    'Bind <code>[state]</code> to a <code>CngxAsyncState&lt;number&gt;</code> and the bullet routes through skeleton / empty / error / content branches automatically.',
  description:
    'Drives the bullet through every async-state branch via four buttons. The single-value chart has no value-driven empty representation, so empty is triggered by transitioning to <code>success</code> without setting data: <code>state.reset()</code> followed by <code>state.set("success")</code> leaves <code>data</code> undefined, <code>isEmpty</code> resolves to <code>true</code>, and the preset paints its empty fallback.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'visual-variants'],
  apiComponents: ['CngxBullet'],
  moduleImports: [
    "import { CngxBullet } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxBullet'],
  setup: `protected readonly state = createManualState<number>();
  protected showSkeleton(): void {
    this.state.reset();
    this.state.set('loading');
  }
  protected showSuccess(): void {
    this.state.setSuccess(78);
  }
  protected showEmpty(): void {
    this.state.reset();
    this.state.set('success');
  }
  protected showError(): void {
    this.state.reset();
    this.state.setError(new Error('Target unavailable'));
  }`,
  template: `  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showEmpty()">empty</button>
    <button type="button" class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:6px;max-width:400px">
    <span class="cngx-ex-status-readout">status: {{ state.status() }}</span>
    <cngx-bullet
      [actual]="78"
      [target]="80"
      [max]="100"
      [state]="state"
      [ranges]="[
        { from: 0, to: 50, color: 'color-mix(in oklch, currentColor 10%, transparent)', label: 'poor' },
        { from: 50, to: 75, color: 'color-mix(in oklch, currentColor 18%, transparent)', label: 'fair' },
        { from: 75, to: 100, color: 'color-mix(in oklch, currentColor 28%, transparent)', label: 'good' }
      ]"
      aria-label="Demo bullet"
    />
  </div>`,
};
