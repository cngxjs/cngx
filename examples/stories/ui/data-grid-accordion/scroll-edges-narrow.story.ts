import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxDataGridAccordion: Scroll edges, narrow',
  subtitle:
    'A ledger in a 420px frame, narrower than its column floor, so it scrolls sideways. The inline edge that still hides columns fades out; scroll to that edge and the fade goes away. Under RTL the fade follows the mirrored start and end.',
  description:
    'The host reflects <code>data-scroll-inline-start</code> / <code>-inline-end</code> from the composed <code>CngxScrollEdges</code> atom and applies a mask fade only while one is set. The fade width is <code>--cngx-dga-edge-fade-size</code> and it never drops below <code>--cngx-dga-edge-fade-min</code> opacity, so edge content and overlay scrollbars stay visible. The border ring is left unmasked, the fade is dropped under forced colors and while the grid itself holds keyboard focus, and a focused cell scrolled in sideways lands clear of the fade.',
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
  setup: `protected readonly rows = [
    { id: 'INV-1001', customer: 'Northwind Traders', region: 'North', amount: '$1,240.00' },
    { id: 'INV-1002', customer: 'Contoso Ltd', region: 'West', amount: '$860.50' },
    { id: 'INV-1003', customer: 'Fabrikam Inc', region: 'South', amount: '$3,105.00' },
    { id: 'INV-1004', customer: 'Adventure Works', region: 'East', amount: '$412.75' },
  ];`,
  template: `  <div style="max-width:420px" [attr.dir]="dir()">
    <cngx-data-grid-accordion [skin]="'ledger'" [multi]="true">
      <cngx-dga-header>
        <span cngxDgaCell col="md">Invoice</span>
        <span cngxDgaCell col="grow">Customer</span>
        <span cngxDgaCell col="md">Region</span>
        <span cngxDgaCell col="md" align="end">Amount</span>
      </cngx-dga-header>

      @for (row of rows; track row.id) {
        <cngx-dga-row [panelId]="row.id">
          <span cngxDgaCell>{{ row.id }}</span>
          <span cngxDgaCell primary>{{ row.customer }}</span>
          <span cngxDgaCell>{{ row.region }}</span>
          <span cngxDgaCell align="end">{{ row.amount }}</span>
          Terms and line items for {{ row.id }}.
        </cngx-dga-row>
      }

      <cngx-dga-footer>
        <span cngxDgaCell>4 invoices</span>
        <span cngxDgaCell></span>
        <span cngxDgaCell></span>
        <span cngxDgaCell align="end">$5,618.25</span>
      </cngx-dga-footer>
    </cngx-data-grid-accordion>
  </div>`,
  setupChrome: `protected readonly dir = signal<'ltr' | 'rtl'>('ltr');`,
  templateChrome: `<div class="button-row" role="radiogroup" aria-label="Direction">
    <label>
      <input type="radio" name="dga-narrow-dir" value="ltr"
        [checked]="dir() === 'ltr'"
        (change)="dir.set('ltr')" />
      LTR
    </label>
    <label>
      <input type="radio" name="dga-narrow-dir" value="rtl"
        [checked]="dir() === 'rtl'"
        (change)="dir.set('rtl')" />
      RTL
    </label>
  </div>`,
};
