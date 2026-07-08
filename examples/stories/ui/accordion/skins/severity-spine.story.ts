import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Severity spine',
  subtitle:
    'The <code>[skin]="\'severity-spine\'"</code> skin runs a coloured spine down the leading edge. Set the hue per item with <code>[style.--cngx-accordion-spine-color]</code>; the leading slot holds the priority label and the meta slot the ticket + SLA.',
  description:
    'The skin reads <code>--cngx-accordion-spine-color</code> off each item, so bind it inline per row - P1 red, P2 amber, P3 blue. Priority text goes in the leading slot, ticket id and SLA in the meta slot.',
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
  template: `  <cngx-accordion-group [skin]="'severity-spine'" [multi]="true" [headingLevel]="3" style="max-width:600px">
    <cngx-accordion-item [style.--cngx-accordion-spine-color]="'#dc2626'">
      <span cngxAccordionItemLeading>P1</span>
      <span cngxAccordionItemTitle>Checkout returns 500</span>
      <span cngxAccordionItemSubtitle>Payment capture failing intermittently.</span>
      <span cngxAccordionItemMeta>OPS-4821 - SLA 1h</span>
      Errors spiked after the 14:00 deploy; rollback in progress.
    </cngx-accordion-item>
    <cngx-accordion-item [style.--cngx-accordion-spine-color]="'#d97706'">
      <span cngxAccordionItemLeading>P2</span>
      <span cngxAccordionItemTitle>Search latency elevated</span>
      <span cngxAccordionItemSubtitle>p95 above target on EU region.</span>
      <span cngxAccordionItemMeta>OPS-4822 - SLA 4h</span>
      Cache warm-up underway; no user-facing errors yet.
    </cngx-accordion-item>
    <cngx-accordion-item [style.--cngx-accordion-spine-color]="'#2563eb'">
      <span cngxAccordionItemLeading>P3</span>
      <span cngxAccordionItemTitle>Stale avatar thumbnails</span>
      <span cngxAccordionItemSubtitle>CDN not purging on upload.</span>
      <span cngxAccordionItemMeta>OPS-4823 - SLA 2d</span>
      Cosmetic only; queued behind the current incident.
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
