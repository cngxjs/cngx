import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Bento',
  subtitle:
    'The <code>[skin]="\'bento\'"</code> skin lays items out as full-width tile cards - a glyph in the leading slot, a status pill in the meta slot, the chevron on the outer edge. No per-item markup.',
  description:
    'The skin stacks full-width cards, each sizing to its own content. Give each item a short glyph via <code>[cngxAccordionItemLeading]</code> and a pill via <code>[cngxAccordionItemMeta]</code>.',
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
    'CngxAccordionItemMeta',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [skin]="'bento'" [multi]="true" [headingLevel]="3" style="max-width:640px">
    <cngx-accordion-item>
      <span cngxAccordionItemLeading>▤</span>
      <span cngxAccordionItemTitle>Overview</span>
      <span cngxAccordionItemSubtitle>Everything at a glance.</span>
      <span cngxAccordionItemMeta>featured</span>
      A quick summary tile; the grid places it beside its neighbours.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemLeading>◆</span>
      <span cngxAccordionItemTitle>Usage</span>
      <span cngxAccordionItemMeta>live</span>
      Current period consumption against your plan limits.
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemLeading>◈</span>
      <span cngxAccordionItemTitle>Alerts</span>
      <span cngxAccordionItemMeta>3 new</span>
      Threshold and anomaly notifications from the last 24 hours.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
