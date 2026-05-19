import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async state machine',
  subtitle: 'Bind [state] to a CngxAsyncState — the bullet routes through skeleton / empty / error / content branches automatically.',
  description: 'Stephen Few\'s compact KPI visualisation. Three stacked layers: range bands, an actual filled bar, and a target marker.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxBullet',
  ],
  moduleImports: [
    'import { CngxBullet } from \'@cngx/common/chart\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxBullet'],
  setup: `protected readonly state = createManualState<number>();
protected showSkeleton(): void { this.state.reset(); this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(78); }
protected showEmpty(): void { this.state.reset(); this.state.setSuccess(0); }
protected showError(): void { this.state.reset(); this.state.setError(new Error('Target unavailable')); }`,
  template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:6px;max-width:400px">
    <span style="font-size:0.75rem;color:var(--cngx-color-text-muted)">status: {{ state.status() }}</span>
    <cngx-bullet
      [actual]="78"
      [target]="80"
      [max]="100"
      [state]="state"
      [ranges]="[
        { from: 0, to: 50, color: 'rgb(0 0 0 / 0.10)', label: 'poor' },
        { from: 50, to: 75, color: 'rgb(0 0 0 / 0.18)', label: 'fair' },
        { from: 75, to: 100, color: 'rgb(0 0 0 / 0.28)', label: 'good' }
      ]"
      aria-label="Demo bullet"
    />
  </div>`,
};
