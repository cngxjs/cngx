import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'State Bridge ([cngxToastOn])',
  subtitle: 'Bind a <code>CngxAsyncState</code> — fires toast automatically on <code>success</code> or <code>error</code> transitions.',
  description: 'Programmatic and declarative toast notifications with dedup, timer pause on hover/touch, and severity-based styling.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  apiComponents: [
    'CngxToastOutlet',
    'CngxToastOn',
    'CngxToaster',
    'CngxToast',
  ],
  moduleImports: [
    'import { CngxToastOn } from \'@cngx/ui/feedback\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxToastOn'],
  setup: `protected readonly saveState = createManualState<string>();
  protected simulateSave(): void {
    this.saveState.set('pending');
    setTimeout(() => this.saveState.setSuccess('done'), 1500);
  }
  protected simulateError(): void {
    this.saveState.set('pending');
    setTimeout(() => this.saveState.setError('Network timeout'), 1500);
  }`,
  template: `  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="simulateSave()"
      [cngxToastOn]="saveState" toastSuccess="Saved successfully" toastError="Save failed" [toastErrorDetail]="true"
      class="chip">
      {{ saveState.isPending() ? 'Saving...' : 'Save (1.5s)' }}
    </button>
    <button (click)="simulateError()"
      class="chip">
      Simulate Error (1.5s)
    </button>
  </div>`,
  templateChrome: `<div class="event-grid">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ saveState.status() }}</span>
    </div>
  </div>`,
};
