import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAlert: action buttons',
  subtitle: 'Project <code>button[cngxAlertAction]</code> inside the alert. Sets <code>aria-atomic="false"</code> to prevent full re-announcement on button interaction.',
  description: 'Recovery affordance pattern: an error alert with an inline Retry button. The action button reactivates the failed flow by flipping the bound async-state back to <code>loading</code>; the alert opts out of full re-announcement so AT users are not re-narrated on every click.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
  ],
  apiComponents: [
    'CngxAlert',
    'CngxAlertAction',
  ],
  moduleImports: [
    'import { CngxAlert, CngxAlertAction } from \'@cngx/ui/feedback\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAlert', 'CngxAlertAction'],
  setup: `protected readonly saveState = createManualState<string>();
  protected handleRetry(): void {
    this.saveState.set('loading');
    setTimeout(() => this.saveState.setError('Connection timeout - retry again'), 1500);
  }`,
  template: `
  <cngx-alert [state]="saveState" severity="error" title="Save failed" [closable]="true">
    @if (saveState.status() === 'loading') {
      Retrying...
    } @else {
      Check your connection and try again.
    }
    <button cngxAlertAction (click)="handleRetry()" class="chip" type="button" style="margin-top:8px" [disabled]="saveState.status() === 'loading'">
      {{ saveState.status() === 'loading' ? 'Retrying...' : 'Retry' }}
    </button>
  </cngx-alert>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button (click)="saveState.setError('Network timeout')" class="chip" type="button">Trigger error</button>
    <button (click)="saveState.reset()" class="chip" type="button">Reset</button>
  </div>`,
};
