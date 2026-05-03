import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Deviation Bar',
  navLabel: 'Deviation Bar',
  navCategory: 'chart',
  description:
    'Single-value indicator that diverges from a baseline (default 0). Negative deviations render to the left; positive to the right.',
  apiComponents: ['CngxDeviationBar'],
  moduleImports: [
    "import { CngxDeviationBar } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
protected readonly state = createManualState<number>();

protected showSkeleton(): void { this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(35); }
protected showEmpty(): void { this.state.setSuccess(0); }
protected showError(): void { this.state.setError(new Error('Lookup failed')); }
`,
  sections: [
    {
      title: 'Variance readings',
      subtitle: 'Budget variance, score deltas, KPI swings — symmetric around the baseline mark.',
      imports: ['CngxDeviationBar'],
      template: `
  <div style="display:flex;flex-direction:column;gap:12px;max-width:360px">
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Q1 budget</span>
      <cngx-deviation-bar [value]="45" [magnitude]="100" aria-label="Q1 budget +45" />
      <span style="font-weight:600;color:var(--success,#1f9d55);width:60px;text-align:right">+$45k</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Q2 budget</span>
      <cngx-deviation-bar [value]="-30" [magnitude]="100" aria-label="Q2 budget -30" />
      <span style="font-weight:600;color:var(--danger,#d2452f);width:60px;text-align:right">−$30k</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Q3 budget</span>
      <cngx-deviation-bar [value]="0" [magnitude]="100" aria-label="Q3 budget on target" />
      <span style="font-weight:600;width:60px;text-align:right">on target</span>
    </div>
  </div>`,
    },
    {
      title: 'Async state machine',
      subtitle: 'Bind [state] to a CngxAsyncState — the bar routes through skeleton / empty / error / content branches automatically.',
      imports: ['CngxDeviationBar'],
      template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--text-muted);min-width:80px">status: {{ state.status() }}</span>
    <cngx-deviation-bar [value]="35" [magnitude]="100" [state]="state" aria-label="Demo variance" />
  </div>`,
    },
  ],
};
