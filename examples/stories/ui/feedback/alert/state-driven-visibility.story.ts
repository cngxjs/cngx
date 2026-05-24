import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAlert: state driven visibility',
  subtitle: 'Bind <code>[state]</code> to a <code>CngxAsyncState</code>. Shows on error/success/loading, hides on idle. Success auto-dismisses after 5s. Hover/focus pauses the timer (WCAG 2.2.1).',
  description: 'Async-state-driven alert: the same alert switches severity and message as the state transitions through <code>loading</code>, <code>success</code>, <code>error</code>, and <code>idle</code> without any manual show/hide wiring.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
    { label: 'WCAG 2.2.1 Timing Adjustable', href: 'https://www.w3.org/WAI/WCAG21/Understanding/timing-adjustable.html' },
  ],
  apiComponents: [
    'CngxAlert',
    'CngxAlertAction',
    'CngxAlertIcon',
  ],
  moduleImports: [
    'import { CngxAlert } from \'@cngx/ui/feedback\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAlert'],
  setup: `protected readonly saveState = createManualState<string>();
  protected simulateError(): void {
    this.saveState.setError('Network timeout');
  }
  protected simulateSuccess(): void {
    this.saveState.setSuccess('done');
  }
  protected simulateLoading(): void {
    this.saveState.set('loading');
  }
  protected resetState(): void {
    this.saveState.reset();
  }`,
  template: `  <cngx-alert [state]="saveState" severity="error" title="Operation Status" [closable]="true">
    @switch (saveState.status()) {
      @case ('error') { {{ saveState.error() }} }
      @case ('success') { Saved successfully. This will auto-dismiss in 5s. Hover to pause. }
      @case ('loading') { Loading... please wait. }
    }
  </cngx-alert>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button (click)="simulateError()" class="chip" type="button">Error</button>
    <button (click)="simulateSuccess()" class="chip" type="button">Success (5s auto-dismiss)</button>
    <button (click)="simulateLoading()" class="chip" type="button">Loading</button>
    <button (click)="resetState()" class="chip" type="button">Reset (idle)</button>
  </div>
<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ saveState.status() }}</span>
    </div>
  </div>`,
};
