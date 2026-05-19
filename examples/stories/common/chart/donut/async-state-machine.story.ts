import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Async state machine',
  subtitle: 'Bind [state] to a CngxAsyncState — the donut routes through skeleton / empty / error / content branches automatically.',
  description: 'Circular gauge for a single bounded value. Host carries role="meter"; the optional [label] renders inside the ring.',
  level: 'atom',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: [
    'CngxDonut',
  ],
  moduleImports: [
    'import { CngxDonut } from \'@cngx/common/chart\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxDonut'],
  setup: `protected readonly state = createManualState<number>();
protected showSkeleton(): void { this.state.reset(); this.state.set('loading'); }
protected showSuccess(): void { this.state.setSuccess(72); }
protected showEmpty(): void { this.state.reset(); this.state.setSuccess(0); }
protected showError(): void { this.state.reset(); this.state.setError(new Error('Score unavailable')); }`,
  template: `
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button class="chip" (click)="showSkeleton()">loading (skeleton)</button>
    <button class="chip" (click)="showSuccess()">success</button>
    <button class="chip" (click)="showEmpty()">empty</button>
    <button class="chip" (click)="showError()">error</button>
  </div>
  <div style="display:flex;align-items:center;gap:24px">
    <span style="font-size:0.75rem;color:var(--cngx-color-text-muted);min-width:80px">status: {{ state.status() }}</span>
    <cngx-donut [value]="72" [max]="100" [size]="80" [thickness]="10" [label]="'72%'" [state]="state" aria-label="Demo score" />
  </div>`,
};
