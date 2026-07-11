import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Sortable ledger',
  subtitle:
    'The <strong>declarative</strong> path. Each head is sortable with one <code>cngxDgaSortHeader="field"</code> attribute and no <code>[cngxSortRef]</code> wiring, a <code>&lt;cngx-dga-filter&gt;</code> shell (a labelled search box) two-way-binds the filter term, and a <code>[cngxDgaCount]</code> live region announces the visible count. The group only publishes state - the consumer derives the ordered, filtered rows in one <code>computed()</code> and owns the <code>@for</code>.',
  description:
    'Click a column head to sort (it toggles ascending then descending; the arrow and an <code>aria-describedby</code> description track it), and type in the search box to filter. The group hosts <code>CngxSort</code> and <code>CngxFilter</code>, so the header cells and the input reach them through the context with no plumbing; the group re-emits <code>(sortChange)</code> and the input two-way-binds <code>[(filterTerm)]</code>, which the consumer lifts into signals and derives <code>rows()</code> from. Because the open-set is keyed by <code>panelId</code>, an expanded row stays open as it moves under a sort or leaves and re-enters under a filter. The header is exposed to assistive tech (not <code>aria-hidden</code>) so the sort controls are reachable.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: [
    'CngxDataGridAccordion',
    'CngxDgaSortHeader',
    'CngxDgaFilterField',
    'CngxDgaCount',
  ],
  imports: [
    'CngxDataGridAccordion',
    'CngxDataGridRow',
    'CngxDataGridHeader',
    'CngxDataGridFooter',
    'CngxDgCell',
    'CngxDgaSortHeader',
    'CngxDgaFilterField',
    'CngxDgaCount',
    'CngxTag',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  setup: `protected readonly term = signal('');
  protected readonly activeSort = signal<{ active: string; direction: 'asc' | 'desc' } | undefined>(
    undefined,
  );

  private readonly source = [
    { id: 'INV-1042', customer: 'Northwind Traders', amount: 1280, status: 'Paid', tone: 'success', detail: 'Net 30 terms. Two line items, no disputes.' },
    { id: 'INV-1043', customer: 'Contoso Ltd', amount: 640, status: 'Partial', tone: 'warning', detail: 'Partial payment received; balance carried forward.' },
    { id: 'INV-1044', customer: 'Fabrikam Inc', amount: 3100, status: 'Overdue', tone: 'error', detail: 'Reminder sent; escalate if unpaid by end of week.' },
    { id: 'INV-1045', customer: 'Adventure Works', amount: 920, status: 'Paid', tone: 'success', detail: 'Paid on receipt; a preferred-terms customer.' },
  ];

  // One computed derives the visible, ordered rows from the published state (Ableitung).
  protected readonly rows = computed(() => {
    const term = this.term().trim().toLowerCase();
    const sort = this.activeSort();
    const filtered = this.source.filter(
      (row) =>
        !term ||
        row.customer.toLowerCase().includes(term) ||
        row.id.toLowerCase().includes(term),
    );
    if (!sort) {
      return filtered;
    }
    const direction = sort.direction === 'asc' ? 1 : -1;
    const key = sort.active;
    return [...filtered].sort((a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0) * direction);
  });

  protected readonly total = computed(() =>
    this.rows().reduce((sum, row) => sum + row.amount, 0).toLocaleString(),
  );`,
  template: `  <div style="max-width:640px">
    <cngx-data-grid-accordion
      [skin]="'ledger'"
      [multi]="true"
      [headingLevel]="3"
      [(filterTerm)]="term"
      (sortChange)="activeSort.set($event)"
    >
      <cngx-dga-filter
        label="Filter invoices"
        placeholder="Filter by customer or invoice number"
      />

      <cngx-dga-header>
        <span cngxDgaCell col="md" cngxDgaSortHeader="id">Invoice</span>
        <span cngxDgaCell col="grow" cngxDgaSortHeader="customer">Customer</span>
        <span cngxDgaCell col="md" align="end" cngxDgaSortHeader="amount">Amount</span>
        <span cngxDgaCell col="fit" align="end">Status</span>
      </cngx-dga-header>

      @for (row of rows(); track row.id) {
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
        <span cngxDgaCell><span [cngxDgaCount]="rows().length"></span></span>
        <span cngxDgaCell></span>
        <span cngxDgaCell align="end">{{ '$' + total() }}</span>
        <span cngxDgaCell align="end"></span>
      </cngx-dga-footer>
    </cngx-data-grid-accordion>
  </div>`,
};
