import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Trend column',
  subtitle:
    'A <code>&lt;cngx-mini-area&gt;</code> lives inside a summary cell - the pairing the two organisms advertise. The chart emits an inline data table for assistive tech, which is flow content a <code>&lt;button&gt;</code> could never hold, so the cells are laid over the trigger rather than inside it. Clicking the chart (passive content) still toggles the row.',
  description:
    'Each row carries a per-order sparkline in its Trend cell. Because the summary cells are painted over the disclosure trigger rather than nested in it, a cell may hold any flow content - a chart, a table, a nested list - without the illegal control-inside-a-control markup that would force <code>accessibleTable="off"</code> and delete the chart\'s accessible alternative. The cells are <code>pointer-events: none</code>, so a click anywhere on a passive cell (including the chart) falls through to the trigger and toggles the row; only genuinely interactive cell content receives its own clicks. The customer cell is marked <code>primary</code> so a screen reader names each row by the customer alone.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: ['CngxDataGridAccordion', 'CngxDataGridRow', 'CngxDgCell', 'CngxMiniArea'],
  imports: [
    'CngxDataGridAccordion',
    'CngxDataGridRow',
    'CngxDataGridHeader',
    'CngxDataGridFooter',
    'CngxDgCell',
    'CngxMiniArea',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  setup: `protected readonly rows = [
    {
      id: 'AU-7731',
      customer: 'Bergmann Machine Works',
      total: '$9,870.00',
      trend: [12, 15, 14, 18, 22, 20, 26, 24, 30],
      detail: 'Servo drives and controllers - order volume trending up on repeat business.',
    },
    {
      id: 'AU-7728',
      customer: 'Weidner & Sons',
      total: '$3,140.00',
      trend: [30, 26, 27, 22, 20, 21, 17, 15, 14],
      detail: 'Conveyor spares - a steady decline as the line is retired.',
    },
    {
      id: 'AU-7719',
      customer: 'Bremen Harbor Works',
      total: '$18,500.00',
      trend: [8, 9, 11, 10, 13, 12, 16, 19, 24],
      detail: 'Annual gantry-crane maintenance - a single large yearly order.',
    },
  ];`,
  template: `  <div style="max-width:720px">
    <cngx-data-grid-accordion
      [skin]="'master-detail'"
      [multi]="true"
      [headingLevel]="3"
    >
      <cngx-dga-header>
        <span cngxDgaCell col="md">Order</span>
        <span cngxDgaCell col="grow">Customer</span>
        <span cngxDgaCell col="md">Trend</span>
        <span cngxDgaCell col="md" align="end">Total</span>
      </cngx-dga-header>

      @for (row of rows; track row.id) {
        <cngx-dga-row [panelId]="row.id">
          <span cngxDgaCell>{{ row.id }}</span>
          <span cngxDgaCell primary>{{ row.customer }}</span>
          <span cngxDgaCell>
            <cngx-mini-area [data]="row.trend" [aria-label]="'Order-volume trend for ' + row.customer" />
          </span>
          <span cngxDgaCell align="end">{{ row.total }}</span>
          {{ row.detail }}
        </cngx-dga-row>
      }

      <cngx-dga-footer>
        <span cngxDgaCell></span>
        <span cngxDgaCell>3 orders</span>
        <span cngxDgaCell></span>
        <span cngxDgaCell align="end">$31,510.00</span>
      </cngx-dga-footer>
    </cngx-data-grid-accordion>
  </div>`,
};
