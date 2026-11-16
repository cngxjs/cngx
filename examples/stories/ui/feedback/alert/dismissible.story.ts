import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAlert: dismissible',
  subtitle: 'Dismiss button via <code>[dismissible]</code>. SR announces "Alert dismissed".',
  description: 'User-dismissible variant: <code>[dismissible]</code> renders the close button, <code>(dismissed)</code> fires when the user clicks it, and the alert announces its removal to assistive tech.',
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
    'CngxAlertIcon',
  ],
  moduleImports: [
    'import { CngxAlert } from \'@cngx/ui/feedback\';',
  ],
  imports: ['CngxAlert'],
  setup: `protected readonly dismissed = signal(false);`,
  template: `
  @if (!dismissed()) {
    <cngx-alert severity="warning" title="Unsaved changes" [dismissible]="true" (dismissed)="dismissed.set(true)">
      Your changes will be lost if you leave this page.
    </cngx-alert>
  } @else {
    <button (click)="dismissed.set(false)" class="chip" type="button">Show alert again</button>
  }`,
};
