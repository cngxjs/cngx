import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Action Buttons',
  subtitle: 'Project <code>button[cngxAlertAction]</code> inside the alert. Sets <code>aria-atomic="false"</code> to prevent full re-announcement on button interaction.',
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
  setup: `protected readonly saveState = createManualState<string>();
  protected simulateLoading(): void {
    this.saveState.set('loading');
  }`,
  template: `
  <cngx-alert severity="error" title="Save failed" [closable]="true">
    Check your connection and try again.
    <button cngxAlertAction (click)="simulateLoading()" class="chip" style="margin-top:8px">Retry</button>
  </cngx-alert>`,
};
