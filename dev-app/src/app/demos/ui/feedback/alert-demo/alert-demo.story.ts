import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Alert',
  navLabel: 'Alert',
  navCategory: 'feedback',
  description: 'Inline alert atom with enter/exit animations, state-driven visibility, auto-dismiss with pause-on-hover/focus, auto-collapse, and action buttons.',
  apiComponents: ['CngxAlert', 'CngxAlertAction', 'CngxAlertIcon'],
  moduleImports: [
    "import { CngxAlert, CngxAlertAction } from '@cngx/ui/feedback';",
    "import { createManualState } from '@cngx/common/data';",
  ],
  setup: `
  // ── Static demos ──
  protected readonly dismissed = signal(false);

  // ── State-driven demo ──
  protected readonly saveState = createManualState<string>();

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
  }

  // ── [when] demo ──
  protected readonly showAlert = signal(false);

  // ── Collapsible demo ──
  protected readonly collapseState = createManualState<string>();

  protected triggerCollapseError(): void {
    this.collapseState.setError('Validation failed: 3 fields have errors. Please review the form and correct the highlighted fields before submitting again.');
  }
  `,
  sections: [
    {
      title: 'Severities',
      subtitle: 'Four severity levels with distinct icons. Color is never the only indicator (WCAG 1.4.1). Enter animation plays on first render.',
      imports: ['CngxAlert'],
      template: `
  <div style="display:flex;flex-direction:column;gap:12px">
    <cngx-alert severity="info" title="Info">This is an informational message.</cngx-alert>
    <cngx-alert severity="success" title="Success">Operation completed successfully.</cngx-alert>
    <cngx-alert severity="warning" title="Warning">Please review before continuing.</cngx-alert>
    <cngx-alert severity="error" title="Error">Something went wrong. Please try again.</cngx-alert>
  </div>`,
    },
    {
      title: 'Closable',
      subtitle: 'Dismiss button via <code>[closable]</code>. SR announces "Alert dismissed".',
      imports: ['CngxAlert'],
      template: `
  @if (!dismissed()) {
    <cngx-alert severity="warning" title="Unsaved changes" [closable]="true" (dismissed)="dismissed.set(true)">
      Your changes will be lost if you leave this page.
    </cngx-alert>
  } @else {
    <button (click)="dismissed.set(false)" class="chip">Show alert again</button>
  }`,
    },
    {
      title: 'Action Buttons',
      subtitle: 'Project <code>button[cngxAlertAction]</code> inside the alert. Sets <code>aria-atomic="false"</code> to prevent full re-announcement on button interaction.',
      imports: ['CngxAlert', 'CngxAlertAction'],
      template: `
  <cngx-alert severity="error" title="Save failed" [closable]="true">
    Check your connection and try again.
    <button cngxAlertAction (click)="simulateLoading()" class="chip" style="margin-top:8px">Retry</button>
  </cngx-alert>`,
    },
    {
      title: 'State-Driven Visibility',
      subtitle: 'Bind <code>[state]</code> to a <code>CngxAsyncState</code>. Shows on error/success/loading, hides on idle. Success auto-dismisses after 5s. Hover/focus pauses the timer (WCAG 2.2.1).',
      imports: ['CngxAlert'],
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
    },
    {
      title: 'Boolean Trigger ([when])',
      subtitle: '<code>[when]</code> controls visibility directly. Enter/exit animations play on transitions.',
      imports: ['CngxAlert'],
      template: `
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="showAlert.set(true)" class="chip">Show</button>
    <button (click)="showAlert.set(false)" class="chip">Hide</button>
  </div>

  <cngx-alert [when]="showAlert()" severity="info" title="Triggered Alert">
    This alert is controlled by a boolean signal.
  </cngx-alert>`,
    },
    {
      title: 'Auto-Collapse',
      subtitle: '<code>[collapsible]</code> collapses body after <code>[collapseDelay]</code>. Expands on hover/focus, re-collapses on leave. <code>aria-expanded</code> tracks state. SR still reads full content.',
      imports: ['CngxAlert', 'CngxAlertAction'],
      template: `
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="triggerCollapseError()" class="chip">Trigger Error</button>
  </div>

  <cngx-alert [state]="collapseState" severity="error" title="Validation Failed"
    [collapsible]="true" [collapseDelay]="3000" [closable]="true">
    3 fields have errors. Please review the form and correct the highlighted fields before submitting again.
    <button cngxAlertAction class="chip" style="margin-top:8px">Show Details</button>
  </cngx-alert>`,
    },
  ],
};
