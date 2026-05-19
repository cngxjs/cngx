import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Severities',
  subtitle: 'Four severity levels with distinct icons. Color is never the only indicator (WCAG 1.4.1). Enter animation plays on first render.',
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
  ],
  imports: ['CngxAlert'],
  template: `
  <div style="display:flex;flex-direction:column;gap:12px">
    <cngx-alert severity="info" title="Info">This is an informational message.</cngx-alert>
    <cngx-alert severity="success" title="Success">Operation completed successfully.</cngx-alert>
    <cngx-alert severity="warning" title="Warning">Please review before continuing.</cngx-alert>
    <cngx-alert severity="error" title="Error">Something went wrong. Please try again.</cngx-alert>
  </div>`,
};
