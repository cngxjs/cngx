import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Load more',
  subtitle:
    'Append-style pagination over the same brain. <code>cngx-pgn-load-more</code> steps <code>pageIndex</code> forward; the host slices from the top through the current page, so each click reveals the next batch instead of replacing the page.',
  description:
    'The segment is a trigger plus a shown/total readout - it holds no accumulation state. The host derives the cumulative slice from <code>[(pageIndex)]</code> / <code>[(pageSize)]</code> (the brain also exposes <code>cumulativeRange()</code> for the same math). The button disables on the last page.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxPaginator', 'CngxPaginatorLoadMore'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorLoadMore } from '@cngx/ui/paginator';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorLoadMore'],
  setup: `protected readonly people = signal<Person[]>([
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' Jr.' })),
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' III' })),
  ]);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(5);
  // Append-style: slice from the top through the current page.
  protected readonly shownItems = computed<Person[]>(() =>
    this.people().slice(0, (this.pageIndex() + 1) * this.pageSize()),
  );`,
  template: `  <ul class="demo-list-flush">
    @for (p of shownItems(); track p.name) {
      <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
    }
  </ul>
  <cngx-paginator
    aria-label="People"
    [total]="people().length"
    [(pageIndex)]="pageIndex"
    [(pageSize)]="pageSize"
  >
    <cngx-pgn-load-more />
  </cngx-paginator>`,
};
