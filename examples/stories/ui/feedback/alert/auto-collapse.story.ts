import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Auto-Collapse',
  subtitle: '<code>[collapsible]</code> collapses body after <code>[collapseDelay]</code>. Expands on hover/focus, re-collapses on leave. <code>aria-expanded</code> tracks state. SR still reads full content.',
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
    'import { CngxAlert, CngxAlertAction } from \'@cngx/ui/feedback\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAlert', 'CngxAlertAction'],
  setup: `protected readonly collapseState = createManualState<string>();
  protected triggerCollapseError(): void {
    this.collapseState.setError('Validation failed: 3 fields have errors. Please review the form and correct the highlighted fields before submitting again.');
  }`,
  template: `
  <div style="display:flex;gap:8px;margin-bottom:12px">
    <button (click)="triggerCollapseError()" class="chip">Trigger Error</button>
  </div>

  <cngx-alert [state]="collapseState" severity="error" title="Validation Failed"
    [collapsible]="true" [collapseDelay]="3000" [closable]="true">
    3 fields have errors. Please review the form and correct the highlighted fields before submitting again.
    <button cngxAlertAction class="chip" style="margin-top:8px">Show Details</button>
  </cngx-alert>`,
};
