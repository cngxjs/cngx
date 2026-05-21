import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxStackedBar: Async state machine',
  subtitle:
    'Bind <code>[state]</code> to a <code>CngxAsyncState&lt;readonly CngxStackedSegment[]&gt;</code> and the stacked bar routes through skeleton / empty / error / content branches automatically.',
  description:
    'Array-valued chart, so the empty branch is reached by setting an empty segment list (<code>state.setSuccess([])</code>). The preset paints its empty fallback instead of a zero-width composite bar.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'visual-variants'],
  apiComponents: ['CngxStackedBar'],
  moduleImports: [
    "import { CngxStackedBar, type CngxStackedSegment } from '@cngx/common/chart';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  imports: ['CngxStackedBar'],
  setup: `protected readonly stateDemoSegments: readonly CngxStackedSegment[] = [
    { value: 40, color: '#4c8bf5', label: 'Active' },
    { value: 25, color: '#1f9d55', label: 'Idle' },
    { value: 15, color: '#d2452f', label: 'Errors' },
  ];
  protected readonly state = createManualState<readonly CngxStackedSegment[]>();
  protected showSkeleton(): void {
    this.state.reset();
    this.state.set('loading');
  }
  protected showSuccess(): void {
    this.state.setSuccess(this.stateDemoSegments);
  }
  protected showEmpty(): void {
    this.state.reset();
    this.state.setSuccess([]);
  }
  protected showError(): void {
    this.state.reset();
    this.state.setError(new Error('Service unreachable'));
  }`,
  template: `  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showEmpty()">empty</button>
    <button type="button" class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;flex-direction:column;gap:6px;max-width:400px">
    <span class="cngx-ex-status-readout">status: {{ state.status() }}</span>
    <cngx-stacked-bar [segments]="stateDemoSegments" [state]="state" />
  </div>`,
};
