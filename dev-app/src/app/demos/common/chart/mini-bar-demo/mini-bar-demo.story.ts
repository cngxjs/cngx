import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Mini Bar',
  navLabel: 'Mini Bar',
  navCategory: 'chart',
  description:
    'Single-value bounded indicator. Pure DOM (no SVG). Host carries role="meter" with reactive ARIA value attributes.',
  apiComponents: ['CngxMiniBar'],
  overview:
    '<p><code>cngx-mini-bar</code> is a horizontal bounded indicator for KPI rows — battery levels, ' +
    'progress percentages, scoring strips. <code>role="meter"</code> ' +
    'plus <code>aria-valuenow</code>/<code>min</code>/<code>max</code> tells AT the exact reading ' +
    'without a separate Summary.</p>',
  moduleImports: [
    "import { CngxMiniBar } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
protected readonly state = createManualState<number>();

protected showSkeleton(): void { this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(64); }
protected showEmpty(): void { this.state.setSuccess(0); }
protected showError(): void { this.state.setError(new Error('Sensor offline')); }
`,
  sections: [
    {
      title: 'Basic readings',
      subtitle: 'Default 80px width, theming via --cngx-bar-color → --cngx-chart-primary.',
      imports: ['CngxMiniBar'],
      template: `
  <div style="display:flex;flex-direction:column;gap:12px;max-width:300px">
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Battery</span>
      <cngx-mini-bar [value]="78" aria-label="Battery 78%" />
      <span style="font-weight:600;width:40px;text-align:right">78%</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Disk</span>
      <cngx-mini-bar [value]="42" aria-label="Disk 42%" />
      <span style="font-weight:600;width:40px;text-align:right">42%</span>
    </div>
    <div style="display:flex;align-items:center;gap:12px">
      <span style="flex:1">Critical</span>
      <cngx-mini-bar [value]="12" aria-label="Critical 12%"
        style="--cngx-bar-color: var(--danger, #d2452f)" />
      <span style="font-weight:600;width:40px;text-align:right;color:var(--danger,#d2452f)">12%</span>
    </div>
  </div>`,
    },
    {
      title: 'Async state machine',
      subtitle: 'Bind [state] to a CngxAsyncState — the bar routes through skeleton / empty / error / content branches automatically.',
      imports: ['CngxMiniBar'],
      template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--text-muted);min-width:80px">status: {{ state.status() }}</span>
    <cngx-mini-bar [value]="64" [state]="state" aria-label="Demo metric" />
  </div>`,
    },
  ],
};
