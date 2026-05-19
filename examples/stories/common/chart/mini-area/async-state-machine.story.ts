import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async state machine',
  subtitle: 'Bind [state] to a CngxAsyncState — the area routes through skeleton / empty / error / content branches automatically.',
  description: 'Inline mini filled-area chart. Sibling of <cngx-sparkline>; renders only the area (no line stroke).',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxMiniArea',
  ],
  moduleImports: [
    'import { CngxMiniArea } from \'@cngx/common/chart\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxMiniArea'],
  setup: `protected readonly stateDemoData: readonly number[] = [10, 14, 18, 16, 22, 28, 32];
protected readonly state = createManualState<readonly number[]>();
protected showSkeleton(): void { this.state.reset(); this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(this.stateDemoData); }
protected showEmpty(): void { this.state.reset(); this.state.setSuccess([]); }
protected showError(): void { this.state.reset(); this.state.setError(new Error('Network unreachable')); }`,
  template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--cngx-color-text-muted);min-width:80px">status: {{ state.status() }}</span>
    <cngx-mini-area [data]="stateDemoData" [state]="state" [width]="160" [height]="40" />
  </div>`,
};
