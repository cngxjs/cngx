import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxCheckbox: disabled',
  subtitle:
    'A disabled checkbox short-circuits both <code>handleClick</code> and <code>handleKeydown</code>, sets <code>aria-disabled="true"</code>, and drops <code>tabindex</code> to <code>-1</code> so it leaves the tab order while remaining programmatically focusable.',
  description:
    'Demonstrates the three disabled visual states (locked-on, locked-off, locked-mixed) and the cancel-mutation contract. <code>disabled()</code> gates <code>advance()</code> so the click and keydown handlers exit early; the indicator dims via the <code>--cngx-checkbox-disabled-opacity</code> token instead of swapping templates. The optional <code>[disabledReason]</code> input drops a string into a permanently-attached SR-only span; the host points <code>aria-describedby</code> at it only while the reason is non-empty.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WAI-ARIA APG: Checkbox Pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/checkbox/',
    },
    {
      label: 'WCAG 1.3.1 Info and Relationships',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/info-and-relationships.html',
    },
    {
      label: 'WCAG 4.1.2 Name, Role, Value',
      href: 'https://www.w3.org/WAI/WCAG21/Understanding/name-role-value.html',
    },
  ],
  apiComponents: ['CngxCheckbox'],
  moduleImports: [
    "import { CngxCheckbox } from '@cngx/common/interactive';",
  ],
  imports: ['CngxCheckbox'],
  template: `
  <cngx-checkbox [value]="true" [disabled]="true">Locked-on</cngx-checkbox>
  <cngx-checkbox [value]="false" [disabled]="true">Locked-off</cngx-checkbox>
  <cngx-checkbox [value]="false" [indeterminate]="true" [disabled]="true">Locked-mixed</cngx-checkbox>`,
};
