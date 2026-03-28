import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Alert',
  navLabel: 'Alert',
  navCategory: 'feedback',
  description: 'Inline persistent alert with severity-based styling, default icons, dismissible option, and state-driven auto-show/hide.',
  apiComponents: ['CngxAlert'],
  moduleImports: [
    "import { CngxAlert } from '@cngx/ui/feedback';",
  ],
  setup: `
  protected readonly dismissed = signal(false);
  `,
  sections: [
    {
      title: 'Severities',
      subtitle: 'Four severity levels with default icons. Color is never the only indicator.',
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
      title: 'Dismissible',
      subtitle: 'Click the close button. Focus returns to the previous element.',
      imports: ['CngxAlert'],
      template: `
  @if (!dismissed()) {
    <cngx-alert severity="warning" title="Unsaved changes" [dismissible]="true" (dismissed)="dismissed.set(true)">
      Your changes will be lost if you leave this page.
    </cngx-alert>
  } @else {
    <button (click)="dismissed.set(false)" class="chip">Show alert again</button>
  }`,
    },
  ],
};
