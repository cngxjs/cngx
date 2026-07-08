import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Accordion skin: Data grid',
  subtitle:
    'The <code>cngx-accordion-skin-data-grid</code> skin aligns each header into columns (id, title, amount/due) so a list of records reads like a table you can expand. Pair it with a consumer caption row.',
  description:
    'The skin lays the header out with <code>--cngx-accordion-datagrid-columns</code>. Because the column labels are consumer chrome (not part of the accordion), add a caption row above the group whose grid mirrors the skin columns - id / title / meta. Feed each item an id via the leading slot and amount + due via the meta slot.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: ['CngxAccordionGroup', 'CngxAccordionItem'],
  imports: [
    'CngxAccordionGroup',
    'CngxAccordionItem',
    'CngxAccordionItemTitle',
    'CngxAccordionItemLeading',
    'CngxAccordionItemMeta',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <div style="max-width:640px">
    <div
      style="display:grid; grid-template-columns:11ch 1fr auto; gap:.75rem; padding:.5rem 1rem; font-size:.75rem; font-weight:600; text-transform:uppercase; letter-spacing:.04em; color:var(--cngx-color-text-muted, #6b7280)"
      aria-hidden="true"
    >
      <span>Invoice</span>
      <span>Customer</span>
      <span>Amount / due</span>
    </div>
    <cngx-accordion-group class="cngx-accordion-skin-data-grid" [multi]="true" [headingLevel]="3">
      <cngx-accordion-item>
        <span cngxAccordionItemLeading>INV-1042</span>
        <span cngxAccordionItemTitle>Northwind Traders</span>
        <span cngxAccordionItemMeta>$1,280 - due Jul 12</span>
        Net 30 terms. Two line items, no disputes.
      </cngx-accordion-item>
      <cngx-accordion-item>
        <span cngxAccordionItemLeading>INV-1043</span>
        <span cngxAccordionItemTitle>Contoso Ltd</span>
        <span cngxAccordionItemMeta>$640 - due Jul 18</span>
        Partial payment received; balance carried forward.
      </cngx-accordion-item>
      <cngx-accordion-item>
        <span cngxAccordionItemLeading>INV-1044</span>
        <span cngxAccordionItemTitle>Fabrikam Inc</span>
        <span cngxAccordionItemMeta>$3,100 - overdue</span>
        Reminder sent; escalate if unpaid by end of week.
      </cngx-accordion-item>
    </cngx-accordion-group>
  </div>`,
};
