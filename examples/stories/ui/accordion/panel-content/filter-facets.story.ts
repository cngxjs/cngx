import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion panel: Filter facets',
  subtitle:
    'Each panel body is an ordinary form fieldset with a <code>&lt;legend&gt;</code> and labelled native controls. The accordion projects it verbatim and never inspects the form.',
  description:
    'The panel hosts real form controls; the accordion never inspects them. Bodies are plain projected content, so any labelled <code>&lt;fieldset&gt;</code> works - checkboxes, radios, and their <code>&lt;label for&gt;</code> pairs stay a11y-clean.',
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
  template: `  <cngx-accordion-group [multi]="true" [headingLevel]="3" style="max-width:480px">
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Availability</span>
      <fieldset style="border:0; padding:0; margin:0">
        <legend style="font-weight:600; margin-bottom:.5rem">Availability</legend>
        <label style="display:flex; gap:.5rem; align-items:center">
          <input type="checkbox" name="avail" value="in-stock" /> In stock
        </label>
        <label style="display:flex; gap:.5rem; align-items:center">
          <input type="checkbox" name="avail" value="preorder" /> Pre-order
        </label>
      </fieldset>
    </cngx-accordion-item>
    <cngx-accordion-item>
      <span cngxAccordionItemTitle>Delivery</span>
      <fieldset style="border:0; padding:0; margin:0">
        <legend style="font-weight:600; margin-bottom:.5rem">Delivery speed</legend>
        <label style="display:flex; gap:.5rem; align-items:center">
          <input type="radio" name="delivery" value="standard" checked /> Standard
        </label>
        <label style="display:flex; gap:.5rem; align-items:center">
          <input type="radio" name="delivery" value="express" /> Express
        </label>
      </fieldset>
    </cngx-accordion-item>
  </cngx-accordion-group>`,
};
