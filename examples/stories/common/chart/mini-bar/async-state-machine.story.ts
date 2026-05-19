import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async state machine',
  subtitle: 'Bind [state] to a CngxAsyncState — the bar routes through skeleton / empty / error / content branches automatically.',
  description: 'Single-value bounded indicator. Pure DOM (no SVG). Host carries role="meter" with reactive ARIA value attributes.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxMiniBar',
  ],
  moduleImports: [
    'import { CngxMiniBar } from \'@cngx/common/chart\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxMiniBar'],
  setup: `protected readonly state = createManualState<number>();
protected showSkeleton(): void { this.state.reset(); this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(64); }
protected showEmpty(): void { this.state.reset(); this.state.setSuccess(0); }
protected showError(): void { this.state.reset(); this.state.setError(new Error('Sensor offline')); }`,
  template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--cngx-color-text-muted);min-width:80px">status: {{ state.status() }}</span>
    <cngx-mini-bar [value]="64" [state]="state" aria-label="Demo metric" />
  </div>`,
};
