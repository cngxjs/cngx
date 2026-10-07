import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDataGridAccordion: Scroll edges, bounded',
  subtitle:
    'A bounded ledger whose pinned head casts a shadow only while rows are scrolled away above it, and whose footer casts one only while rows remain below. Scroll to either end and the matching shadow goes away.',
  description:
    'The group composes <code>CngxScrollEdges</code> on its host, so the scrollport reflects <code>data-scroll-block-start</code> / <code>-block-end</code> only while rows are really hidden in that direction. The head / foot shadows are keyed on those attributes and tuned through <code>--cngx-dga-head-shadow</code> / <code>--cngx-dga-foot-shadow</code>. Keyboard focus lands clear of both bands: the host pads its scrollport by the measured head and foot size plus <code>--cngx-dga-focus-clearance</code>. The shadows are only the default look: set the two shadow tokens to <code>none</code> or key your own line or tonal head on the same attributes. Flip the direction to check the same behaviour under RTL.',
  level: 'organism',
  audience: ['dev', 'design', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'rtl'],
  apiComponents: ['CngxDataGridAccordion', 'CngxScrollEdges'],
  imports: [
    'CngxDataGridAccordion',
    'CngxDataGridRow',
    'CngxDataGridHeader',
    'CngxDataGridFooter',
    'CngxDgCell',
  ],
  setup: `private readonly names = [
    'Northwind Traders', 'Contoso Ltd', 'Fabrikam Inc', 'Adventure Works',
    'Wingtip Toys', 'Tailspin Toys', 'Proseware Inc', 'Fourth Coffee',
  ];
  protected readonly rows = Array.from({ length: 40 }, (_, i) => ({
    id: 'INV-' + (1000 + i),
    customer: this.names[i % this.names.length],
    amount: 400 + ((i * 173) % 8000),
  }));
  protected readonly total = this.rows
    .reduce((sum, row) => sum + row.amount, 0)
    .toLocaleString();`,
  template: `  <div style="max-width:640px" [attr.dir]="dir()">
    <cngx-data-grid-accordion [skin]="'ledger'" [multi]="true" [maxBlockSize]="320">
      <cngx-dga-header>
        <span cngxDgaCell col="md">Invoice</span>
        <span cngxDgaCell col="grow">Customer</span>
        <span cngxDgaCell col="md" align="end">Amount</span>
      </cngx-dga-header>

      @for (row of rows; track row.id) {
        <cngx-dga-row [panelId]="row.id">
          <span cngxDgaCell>{{ row.id }}</span>
          <span cngxDgaCell primary>{{ row.customer }}</span>
          <span cngxDgaCell align="end">{{ '$' + row.amount.toLocaleString() }}</span>
          Terms and line items for {{ row.id }}.
        </cngx-dga-row>
      }

      <cngx-dga-footer>
        <span cngxDgaCell>40 invoices</span>
        <span cngxDgaCell></span>
        <span cngxDgaCell align="end">{{ '$' + total }}</span>
      </cngx-dga-footer>
    </cngx-data-grid-accordion>
  </div>`,
  setupChrome: `protected readonly dir = signal<'ltr' | 'rtl'>('ltr');`,
  templateChrome: `<div class="button-row" role="radiogroup" aria-label="Direction">
    <label>
      <input type="radio" name="dga-bounded-dir" value="ltr"
        [checked]="dir() === 'ltr'"
        (change)="dir.set('ltr')" />
      LTR
    </label>
    <label>
      <input type="radio" name="dga-bounded-dir" value="rtl"
        [checked]="dir() === 'rtl'"
        (change)="dir.set('rtl')" />
      RTL
    </label>
  </div>`,
};
