import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxAccordionGroup: Single-open',
  subtitle:
    'A styled <code>&lt;cngx-accordion-group&gt;</code>: opening one section collapses the others. Each <code>&lt;cngx-accordion-item&gt;</code> ships its own APG-correct heading, header button, region, and chevron.',
  description:
    'The organism wraps the headless coordinator brain, so one open-set signal drives every <code>aria-expanded</code> and arrow keys rove across the headers. Set <code>[headingLevel]</code> once on the group; every item reflects it as <code>aria-level</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemTitle'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [headingLevel]="3" style="max-width:480px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Shipping</span>
      Free shipping on orders over $50. Most orders arrive in 3-5 business days.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Returns</span>
      Returns accepted within 30 days of delivery, in original condition.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Warranty</span>
      Two-year limited warranty covering manufacturing defects.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
