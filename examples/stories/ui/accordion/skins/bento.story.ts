import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Bento',
  subtitle:
    'The <code>[skin]="\'bento\'"</code> skin lays items out as tiles with a glyph in the leading slot and a pill in the meta slot. Add <code>cngx-accordion-item--wide</code> to span one tile across the row.',
  description:
    'The skin sets a tiled grid on the group. Give each item a short glyph via <code>[cngxAccordionItemLeading]</code>, a pill via <code>[cngxAccordionItemMeta]</code>, and mark one item wide with the item modifier class.',
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
    <cngx-accordion-item class="cngx-accordion-item--wide">
      <span cngxAccordionItemLeading>▤</span>
      <span cngxAccordionItemTitle>Overview</span>
      <span cngxAccordionItemSubtitle>Everything at a glance.</span>
      <span cngxAccordionItemMeta>featured</span>
      The headline tile spans the full row so the summary reads first.
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
