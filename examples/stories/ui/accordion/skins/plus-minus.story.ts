import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Plus / minus',
  subtitle:
    'The <code>[skin]="\'plus-minus\'"</code> skin swaps the chevron for a boxed +/- marker that flips on open. Pure CSS - no icon slot, no template.',
  description:
    'The marker is drawn entirely from the skin CSS off the existing <code>data-expanded</code> attribute, so the markup is a plain accordion with subtitles. No <code>*cngxAccordionItemIcon</code> template needed.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: [
    'CngxAccordionGroup',
    'CngxAccordionItem',
    'CngxAccordionItemTitle',
    'CngxAccordionItemSubtitle',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [skin]="'plus-minus'" [headingLevel]="3" style="max-width:520px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>How do refunds work?</span>
      <span cngxAccordionItemSubtitle>Timelines and eligibility.</span>
      Refunds land within 5-10 business days on the original method.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Can I change my plan later?</span>
      <span cngxAccordionItemSubtitle>Upgrades and downgrades.</span>
      Yes - upgrades apply immediately, downgrades at the next cycle.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Do you offer a free trial?</span>
      <span cngxAccordionItemSubtitle>What is included.</span>
      A 14-day trial with no card required, full feature access.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
