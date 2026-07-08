import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Primary frame',
  subtitle:
    'The <code>cngx-accordion-skin-primary-frame</code> skin draws a bordered frame with a soft glow around the currently open item. Border and pulse are pure CSS off <code>data-expanded</code>. Subtitle only.',
  description:
    'The open item is framed and lightly pulsed to draw the eye to the active panel - useful when one section deserves focus. No extra slots: add the class and keep the markup plain.',
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
  template: `  <cngx-accordion-group class="cngx-accordion-skin-primary-frame" [headingLevel]="3" style="max-width:560px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Choose a plan</span>
      <span cngxAccordionItemSubtitle>Monthly or annual billing.</span>
      Pick the tier that fits; switch any time from settings.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Add your team</span>
      <span cngxAccordionItemSubtitle>Invite by email.</span>
      Seats are billed per active member each cycle.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Confirm and pay</span>
      <span cngxAccordionItemSubtitle>Review before you commit.</span>
      A summary of charges appears before the final step.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
