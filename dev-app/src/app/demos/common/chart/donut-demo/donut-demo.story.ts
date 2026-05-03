import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Donut',
  navLabel: 'Donut',
  navCategory: 'chart',
  description:
    'Circular gauge for a single bounded value. Host carries role="meter"; the optional [label] renders inside the ring.',
  apiComponents: ['CngxDonut'],
  moduleImports: [
    "import { CngxDonut } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
protected readonly state = createManualState<number>();

protected showSkeleton(): void { this.state.reset(); this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(72); }
protected showEmpty(): void { this.state.reset(); this.state.setSuccess(0); }
protected showError(): void { this.state.reset(); this.state.setError(new Error('Score unavailable')); }
`,
  sections: [
    {
      title: 'Score gauges',
      subtitle: 'Three sizes; theming via --cngx-donut-color → --cngx-chart-primary.',
      imports: ['CngxDonut'],
      template: `
  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <cngx-donut [value]="75" [max]="100" [size]="48" [thickness]="6" [label]="'75%'" aria-label="Score 75 of 100" />
    <cngx-donut [value]="42" [max]="100" [size]="64" [thickness]="8" [label]="'42%'"
      style="--cngx-donut-color: var(--accent-secondary, #7d8997)" aria-label="Coverage 42 of 100" />
    <cngx-donut [value]="98" [max]="100" [size]="80" [thickness]="10" [label]="'A+'"
      style="--cngx-donut-color: var(--success, #1f9d55)" aria-label="Quality A plus" />
    <cngx-donut [value]="12" [max]="100" [size]="64" [thickness]="8" [label]="'12%'"
      style="--cngx-donut-color: var(--danger, #d2452f)" aria-label="Critical 12 of 100" />
  </div>`,
    },
    {
      title: 'Async state machine',
      subtitle: 'Bind [state] to a CngxAsyncState — the donut routes through skeleton / empty / error / content branches automatically.',
      imports: ['CngxDonut'],
      template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--text-muted);min-width:80px">status: {{ state.status() }}</span>
    <cngx-donut [value]="72" [max]="100" [size]="80" [thickness]="10" [label]="'72%'" [state]="state" aria-label="Demo score" />
  </div>`,
    },
  ],
};
