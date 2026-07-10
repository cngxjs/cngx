import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Master-detail',
  subtitle:
    'The <code>[skin]="\'master-detail\'"</code> skin reads an order summary per row and expands into its line-item detail. The open row stays primary-tinted as the context for the sub-table below it.',
  description:
    'The detail zone is a projected <code>&lt;table&gt;</code> - consumer content the skin only paints, inset past the accent edge so the positions read as a continuation of the row. Column widths come from <code>col</code> on the header cells (<code>grow</code> for the customer, <code>md</code> for order + total, <code>fit</code> for the position count); the group derives one shared template, so the summary numbers align with zero measurement. The customer cell is marked <code>primary</code> so a screen reader names each row by the customer alone. On narrow screens the grid scrolls sideways with every column intact instead of dropping one.',
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
  template: `  <div style="max-width:720px">
    <cngx-data-grid-accordion
      [skin]="'master-detail'"
      [multi]="true"
      [headingLevel]="3"
    >
      <cngx-dga-header>
        <span cngxDgaCell col="md">Order</span>
        <span cngxDgaCell col="grow">Customer</span>
        <span cngxDgaCell col="fit" align="end">Pos.</span>
        <span cngxDgaCell col="md" align="end">Total</span>
      </cngx-dga-header>

      <cngx-dga-row panelId="AU-7731">
        <span cngxDgaCell>AU-7731</span>
        <span cngxDgaCell primary>Bergmann Machine Works</span>
        <span cngxDgaCell align="end">3</span>
        <span cngxDgaCell align="end">$9,870.00</span>
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Item</th>
              <th class="r">Qty</th>
              <th class="r">Unit price</th>
              <th class="r">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>10</td><td>Servo drive 750 W</td><td class="r">4</td><td class="r">$1,480.00</td><td class="r">$5,920.00</td></tr>
            <tr><td>20</td><td>SPS-Compact controller</td><td class="r">1</td><td class="r">$2,650.00</td><td class="r">$2,650.00</td></tr>
            <tr><td>30</td><td>On-site commissioning</td><td class="r">8 h</td><td class="r">$162.50</td><td class="r">$1,300.00</td></tr>
          </tbody>
          <tfoot>
            <tr><td colspan="4">Net total</td><td class="r">$9,870.00</td></tr>
          </tfoot>
        </table>
      </cngx-dga-row>

      <cngx-dga-row panelId="AU-7728">
        <span cngxDgaCell>AU-7728</span>
        <span cngxDgaCell primary>Weidner &amp; Sons</span>
        <span cngxDgaCell align="end">2</span>
        <span cngxDgaCell align="end">$3,140.00</span>
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Item</th>
              <th class="r">Qty</th>
              <th class="r">Unit price</th>
              <th class="r">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>10</td><td>Conveyor belt 3 m segment</td><td class="r">2</td><td class="r">$1,240.00</td><td class="r">$2,480.00</td></tr>
            <tr><td>20</td><td>Spare-roller set</td><td class="r">4</td><td class="r">$165.00</td><td class="r">$660.00</td></tr>
          </tbody>
          <tfoot>
            <tr><td colspan="4">Net total</td><td class="r">$3,140.00</td></tr>
          </tfoot>
        </table>
      </cngx-dga-row>

      <cngx-dga-row panelId="AU-7719">
        <span cngxDgaCell>AU-7719</span>
        <span cngxDgaCell primary>Bremen Harbor Works</span>
        <span cngxDgaCell align="end">1</span>
        <span cngxDgaCell align="end">$18,500.00</span>
        <table>
          <thead>
            <tr>
              <th>Pos</th>
              <th>Item</th>
              <th class="r">Qty</th>
              <th class="r">Unit price</th>
              <th class="r">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>10</td><td>Gantry-crane maintenance, annual</td><td class="r">1</td><td class="r">$18,500.00</td><td class="r">$18,500.00</td></tr>
          </tbody>
          <tfoot>
            <tr><td colspan="4">Net total</td><td class="r">$18,500.00</td></tr>
          </tfoot>
        </table>
      </cngx-dga-row>

      <cngx-dga-footer>
        <span cngxDgaCell></span>
        <span cngxDgaCell>3 orders</span>
        <span cngxDgaCell align="end">6</span>
        <span cngxDgaCell align="end">$31,510.00</span>
      </cngx-dga-footer>
    </cngx-data-grid-accordion>
  </div>`,
};
