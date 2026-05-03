import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Mini Area',
  navLabel: 'Mini Area',
  navCategory: 'chart',
  description:
    'Inline mini filled-area chart. Sibling of <cngx-sparkline>; renders only the area (no line stroke).',
  apiComponents: ['CngxMiniArea'],
  moduleImports: [
    "import { CngxMiniArea } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
protected readonly stateDemoData: readonly number[] = [10, 14, 18, 16, 22, 28, 32];
protected readonly state = createManualState<readonly number[]>();

protected showSkeleton(): void { this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(this.stateDemoData); }
protected showEmpty(): void { this.state.setSuccess([]); }
protected showError(): void { this.state.setError(new Error('Network unreachable')); }
`,
  sections: [
    {
      title: 'Inline area trends',
      subtitle: 'Default 80×24, theming via --cngx-mini-area-color → --cngx-chart-primary.',
      imports: ['CngxMiniArea'],
      template: `
  <div style="display:flex;gap:24px;align-items:center;flex-wrap:wrap">
    <div>
      <span style="font-size:0.75rem;color:var(--text-muted);margin-right:8px">Sessions</span>
      <cngx-mini-area [data]="[5, 12, 8, 18, 14, 22, 19]" />
    </div>
    <div>
      <span style="font-size:0.75rem;color:var(--text-muted);margin-right:8px">Revenue</span>
      <cngx-mini-area
        [data]="[10, 14, 18, 16, 22, 28, 32]"
        [width]="120"
        [height]="32"
        style="--cngx-mini-area-color: var(--success, #1f9d55)"
      />
    </div>
  </div>`,
    },
    {
      title: 'Async state machine',
      subtitle: 'Bind [state] to a CngxAsyncState — the area routes through skeleton / empty / error / content branches automatically.',
      imports: ['CngxMiniArea'],
      template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--text-muted);min-width:80px">status: {{ state.status() }}</span>
    <cngx-mini-area [data]="stateDemoData" [state]="state" [width]="160" [height]="40" />
  </div>`,
    },
  ],
};
