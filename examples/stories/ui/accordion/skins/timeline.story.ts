import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Timeline',
  subtitle:
    'The <code>cngx-accordion-skin-timeline</code> skin draws a vertical rail with a node per header. Set <code>[multi]="false"</code> so the accordion reads as a single walkthrough - one step open at a time.',
  description:
    'The rail and nodes are pure CSS off the header positions, so no leading slot is needed - subtitles carry the step detail. Kept exclusive via <code>[multi]="false"</code>: opening a step collapses the previous one, matching the one-at-a-time reading order the rail implies.',
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
  template: `  <cngx-accordion-group class="cngx-accordion-skin-timeline" [multi]="false" [headingLevel]="3" style="max-width:560px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Order placed</span>
      <span cngxAccordionItemSubtitle>Confirmed and paid.</span>
      Your order was received and payment authorised.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Packed</span>
      <span cngxAccordionItemSubtitle>Picked from the warehouse.</span>
      Items were picked, packed, and labelled for dispatch.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Shipped</span>
      <span cngxAccordionItemSubtitle>Handed to the carrier.</span>
      A tracking number was issued and the parcel is in transit.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
