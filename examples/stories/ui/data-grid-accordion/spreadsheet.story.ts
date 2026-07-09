import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Spreadsheet',
  subtitle:
    'The <code>[skin]="\'spreadsheet\'"</code> skin reads like a worksheet - visible cell hairlines, a row-number gutter, and a column-letter strip above the labels. Opening a row fills its gutter cell with the accent colour and turns the detail zone into a note cell.',
  description:
    'The column letters (A / B / C) and the gutter row numbers are both derived by the skin from CSS counters, so you author neither and write no gutter cell at all - the skin owns the first column of the <code>[columns]</code> template and paints it, while your cells fill the rest. Mark the item cell <code>primary</code> so a screen reader names the row by its item alone. On narrow screens the grid scrolls sideways with every column intact instead of dropping one.',
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
  template: `  <div style="max-width:640px">
    <cngx-data-grid-accordion
      [skin]="'spreadsheet'"
      columns="44px 1fr 11ch 12ch"
      [multi]="true"
      [headingLevel]="3"
    >
      <cngx-data-grid-header>
        <span cngxDgCell>Item</span>
        <span cngxDgCell align="end">Stock</span>
        <span cngxDgCell align="end">List price</span>
      </cngx-data-grid-header>

      <cngx-data-grid-row panelId="row-2">
        <span cngxDgCell primary>Aluminium profile 40x40, slot 8</span>
        <span cngxDgCell align="end">1,240</span>
        <span cngxDgCell align="end">$18.90</span>
        Framework contract with volume pricing from 500 units. Minimum stock 800,
        replenishment lead time 10 working days.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="row-3">
        <span cngxDgCell primary>Linear guide HGR-15, 600 mm</span>
        <span cngxDgCell align="end">86</span>
        <span cngxDgCell align="end">$64.50</span>
        Below minimum stock (100). Purchase order B-2044 for 120 units is in transit,
        delivery 18 Jul.
      </cngx-data-grid-row>

      <cngx-data-grid-row panelId="row-4">
        <span cngxDgCell primary>Stepper motor NEMA 23, 2.8 A</span>
        <span cngxDgCell align="end">312</span>
        <span cngxDgCell align="end">$42.00</span>
        Discontinued by the manufacturer; successor listed from Q4. Remaining stock is
        being sold down, no reorder planned.
      </cngx-data-grid-row>

      <cngx-data-grid-footer>
        <span cngxDgCell>Total stock value</span>
        <span cngxDgCell></span>
        <span cngxDgCell align="end">$42,087</span>
      </cngx-data-grid-footer>
    </cngx-data-grid-accordion>
  </div>`,
};
