import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRating: disabled with a reason',
  subtitle:
    'A disabled rating keeps its value, fades every star by colour and names the reason through <code>aria-describedby</code>.',
  description:
    'Disabled state of the positional rating. Clicks and arrow keys no-op, the host carries <code>aria-disabled</code>, and the always-present reason span is referenced only while the rating is disabled. Under forced colors the stars read GrayText.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['a11y-pattern'],
  apiComponents: ['CngxRating'],
  moduleImports: ["import { CngxRating } from '@cngx/forms/input';"],
  imports: ['CngxRating'],
  references: [
    {
      label: 'WAI-ARIA 1.2: aria-disabled',
      href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-disabled',
    },
  ],
  template: `
  <cngx-rating
    ariaLabel="Delivery rating"
    [value]="3"
    [disabled]="true"
    disabledReason="Ratings open once the order has been delivered"
  />`,
};
