import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Driving a card grid',
  subtitle:
    'The same wiring drives a responsive card grid: slice the page in a <code>computed()</code>, render the cards, and let the paginator report the page. The <code>pill</code> skin suits a content gallery.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['integration', 'composition', 'visual-variants'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorPages', 'CngxPaginatorNext'],
  setup: `protected readonly cards = signal<number[]>(Array.from({ length: 48 }, (_, i) => i + 1));
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(6);
  protected readonly pageCards = computed<number[]>(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.cards().slice(start, start + this.pageSize());
  });`,
  template: `  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
    @for (n of pageCards(); track n) {
      <div class="demo-card-cell">Item {{ n }}</div>
    }
  </div>
  <cngx-paginator
    skin="pill"
    aria-label="Gallery pages"
    [total]="cards().length"
    [(pageIndex)]="pageIndex"
    [(pageSize)]="pageSize"
    style="margin-top:16px;display:flex;justify-content:center"
  >
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
  </cngx-paginator>`,
};
