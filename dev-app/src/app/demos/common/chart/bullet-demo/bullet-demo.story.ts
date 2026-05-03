import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Bullet',
  navLabel: 'Bullet',
  navCategory: 'chart',
  description:
    "Stephen Few's compact KPI visualisation. Three stacked layers: range bands, an actual filled bar, and a target marker.",
  apiComponents: ['CngxBullet'],
  moduleImports: [
    "import { CngxBullet } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
protected readonly state = createManualState<number>();

protected showSkeleton(): void { this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(78); }
protected showEmpty(): void { this.state.setSuccess(0); }
protected showError(): void { this.state.setError(new Error('Target unavailable')); }
`,
  sections: [
    {
      title: 'Performance vs target',
      subtitle: 'Range bands (poor / fair / good) + actual bar + target marker.',
      imports: ['CngxBullet'],
      template: `
  <div style="display:flex;flex-direction:column;gap:16px;max-width:400px">
    <div>
      <div style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:4px">Q1 Revenue</div>
      <cngx-bullet
        [actual]="78"
        [target]="80"
        [max]="100"
        [ranges]="[
          { from: 0, to: 50, color: 'rgb(0 0 0 / 0.10)', label: 'poor' },
          { from: 50, to: 75, color: 'rgb(0 0 0 / 0.18)', label: 'fair' },
          { from: 75, to: 100, color: 'rgb(0 0 0 / 0.28)', label: 'good' }
        ]"
        aria-label="Q1 Revenue: 78 of 100, target 80"
      />
    </div>
    <div>
      <div style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:4px">Q2 Revenue</div>
      <cngx-bullet
        [actual]="92"
        [target]="80"
        [max]="100"
        [ranges]="[
          { from: 0, to: 50, color: 'rgb(0 0 0 / 0.10)', label: 'poor' },
          { from: 50, to: 75, color: 'rgb(0 0 0 / 0.18)', label: 'fair' },
          { from: 75, to: 100, color: 'rgb(0 0 0 / 0.28)', label: 'good' }
        ]"
        aria-label="Q2 Revenue: 92 of 100, target 80 — exceeded"
      />
    </div>
    <div>
      <div style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:4px">Q3 Revenue</div>
      <cngx-bullet
        [actual]="35"
        [target]="80"
        [max]="100"
        [ranges]="[
          { from: 0, to: 50, color: 'rgb(0 0 0 / 0.10)', label: 'poor' },
          { from: 50, to: 75, color: 'rgb(0 0 0 / 0.18)', label: 'fair' },
          { from: 75, to: 100, color: 'rgb(0 0 0 / 0.28)', label: 'good' }
        ]"
        style="--cngx-bullet-actual-color: var(--danger, #d2452f)"
        aria-label="Q3 Revenue: 35 of 100, target 80 — below target"
      />
    </div>
  </div>`,
    },
    {
      title: 'Async state machine',
      subtitle: 'Bind [state] to a CngxAsyncState — the bullet routes through skeleton / empty / error / content branches automatically.',
      imports: ['CngxBullet'],
      template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:6px;max-width:400px">
    <span style="font-size:0.75rem;color:var(--text-muted)">status: {{ state.status() }}</span>
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
    },
  ],
};
