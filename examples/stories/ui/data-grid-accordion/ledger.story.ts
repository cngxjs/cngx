import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Ledger',
  subtitle:
    'The <code>[skin]="\'ledger\'"</code> skin frames the grid like an account ledger - a mono uppercase column head, zebra rows, right-aligned amounts, an inset primary-accent detail zone, and a sum footer. Every row is still a disclosure: click to expand its detail.',
  description:
    'Header, every row, and the footer share one <code>[columns]</code> template, so the columns align with zero measurement. The status cell is a <code>&lt;cngx-tag&gt;</code>, not hand-written pill CSS. Under 620px a container query drops the invoice and status columns. Mark one cell <code>primary</code> so a screen reader names the row by the customer alone.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['visual-variants'],
  apiComponents: ['CngxDataGridAccordion', 'CngxDataGridRow', 'CngxDgCell'],
  imports: [
    'CngxDataGridAccordion',
    'CngxDataGridRow',
    'CngxDataGridHeader',
    'CngxDataGridFooter',
    'CngxDgCell',
    'CngxTag',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <div style="max-width:640px">
    <cngx-data-grid-accordion
      [skin]="'ledger'"
      columns="7rem 1fr 6rem 7rem 40px"
      [multi]="true"
      [headingLevel]="3"
    >
      <cngx-data-grid-header>
        <span cngxDgCell>Invoice</span>
        <span cngxDgCell>Customer</span>
        <span cngxDgCell align="end">Amount</span>
        <span cngxDgCell align="end">Status</span>
      </cngx-data-grid-header>

      <cngx-data-grid-row panelId="inv-1042">
        <span cngxDgCell>INV-1042</span>
        <span cngxDgCell primary>Northwind Traders</span>
        <span cngxDgCell align="end">$1,280</span>
        <span cngxDgCell align="end">
          <cngx-tag color="success" variant="subtle" size="sm">Paid</cngx-tag>
        </span>
        Net 30 terms. Two line items, no disputes.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="inv-1043">
        <span cngxDgCell>INV-1043</span>
        <span cngxDgCell primary>Contoso Ltd</span>
        <span cngxDgCell align="end">$640</span>
        <span cngxDgCell align="end">
          <cngx-tag color="warning" variant="subtle" size="sm">Partial</cngx-tag>
        </span>
        Partial payment received; balance carried forward.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="inv-1044">
        <span cngxDgCell>INV-1044</span>
        <span cngxDgCell primary>Fabrikam Inc</span>
        <span cngxDgCell align="end">$3,100</span>
        <span cngxDgCell align="end">
          <cngx-tag color="error" variant="subtle" size="sm">Overdue</cngx-tag>
        </span>
        Reminder sent; escalate if unpaid by end of week.
      </cngx-data-grid-row>

      <cngx-data-grid-footer>
        <span cngxDgCell>3 invoices</span>
        <span cngxDgCell></span>
        <span cngxDgCell align="end">$5,020</span>
        <span cngxDgCell align="end"></span>
      </cngx-data-grid-footer>
    </cngx-data-grid-accordion>
  </div>`,
};
