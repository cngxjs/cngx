import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Ledger',
  subtitle:
    'The <code>[skin]="\'ledger\'"</code> skin frames the grid like an account ledger - a mono uppercase column head, zebra rows, right-aligned amounts, an inset primary-accent detail zone, and a sum footer. Every row is still a disclosure: click to expand its detail.',
  description:
    'Column widths are declared on the header cells with <code>col</code> (<code>grow</code> for the customer, <code>md</code> for the mono amounts, <code>fit</code> for the status tag); the group derives one shared template from them, so header, rows, and footer align with zero measurement and no <code>grid-template-columns</code> string. The status cell is a <code>&lt;cngx-tag&gt;</code>, not hand-written pill CSS. On narrow screens the grid scrolls sideways with every column intact instead of dropping one. Mark one cell <code>primary</code> so a screen reader names the row by the customer alone.',
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
      [multi]="true"
      [headingLevel]="3"
    >
      <cngx-dga-header>
        <span cngxDgaCell col="md">Invoice</span>
        <span cngxDgaCell col="grow">Customer</span>
        <span cngxDgaCell col="md" align="end">Amount</span>
        <span cngxDgaCell col="fit" align="end">Status</span>
      </cngx-dga-header>

      <cngx-dga-row panelId="inv-1042">
        <span cngxDgaCell>INV-1042</span>
        <span cngxDgaCell primary>Northwind Traders</span>
        <span cngxDgaCell align="end">$1,280</span>
        <span cngxDgaCell align="end">
          <cngx-tag color="success" variant="subtle" size="sm">Paid</cngx-tag>
        </span>
        Net 30 terms. Two line items, no disputes.
      </cngx-dga-row>

      <cngx-dga-row panelId="inv-1043">
        <span cngxDgaCell>INV-1043</span>
        <span cngxDgaCell primary>Contoso Ltd</span>
        <span cngxDgaCell align="end">$640</span>
        <span cngxDgaCell align="end">
          <cngx-tag color="warning" variant="subtle" size="sm">Partial</cngx-tag>
        </span>
        Partial payment received; balance carried forward.
      </cngx-dga-row>

      <cngx-dga-row panelId="inv-1044">
        <span cngxDgaCell>INV-1044</span>
        <span cngxDgaCell primary>Fabrikam Inc</span>
        <span cngxDgaCell align="end">$3,100</span>
        <span cngxDgaCell align="end">
          <cngx-tag color="error" variant="subtle" size="sm">Overdue</cngx-tag>
        </span>
        Reminder sent; escalate if unpaid by end of week.
      </cngx-dga-row>

      <cngx-dga-footer>
        <span cngxDgaCell>3 invoices</span>
        <span cngxDgaCell></span>
        <span cngxDgaCell align="end">$5,020</span>
        <span cngxDgaCell align="end"></span>
      </cngx-dga-footer>
    </cngx-data-grid-accordion>
  </div>`,
};
