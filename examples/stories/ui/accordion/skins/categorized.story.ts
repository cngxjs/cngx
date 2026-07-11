import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Categorized',
  subtitle:
    'The <code>[skin]="\'categorized\'"</code> skin renders each item as a lifted card and styles the leading slot as a category tag - pass the rubric colour per item via <code>--cngx-accordion-category-color</code>.',
  description:
    'The skin owns the card surface, the open-lift shadow, the neutral hover, and the tag-like leading pill. Put the category text in <code>[cngxAccordionItemLeading]</code> and hand the hue in through the <code>--cngx-accordion-category-color</code> custom property (here inline per item); no extra component needed.',
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
    'CngxAccordionItemLeading',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [skin]="'categorized'" [headingLevel]="3" style="max-width:560px">
    <cngx-accordion-item [style.--cngx-accordion-category-color]="'#5b54f0'">
      <span cngxAccordionItemLeading>Billing</span>
      <span cngxAccordionItemTitle>Update payment method</span>
      <span cngxAccordionItemSubtitle>Cards, SEPA, and invoice terms.</span>
      Change the card on file or switch to bank transfer for invoices.
    </cngx-accordion-item>
    <cngx-accordion-item [style.--cngx-accordion-category-color]="'#16a34a'">
      <span cngxAccordionItemLeading>Security</span>
      <span cngxAccordionItemTitle>Two-factor authentication</span>
      <span cngxAccordionItemSubtitle>Authenticator apps and recovery codes.</span>
      Enroll a device and store your recovery codes somewhere safe.
    </cngx-accordion-item>
    <cngx-accordion-item [style.--cngx-accordion-category-color]="'#f59e0b'">
      <span cngxAccordionItemLeading>Team</span>
      <span cngxAccordionItemTitle>Invite members</span>
      <span cngxAccordionItemSubtitle>Roles, seats, and pending invites.</span>
      Send invites by email and pick a role per seat.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
