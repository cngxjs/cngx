import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRadioIndicator: Default unchecked vs checked',
  subtitle: 'The circle frame is always rendered; the dot appears only when <code>[checked]="true"</code>.',
  description: 'Two indicators side-by-side establish the resting baseline. Both render a circle frame at all times; only the second has <code>[checked]="true"</code>, which surfaces the centred dot via the host class <code>.cngx-radio-indicator--checked</code>. The host carries <code>aria-hidden="true"</code> unconditionally; selection state is announced by the parent row\'s <code>role="radio"</code> + <code>aria-checked</code>, never by this decoration. This is the reference example for the decorative-graphic discipline.',
  level: 'atom',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'standalone',
  focus: ['visual-variants', 'a11y-pattern'],
  apiComponents: [
    'CngxRadioIndicator',
  ],
  moduleImports: [
    'import { CngxRadioIndicator } from \'@cngx/common/display\';',
  ],
  imports: ['CngxRadioIndicator'],
  references: [
    { label: 'WAI-ARIA 1.2: `aria-hidden`', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-hidden' },
    { label: 'WAI-ARIA 1.2: `radio` role', href: 'https://www.w3.org/TR/wai-aria-1.2/#radio' },
    { label: 'WAI-ARIA APG: Radio Group pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/radio/' },
  ],
  template: `
  <div class="demo-radio-row">
    <div class="demo-radio-cell">
      <cngx-radio-indicator />
      <span class="demo-radio-caption">unchecked</span>
    </div>
    <div class="demo-radio-cell">
      <cngx-radio-indicator [checked]="true" />
      <span class="demo-radio-caption">checked</span>
    </div>
  </div>`,
};
