import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion panel: Spec list',
  subtitle:
    'A panel body as a description list (<code>&lt;dl&gt;</code>) of term/value pairs - the natural markup for a product spec sheet folded behind a disclosure.',
  description:
    'The body is a semantic <code>&lt;dl&gt;</code>; the accordion only controls its visibility. Each <code>&lt;dt&gt;</code>/<code>&lt;dd&gt;</code> pair stays a first-class part of the a11y tree once the panel opens.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['composition'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: ['CngxAccordionGroup', 'CngxAccordionItem', 'CngxAccordionItemTitle'],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <cngx-accordion-group [multi]="true" [headingLevel]="3" style="max-width:520px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Display</span>
      <dl style="margin:0; display:grid; grid-template-columns:auto 1fr; gap:.4rem 1rem">
        <dt style="font-weight:600">Size</dt><dd style="margin:0">14-inch</dd>
        <dt style="font-weight:600">Resolution</dt><dd style="margin:0">2560 x 1600</dd>
        <dt style="font-weight:600">Refresh</dt><dd style="margin:0">120 Hz</dd>
      </dl>
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Battery</span>
      <dl style="margin:0; display:grid; grid-template-columns:auto 1fr; gap:.4rem 1rem">
        <dt style="font-weight:600">Capacity</dt><dd style="margin:0">72 Wh</dd>
        <dt style="font-weight:600">Charging</dt><dd style="margin:0">USB-C 96 W</dd>
        <dt style="font-weight:600">Life</dt><dd style="margin:0">Up to 18 h</dd>
      </dl>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
