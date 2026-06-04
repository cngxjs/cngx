import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToastOn: state bridge',
  subtitle: 'Bind a <code>CngxAsyncState</code> - fires toast automatically on <code>success</code> or <code>error</code> transitions.',
  description: 'Zero-handler integration: a button driven by a <code>CngxAsyncState</code> shows a success or error toast on every terminal transition. No explicit <code>toaster.show()</code> call - the bridge directive reads <code>CNGX_STATEFUL</code> from the host.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
  ],
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
  template: `  <div class="button-row" style="margin-bottom:12px">
    <button (click)="simulateSave()"
      [cngxToastOn]="saveState" toastSuccess="Saved successfully" toastError="Save failed" [toastErrorDetail]="true"
      class="chip" type="button">
      {{ saveState.isPending() ? 'Saving...' : 'Save (1.5s)' }}
    </button>
    <button (click)="simulateError()"
      [cngxToastOn]="saveState" toastSuccess="Saved successfully" toastError="Save failed" [toastErrorDetail]="true"
      class="chip" type="button">
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
