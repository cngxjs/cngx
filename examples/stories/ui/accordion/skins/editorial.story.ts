import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Editorial',
  subtitle:
    'The <code>cngx-accordion-skin-editorial</code> skin: a mono running index in the leading slot, a left-aligned heading with a secondary subtitle line. Same organism, purely a themed shell.',
  description:
    'Apply the skin by adding the class to the group. Feed each item a leading index via <code>[cngxAccordionItemLeading]</code> and a secondary line via <code>[cngxAccordionItemSubtitle]</code>; the CSS styles the index font and heading alignment.',
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
  template: `  <cngx-accordion-group class="cngx-accordion-skin-editorial" [headingLevel]="3" style="max-width:560px">
    <cngx-accordion-item>
      <span cngxAccordionItemLeading>01</span>
      <span cngxAccordionItemTitle>The brief</span>
      <span cngxAccordionItemSubtitle>What the client asked for, in one sentence.</span>
      A short paragraph restating the goal before the work begins.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemLeading>02</span>
      <span cngxAccordionItemTitle>The approach</span>
      <span cngxAccordionItemSubtitle>How the team decided to get there.</span>
      Constraints, trade-offs, and the plan that survived them.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemLeading>03</span>
      <span cngxAccordionItemTitle>The result</span>
      <span cngxAccordionItemSubtitle>What shipped and what it changed.</span>
      Numbers where they exist, honest notes where they do not.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
