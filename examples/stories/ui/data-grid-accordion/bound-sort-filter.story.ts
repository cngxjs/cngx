import type { DemoSpec } from '../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Data-grid accordion: Bound sort + filter',
  subtitle:
    'The <strong>binding</strong> path, for a consumer that already owns its sort and filter state. No header directives: the grid takes controlled <code>[sortActive]</code> / <code>[sortDirection]</code> and a typed <code>[filterPredicate]</code>, and the consumer drives order and visibility from its own signals. The group still only publishes state; the same <code>computed()</code> derives the rows.',
  description:
    'This is the escape hatch to the declarative sortable-ledger demo. Instead of sortable header cells and a filter input, the consumer holds <code>sortField</code>, <code>sortDir</code>, and a <code>predicate</code> as signals and binds them straight into the group. Nothing in the grid needs to know how they are chosen - here a radio group and a checkbox flip them. The <code>rows()</code> computed filters by the predicate and sorts by the field, and <code>[cngxDgaCount]</code> announces the visible count. The open-set stays keyed by <code>panelId</code>, so an expanded row survives a sort or a filter that removes and re-adds it.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['integration', 'behavior'],
  apiComponents: ['CngxDataGridAccordion', 'CngxDgaCount'],
  imports: [
    'CngxDataGridAccordion',
    'CngxDataGridRow',
    'CngxDataGridHeader',
    'CngxDataGridFooter',
    'CngxDgCell',
    'CngxDgaCount',
    'CngxTag',
  ],
  references: [
    {
      label: 'WAI-ARIA APG: Accordion pattern',
      href: 'https://www.w3.org/WAI/ARIA/apg/patterns/accordion/',
    },
  ],
  setup: `protected readonly sortField = signal<'customer' | 'amount'>('amount');
  protected readonly sortDir = signal<'asc' | 'desc'>('desc');
  protected readonly onlyUnpaid = signal(false);

  // A typed predicate the group publishes on its hosted CngxFilter; null clears it.
  protected readonly predicate = computed(() =>
    this.onlyUnpaid() ? (row: { status: string }) => row.status !== 'Paid' : null,
  );

  private readonly source = [
    { id: 'INV-1042', customer: 'Northwind Traders', amount: 1280, status: 'Paid', tone: 'success', detail: 'Net 30 terms. Two line items, no disputes.' },
    { id: 'INV-1043', customer: 'Contoso Ltd', amount: 640, status: 'Partial', tone: 'warning', detail: 'Partial payment received; balance carried forward.' },
    { id: 'INV-1044', customer: 'Fabrikam Inc', amount: 3100, status: 'Overdue', tone: 'error', detail: 'Reminder sent; escalate if unpaid by end of week.' },
    { id: 'INV-1045', customer: 'Adventure Works', amount: 920, status: 'Paid', tone: 'success', detail: 'Paid on receipt; a preferred-terms customer.' },
  ];

  protected readonly rows = computed(() => {
    const predicate = this.predicate();
    const field = this.sortField();
    const direction = this.sortDir() === 'asc' ? 1 : -1;
    const filtered = predicate ? this.source.filter((row) => predicate(row)) : this.source;
    return [...filtered].sort((a, b) => (a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0) * direction);
  });

  protected readonly total = computed(() =>
    this.rows().reduce((sum, row) => sum + row.amount, 0).toLocaleString(),
  );`,
  setupChrome: `protected toggleUnpaid(event: Event): void {
    this.onlyUnpaid.set((event.target as HTMLInputElement).checked);
  }`,
  template: `  <div style="max-width:640px">
    <cngx-data-grid-accordion
      [skin]="'ledger'"
      [multi]="true"
      [headingLevel]="3"
      [sortActive]="sortField()"
      [sortDirection]="sortDir()"
      [filterPredicate]="predicate()"
    >
      <cngx-dga-header>
        <span cngxDgaCell col="md">Invoice</span>
        <span cngxDgaCell col="grow">Customer</span>
        <span cngxDgaCell col="md" align="end">Amount</span>
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
  templateChrome: `  <div class="button-row" style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap;margin-bottom:1rem">
    <fieldset style="border:0;padding:0;margin:0;display:flex;gap:0.75rem;align-items:center">
      <legend style="padding:0;font-weight:600">Sort by</legend>
      <label><input type="radio" name="dga-bound-field" [checked]="sortField() === 'customer'" (change)="sortField.set('customer')" /> Customer</label>
      <label><input type="radio" name="dga-bound-field" [checked]="sortField() === 'amount'" (change)="sortField.set('amount')" /> Amount</label>
    </fieldset>
    <fieldset style="border:0;padding:0;margin:0;display:flex;gap:0.75rem;align-items:center">
      <legend style="padding:0;font-weight:600">Direction</legend>
      <label><input type="radio" name="dga-bound-dir" [checked]="sortDir() === 'asc'" (change)="sortDir.set('asc')" /> Ascending</label>
      <label><input type="radio" name="dga-bound-dir" [checked]="sortDir() === 'desc'" (change)="sortDir.set('desc')" /> Descending</label>
    </fieldset>
    <label><input type="checkbox" [checked]="onlyUnpaid()" (change)="toggleUnpaid($event)" /> Only unpaid</label>
  </div>`,
};
