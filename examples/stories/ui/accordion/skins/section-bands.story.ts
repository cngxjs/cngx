import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Section bands',
  subtitle:
    'The <code>[skin]="\'section-bands\'"</code> skin gives each header an inverted colour band with a status chip in the meta slot - useful for grouping a long form into labelled sections.',
  description:
    'The skin colours the header background and styles the meta slot as a chip. Put the section status in <code>[cngxAccordionItemMeta]</code>; the band and chip typography come from the skin.',
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
    'CngxAccordionItemMeta',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [skin]="'section-bands'" [multi]="true" [headingLevel]="3" style="max-width:600px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Applicant details</span>
      <span cngxAccordionItemSubtitle>Name, address, and contact.</span>
      <span cngxAccordionItemMeta>Complete</span>
      Personal information used across the application.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Employment</span>
      <span cngxAccordionItemSubtitle>Current and previous roles.</span>
      <span cngxAccordionItemMeta>In progress</span>
      History and income over the last three years.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Documents</span>
      <span cngxAccordionItemSubtitle>Uploads and verification.</span>
      <span cngxAccordionItemMeta>Action needed</span>
      Two proofs of address are still outstanding.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
