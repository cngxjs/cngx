import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAlert: auto collapse',
  subtitle: '<code>[collapsible]</code> collapses body after <code>[collapseDelay]</code>. Expands on hover/focus, re-collapses on leave. <code>aria-expanded</code> tracks state. SR still reads full content.',
  description: 'Long-message density control: a long error message shrinks to its title after a short dwell, expands on hover or focus, and re-collapses on leave. Screen-reader content stays full at all times.',
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
    'import { CngxAlert, CngxAlertAction } from \'@cngx/ui/feedback\';',
    'import { createManualState } from \'@cngx/common/data\';',
  ],
  imports: ['CngxAlert', 'CngxAlertAction'],
  setup: `protected readonly collapseState = createManualState<string>();
  protected triggerCollapseError(): void {
    this.collapseState.setError('Validation failed: 3 fields have errors. Please review the form and correct the highlighted fields before submitting again.');
  }`,
  template: `
  <cngx-alert [state]="collapseState" severity="error" title="Validation Failed"
    [collapsible]="true" [collapseDelay]="3000" [closable]="true">
    3 fields have errors. Please review the form and correct the highlighted fields before submitting again.
    <button cngxAlertAction class="chip" type="button" style="margin-top:8px">Show Details</button>
  </cngx-alert>`,
  templateChrome: `<div class="button-row" style="margin-bottom:12px">
    <button (click)="triggerCollapseError()" class="chip" type="button">Trigger Error</button>
  </div>`,
};
