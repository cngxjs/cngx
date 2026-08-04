import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Sticky head',
  subtitle:
    'Bind <code>[maxBlockSize]</code> to cap the grid: it becomes its own vertical scrollport, the column head pins to the top and the footer to the bottom, and only the rows scroll between them. No <code>[cngxStickyHeader]</code> - the group is the scrollport, so it pins natively.',
  description:
    'A number on <code>[maxBlockSize]</code> is taken as px (a string is any CSS length); it reflects onto <code>--cngx-dga-max-block-size</code>, the same token a skin may set directly. Because the host already scrolls in the inline axis, the used <code>overflow</code> makes it a scrollport in the block axis too, so <code>position: sticky</code> pins the head to the top and the footer to the bottom - the sum footer stays visible while the rows scroll. Opaque head + foot fills (the foundation surface token) keep scrolling rows from showing through the pinned bands. Leave <code>[maxBlockSize]</code> unbound and the grid stays content-height, byte-identical to the unbounded ledger. Every row is still a disclosure: click to expand its detail while head and foot stay put.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'building-block',
  focus: ['behavior'],
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
  setup: `private readonly names = [
    'Northwind Traders', 'Contoso Ltd', 'Fabrikam Inc', 'Adventure Works',
    'Wingtip Toys', 'Tailspin Toys', 'Proseware Inc', 'Fourth Coffee',
    'Litware Inc', 'Graphic Design Institute',
  ];
  private readonly tones = ['success', 'warning', 'error'] as const;
  private readonly labels = ['Paid', 'Partial', 'Overdue'] as const;

  // 40 rows so the body overflows the bounded height and the head has something to
  // stay pinned over. A plain list - the story is about the scrollport, not derivation.
  protected readonly rows = Array.from({ length: 40 }, (_, i) => {
    const bucket = i % 3;
    return {
      id: 'INV-' + (1000 + i),
      customer: this.names[i % this.names.length],
      amount: 400 + ((i * 173) % 8000),
      status: this.labels[bucket],
      tone: this.tones[bucket],
      detail:
        'Invoice ' + (1000 + i) + ' - ' + this.labels[bucket].toLowerCase() +
        '. Expand for terms and line items while the head stays pinned.',
    };
  });

  protected readonly total = this.rows
    .reduce((sum, row) => sum + row.amount, 0)
    .toLocaleString();`,
  template: `  <div style="max-width:640px">
    <cngx-data-grid-accordion
      [skin]="'ledger'"
      [multi]="true"
      [headingLevel]="3"
      [maxBlockSize]="320"
    >
      <cngx-dga-header>
        <span cngxDgaCell col="md">Invoice</span>
        <span cngxDgaCell col="grow">Customer</span>
        <span cngxDgaCell col="md" align="end">Amount</span>
        <span cngxDgaCell col="fit" align="end">Status</span>
      </cngx-dga-header>

      @for (row of rows; track row.id) {
        <cngx-dga-row [panelId]="row.id">
          <span cngxDgaCell>{{ row.id }}</span>
          <span cngxDgaCell primary>{{ row.customer }}</span>
          <span cngxDgaCell align="end">{{ '$' + row.amount.toLocaleString() }}</span>
          <span cngxDgaCell align="end">
            <cngx-tag [color]="row.tone" variant="subtle" size="sm">{{ row.status }}</cngx-tag>
          </span>
          {{ row.detail }}
        </cngx-dga-row>
      }

      <cngx-dga-footer>
        <span cngxDgaCell>40 invoices</span>
        <span cngxDgaCell></span>
        <span cngxDgaCell align="end">{{ '$' + total }}</span>
        <span cngxDgaCell align="end"></span>
      </cngx-dga-footer>
    </cngx-data-grid-accordion>
  </div>`,
};
