import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Sparkline',
  navLabel: 'Sparkline',
  navCategory: 'chart',
  description:
    'Inline mini line chart for KPI cards and dashboard tiles. Composes <cngx-chart> + <cngx-line> + optional <cngx-area> with hidden axes.',
  apiComponents: ['CngxSparkline'],
  overview:
    '<p><code>cngx-sparkline</code> ships a tiny line chart sized at 80×24 by default. ' +
    'Default theming flows via <code>--cngx-sparkline-color</code> (atom-local) → ' +
    '<code>--cngx-chart-primary</code> (chart-level). Optional <code>[showArea]</code> ' +
    'fills below the line; <code>[state]</code> routes through the family-wide async-state ' +
    'switch (skeleton / empty / error / content).</p>',
  moduleImports: [
    "import { CngxSparkline } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
protected readonly stateDemoData: readonly number[] = [12, 18, 14, 22, 19, 28, 24];
protected readonly state = createManualState<readonly number[]>();

protected showSkeleton(): void {
  this.state.reset();
  this.state.set('loading');
}
protected showSuccess(): void {
  this.state.setSuccess(this.stateDemoData);
}
protected showEmpty(): void {
  this.state.reset();
  this.state.setSuccess([]);
}
protected showError(): void {
  this.state.reset();
  this.state.setError(new Error('Network unreachable'));
}
`,
  sections: [
    {
      title: 'Basic sparklines',
      subtitle: 'Default size, theming via CSS custom properties.',
      imports: ['CngxSparkline'],
      template: `
  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <div>
      <span style="font-size:0.75rem;color:var(--text-muted);margin-right:8px">CPU</span>
      <cngx-sparkline [data]="[12, 15, 11, 18, 22, 19, 24]" />
      <span style="margin-left:8px;font-weight:600">24%</span>
    </div>
    <div>
      <span style="font-size:0.75rem;color:var(--text-muted);margin-right:8px">Memory</span>
      <cngx-sparkline [data]="[60, 62, 58, 64, 68, 71, 70]" />
      <span style="margin-left:8px;font-weight:600">70%</span>
    </div>
    <div>
      <span style="font-size:0.75rem;color:var(--text-muted);margin-right:8px">Errors</span>
      <cngx-sparkline
        [data]="[0, 1, 0, 0, 2, 0, 0]"
        style="--cngx-sparkline-color: var(--danger, #d2452f)"
      />
      <span style="margin-left:8px;font-weight:600;color:var(--danger,#d2452f)">3</span>
    </div>
  </div>`,
    },
    {
      title: 'With area fill',
      subtitle: 'Combine line + area for a filled trend.',
      imports: ['CngxSparkline'],
      template: `
  <div style="display:flex;gap:24px;flex-wrap:wrap">
    <cngx-sparkline [data]="[5, 12, 8, 18, 14, 22, 19]" [showArea]="true" [width]="120" [height]="32" />
    <cngx-sparkline [data]="[20, 18, 22, 16, 14, 18, 21]" [showArea]="true" [width]="120" [height]="32"
      style="--cngx-sparkline-color: var(--success, #1f9d55)" />
  </div>`,
    },
    {
      title: 'Async state machine',
      subtitle:
        'Bind [state] to a CngxAsyncState and the sparkline routes through skeleton / empty / error / content branches automatically. Toggle the buttons below to flip the state.',
      imports: ['CngxSparkline'],
      template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--text-muted);min-width:80px">
      status: {{ state.status() }}
    </span>
    <cngx-sparkline
      [data]="stateDemoData"
      [state]="state"
      [showArea]="true"
      [width]="160"
      [height]="40"
    />
  </div>`,
    },
  ],
};
