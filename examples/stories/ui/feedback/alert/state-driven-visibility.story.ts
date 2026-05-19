import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'State-Driven Visibility',
  subtitle: 'Bind <code>[state]</code> to a <code>CngxAsyncState</code>. Shows on error/success/loading, hides on idle. Success auto-dismisses after 5s. Hover/focus pauses the timer (WCAG 2.2.1).',
  description: 'Inline alert atom with enter/exit animations, state-driven visibility, auto-dismiss with pause-on-hover/focus, auto-collapse, and action buttons.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
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
  template: `
  <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">
    <button (click)="simulateError()" class="chip">Error</button>
    <button (click)="simulateSuccess()" class="chip">Success (5s auto-dismiss)</button>
    <button (click)="simulateLoading()" class="chip">Loading</button>
    <button (click)="resetState()" class="chip">Reset (idle)</button>
  </div>

  <cngx-alert [state]="saveState" severity="error" title="Operation Status" [closable]="true">
    @switch (saveState.status()) {
      @case ('error') { {{ saveState.error() }} }
      @case ('success') { Saved successfully. This will auto-dismiss in 5s. Hover to pause. }
      @case ('loading') { Loading... please wait. }
    }
  </cngx-alert>

  <div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Status</span>
      <span class="event-value">{{ saveState.status() }}</span>
    </div>
  </div>`,
};
