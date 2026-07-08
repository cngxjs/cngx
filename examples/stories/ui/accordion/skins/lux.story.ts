import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Lux',
  subtitle:
    'The <code>cngx-accordion-skin-lux</code> skin: generous padding, a muted header colour, and a wide title-to-chevron gap for an unhurried, premium feel. Subtitle only.',
  description:
    'A restrained theme built from spacing and colour tokens - no extra slots beyond an optional subtitle. Add the class to the group and keep the markup minimal.',
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
  template: `  <cngx-accordion-group class="cngx-accordion-skin-lux" [headingLevel]="3" style="max-width:560px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Concierge</span>
      <span cngxAccordionItemSubtitle>A dedicated point of contact.</span>
      Reach your concierge any time through the app or by phone.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Suite upgrades</span>
      <span cngxAccordionItemSubtitle>Subject to availability at check-in.</span>
      Complimentary upgrades when a higher category is open.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Late checkout</span>
      <span cngxAccordionItemSubtitle>Until 2pm at no charge.</span>
      Request a later departure the evening before.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
