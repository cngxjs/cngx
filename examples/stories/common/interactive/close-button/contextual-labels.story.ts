import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCloseButton: Contextual labels',
  subtitle: 'The required <code>[label]</code> input describes WHAT closes, not just THAT it closes. Screen readers announce the label as the button\'s accessible name.',
  description: 'The atom has no built-in idea of what it dismisses, so it cannot infer a label. A generic "Close" reads identically across a dialog, a toast, and a sidebar drawer, leaving screen-reader users with three indistinguishable buttons on the page. Pass the dismissable artifact\'s name (e.g. "Close session-expired alert", "Dismiss save-failed toast", "Close settings dialog") so the announcement is unambiguous. WAI-ARIA Authoring Practices Guide recommends button names that describe the resulting action.',
  level: 'atom',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern'],
  references: [
    { label: 'WAI-ARIA APG: Button', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/button/' },
    { label: 'WCAG 2.4.6 Headings and Labels', href: 'https://www.w3.org/WAI/WCAG21/Understanding/headings-and-labels.html' },
  ],
  apiComponents: [
    'CngxCloseButton',
  ],
  moduleImports: [
    'import { CngxCloseButton } from \'@cngx/common/interactive\';',
  ],
  imports: ['CngxCloseButton'],
  template: `
  <div style="display:grid; grid-template-columns: 14rem auto; gap:12px; align-items:center">
    <span>Session-expired alert</span>
    <cngx-close-button label="Close session-expired alert" />

    <span>Save-failed toast</span>
    <cngx-close-button label="Dismiss save-failed toast" />

    <span>Settings dialog</span>
    <cngx-close-button label="Close settings dialog" />

    <span>Filter sidebar</span>
    <cngx-close-button label="Collapse filter sidebar" />
  </div>`,
};
