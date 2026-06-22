import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Reset on filter',
  subtitle:
    'Bind <code>[resetOn]</code> to the value the result set depends on. When the filter changes the paginator jumps back to the first page, so a narrowed list never strands the user on a now-empty page. Page through, then type to filter.',
  description:
    'The shell shares one <code>connectPaginateResetOn</code> implementation with the <code>[cngxMatPaginator]</code> bridge and the generic <code>[cngxPaginateResetOn]</code> directive. Mounting captures the key without resetting; an already-first paginator stays put.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['behavior'],
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
  setup: `protected readonly pageIndex = signal(0);
  protected readonly query = signal('');
  protected readonly people: Person[] = [
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' II' })),
  ];
  protected readonly filtered = computed<Person[]>(() => {
    const q = this.query().toLowerCase();
    return this.people.filter((p) => p.name.toLowerCase().includes(q));
  });`,
  setupChrome: '',
  template: `  <ul class="demo-list-flush">
    @for (p of filtered().slice(pageIndex() * 3, pageIndex() * 3 + 3); track p.name) {
      <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
    } @empty {
      <li class="demo-list-row">No matches.</li>
    }
  </ul>
  <cngx-paginator
    skin="numbered"
    [total]="filtered().length"
    [pageSize]="3"
    [(pageIndex)]="pageIndex"
    [resetOn]="query()"
  >
    <cngx-pgn-prev />
    <cngx-pgn-pages />
    <cngx-pgn-next />
    <cngx-pgn-range />
  </cngx-paginator>`,
  templateChromeBefore: `<div class="button-row" style="margin-bottom:12px">
    <label>Filter by name
      <input type="search" [value]="query()" (input)="query.set($any($event.target).value)" />
    </label>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Current page</span><span class="event-value">{{ pageIndex() + 1 }}</span></div>
    <div class="event-row"><span class="event-label">Matches</span><span class="event-value">{{ filtered().length }}</span></div>
  </div>`,
};
