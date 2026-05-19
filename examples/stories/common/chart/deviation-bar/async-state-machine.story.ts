import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async state machine',
  subtitle: 'Bind [state] to a CngxAsyncState — the bar routes through skeleton / empty / error / content branches automatically.',
  description: 'Single-value indicator that diverges from a baseline (default 0). Negative deviations render to the left; positive to the right.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxDeviationBar',
  ],
  moduleImports: [
    'import { CngxDeviationBar } from \'@cngx/common/chart\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxDeviationBar'],
  setup: `protected readonly state = createManualState<number>();
protected showSkeleton(): void { this.state.reset(); this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(35); }
protected showEmpty(): void { this.state.reset(); this.state.setSuccess(0); }
protected showError(): void { this.state.reset(); this.state.setError(new Error('Lookup failed')); }`,
  template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--cngx-color-text-muted);min-width:80px">status: {{ state.status() }}</span>
    <cngx-deviation-bar [value]="35" [magnitude]="100" [state]="state" aria-label="Demo variance" />
  </div>`,
};
