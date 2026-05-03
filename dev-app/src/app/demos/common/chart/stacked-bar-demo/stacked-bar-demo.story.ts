import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Stacked Bar',
  navLabel: 'Stacked Bar',
  navCategory: 'chart',
  description:
    'Single-bar composition visualising proportional shares of a fixed total. Pure DOM; ARIA enumerates segments + total.',
  apiComponents: ['CngxStackedBar'],
  moduleImports: [
    "import { CngxStackedBar, type CngxStackedSegment } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
protected readonly stateDemoSegments: readonly CngxStackedSegment[] = [
  { value: 40, color: '#4c8bf5', label: 'Active' },
  { value: 25, color: '#1f9d55', label: 'Idle' },
  { value: 15, color: '#d2452f', label: 'Errors' },
];
protected readonly state = createManualState<readonly CngxStackedSegment[]>();

protected showSkeleton(): void { this.state.reset(); this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(this.stateDemoSegments); }
protected showEmpty(): void { this.state.reset(); this.state.setSuccess([]); }
protected showError(): void { this.state.reset(); this.state.setError(new Error('Service unreachable')); }
`,
  sections: [
    {
      title: 'Proportional share strips',
      subtitle: 'Each segment is a labelled coloured slice; ARIA lists them in order with the total.',
      imports: ['CngxStackedBar'],
      template: `
  <div style="display:flex;flex-direction:column;gap:16px;max-width:400px">
    <div>
      <div style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:4px">Storage usage</div>
      <cngx-stacked-bar
        [segments]="[
          { value: 32, color: '#4c8bf5', label: 'Documents' },
          { value: 28, color: '#7d8997', label: 'Photos' },
          { value: 18, color: '#1f9d55', label: 'Apps' },
          { value: 12, color: '#d2452f', label: 'System' }
        ]"
      />
    </div>
    <div>
      <div style="font-size:0.8125rem;color:var(--text-muted);margin-bottom:4px">Browser breakdown</div>
      <cngx-stacked-bar
        [segments]="[
          { value: 65, color: '#4c8bf5', label: 'Chrome' },
          { value: 18, color: '#1f9d55', label: 'Safari' },
          { value: 10, color: '#d2452f', label: 'Firefox' },
          { value: 7, color: '#7d8997', label: 'Other' }
        ]"
      />
    </div>
  </div>`,
    },
    {
      title: 'Async state machine',
      subtitle: 'Bind [state] to a CngxAsyncState — the stacked bar routes through skeleton / empty / error / content branches automatically.',
      imports: ['CngxStackedBar'],
      template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:6px;max-width:400px">
    <span style="font-size:0.75rem;color:var(--text-muted)">status: {{ state.status() }}</span>
    <cngx-stacked-bar [segments]="stateDemoSegments" [state]="state" />
  </div>`,
    },
  ],
};
