import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginateRouting: URL synced paging',
  subtitle:
    'Add <code>cngxPaginateRouting</code> to persist page and size in the query string. Reload, back, and forward all restore the view, and the page is deep-linkable. Watch the address bar as you page or change the size.',
  description:
    'The directive lives in <code>@cngx/common/data</code> and needs only the brain and <code>@angular/router</code>, so it works on a bare <code>cngxPaginate</code> host, the <code>&lt;cngx-paginator&gt;</code> shell, and the <code>[cngxMatPaginator]</code> bridge alike. The page is written 1-based; the brain stays 0-based.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: [
    'CngxPaginateRouting',
    'CngxPaginator',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
    'CngxPaginatorPrev',
    'CngxPaginatorNext',
  ],
  moduleImports: [
    "import { CngxPaginateRouting } from '@cngx/common/data';",
    "import { CngxPaginator, CngxPaginatorPageSize, CngxPaginatorRange, CngxPaginatorPrev, CngxPaginatorPages, CngxPaginatorNext } from '@cngx/ui/paginator';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: [
    'CngxPaginateRouting',
    'CngxPaginator',
    'CngxPaginatorPageSize',
    'CngxPaginatorRange',
    'CngxPaginatorPrev',
    'CngxPaginatorPages',
    'CngxPaginatorNext',
  ],
  setup: `protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(5);
  protected readonly sizes = [5, 8, 16] as const;
  protected readonly people: Person[] = [
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' II' })),
  ];`,
  template: `  <ul class="demo-list-flush">
    @for (p of people.slice(pageIndex() * pageSize(), pageIndex() * pageSize() + pageSize()); track p.name) {
      <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
    }
  </ul>
  <cngx-paginator
    cngxPaginateRouting
    skin="bar"
    [total]="people.length"
    [(pageIndex)]="pageIndex"
    [(pageSize)]="pageSize"
  >
    <cngx-pgn-page-size [options]="sizes" />
    <cngx-pgn-range />
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
  </cngx-paginator>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">URL reflects</span><span class="event-value">?page={{ pageIndex() + 1 }}&amp;pageSize={{ pageSize() }}</span></div>
  </div>`,
};
