import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPhoneInput: disabled with a reason',
  subtitle:
    'A disabled phone input fades the country picker and the number once, by colour, and names the reason through <code>aria-describedby</code>.',
  description:
    'Disabled state of the composed field control. The country select and the number input both take the disabled field recipe; the group itself adds no fade on top. The host carries <code>aria-disabled</code>, and the always-present reason span is referenced only while the control is disabled.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern'],
  apiComponents: ['CngxPhoneInput'],
  moduleImports: ["import { CngxPhoneInput } from '@cngx/forms/input';"],
  imports: ['CngxPhoneInput'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-disabled',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-disabled',
    },
  ],
  template: `
  <cngx-phone-input
    ariaLabel="Contact number"
    value="664 1234567"
    [disabled]="true"
    disabledReason="The contact number is managed by your administrator"
  />`,
};
