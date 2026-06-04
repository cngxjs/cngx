import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxToggle: Label position',
  subtitle:
    '<code>[labelPosition]="\'before\'"</code> renders the label to the left of the track via <code>flex-direction: row-reverse</code> on the host class.',
  description:
    'Flips the host shell from flex-direction:row to row-reverse via the .cngx-toggle--label-before class. Useful for right-aligned label columns or pages where the label visually leads the control. Both forms keep the same DOM order, so the <ng-content> slot ships first in source order and screen readers still encounter label-then-control unless reading-order is overridden.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: ['CngxToggle'],
  moduleImports: ["import { CngxToggle } from '@cngx/common/interactive';"],
  imports: ['CngxToggle'],
  references: [
    { label: 'WAI-ARIA APG: Switch', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/switch/' },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  setup: `protected readonly notifications = signal(false);`,
  template: `
  <div style="display: flex; flex-wrap: wrap; gap: 24px;">
    <cngx-toggle [(value)]="notifications" labelPosition="before">Label before</cngx-toggle>
    <cngx-toggle [(value)]="notifications">Label after (default)</cngx-toggle>
  </div>`,
};
