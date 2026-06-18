import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Driving a list',
  subtitle:
    'The brain is content-agnostic: track <code>[(pageIndex)]</code> / <code>[(pageSize)]</code> and slice the array yourself. Here a plain <code>&lt;ul&gt;</code> shows the current page of people, with a numbered paginator footer.',
  description:
    'The paginator owns no data - it derives page math from <code>[total]</code> and reports the active page back through the two-way bindings, which the host uses to compute the slice.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['integration', 'composition'],
  apiComponents: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorRange',
  ],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext, CngxPaginatorRange } from '@cngx/ui/paginator';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: [
    'CngxPaginator',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
    'CngxPaginatorRange',
  ],
  setup: `protected readonly people = signal<Person[]>([
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' Jr.' })),
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' III' })),
  ]);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(5);
  protected readonly pageItems = computed<Person[]>(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.people().slice(start, start + this.pageSize());
  });`,
  template: `  <ul class="demo-list-flush">
    @for (p of pageItems(); track p.name) {
      <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
    }
  </ul>
  <cngx-paginator
    skin="numbered"
    aria-label="People pages"
    [total]="people().length"
    [(pageIndex)]="pageIndex"
    [(pageSize)]="pageSize"
  >
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
    <cngx-pgn-range />
  </cngx-paginator>`,
};
