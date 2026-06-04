import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAlert: severities',
  subtitle: 'Four severity levels with distinct icons. Color is never the only indicator (WCAG 1.4.1). Enter animation plays on first render.',
  description: 'Variant matrix: <code>info</code>, <code>success</code>, <code>warning</code>, <code>error</code> rendered side-by-side. Each carries a unique icon so severity stays legible without colour.',
  level: 'molecule',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'composition', 'a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG - Alert', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/alert/' },
    { label: 'WCAG 1.4.1 Use of Color', href: 'https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html' },
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
  template: `
  <div class="demo-stack">
    <cngx-alert severity="info" title="Info">This is an informational message.</cngx-alert>
    <cngx-alert severity="success" title="Success">Operation completed successfully.</cngx-alert>
    <cngx-alert severity="warning" title="Warning">Please review before continuing.</cngx-alert>
    <cngx-alert severity="error" title="Error">Something went wrong. Please try again.</cngx-alert>
  </div>`,
};
