import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Report',
  subtitle:
    'The <code>[skin]="\'report\'"</code> skin drops the frame entirely and reads like a printed cost report: a <code>3px double</code> rule under the column head and over the sum foot, hairline dividers between rows, mono right-aligned budget and actual figures, and over-budget actuals called out in the danger colour.',
  description:
    'Column widths come from <code>col</code> on the header cells (<code>sm</code> for the cost-centre code, <code>grow</code> for the label, <code>md</code> for the two money columns); no <code>grid-template-columns</code> string. An over-budget actual is marked with a plain <code>data-over</code> attribute on the cell, so the red call-out stays a typed marker mapped to <code>--cngx-color-danger</code> rather than a hardcoded colour. Every row is still a disclosure: expand it for the variance note. On narrow screens the grid scrolls sideways with every column intact instead of dropping one.',
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
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  template: `  <div style="max-width:680px">
    <cngx-data-grid-accordion
      [skin]="'report'"
      [multi]="true"
      [headingLevel]="3"
    >
      <cngx-data-grid-header>
        <span cngxDgCell col="sm">KST</span>
        <span cngxDgCell col="grow">Cost centre</span>
        <span cngxDgCell col="md" align="end">Budget</span>
        <span cngxDgCell col="md" align="end">Actual</span>
      </cngx-data-grid-header>

      <cngx-data-grid-row panelId="kst-4100">
        <span cngxDgCell>4100</span>
        <span cngxDgCell primary>Marketing</span>
        <span cngxDgCell align="end">€48,000</span>
        <span cngxDgCell align="end" data-over>€52,400</span>
        Campaign spend ran 9% over on paid social; brand refresh pulled forward from Q4.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="kst-4200">
        <span cngxDgCell>4200</span>
        <span cngxDgCell primary>Sales</span>
        <span cngxDgCell align="end">€96,000</span>
        <span cngxDgCell align="end">€91,200</span>
        Under budget after two open headcounts stayed unfilled through the quarter.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="kst-4300">
        <span cngxDgCell>4300</span>
        <span cngxDgCell primary>Engineering</span>
        <span cngxDgCell align="end">€180,000</span>
        <span cngxDgCell align="end" data-over>€184,500</span>
        Cloud spend above plan; committed-use discount negotiation moved to next period.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="kst-4400">
        <span cngxDgCell>4400</span>
        <span cngxDgCell primary>Operations</span>
        <span cngxDgCell align="end">€64,000</span>
        <span cngxDgCell align="end">€61,800</span>
        On plan; facilities renewal came in slightly under the negotiated cap.
      </cngx-data-grid-row>

      <cngx-data-grid-footer>
        <span cngxDgCell></span>
        <span cngxDgCell primary>Total</span>
        <span cngxDgCell align="end">€388,000</span>
        <span cngxDgCell align="end">€389,900</span>
      </cngx-data-grid-footer>
    </cngx-data-grid-accordion>
  </div>`,
};
