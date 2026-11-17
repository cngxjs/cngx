import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginate: Paginated list',
  subtitle:
    '<code>CngxPaginate</code> works with any list, not just tables. The brain sits on a wrapper, the list slices <code>pg.range()</code> off the exported reference, and two native buttons call <code>pg.previous()</code> / <code>pg.next()</code> with <code>pg.isFirst()</code> / <code>pg.isLast()</code> as their disabled state.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: ['CngxPaginate'],
  moduleImports: [
    "import { CngxPaginate } from '@cngx/common/data';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxPaginate'],
  setup: `protected readonly items = signal<Person[]>([
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' Jr.' })),
  ]);`,
  template: `  <div cngxPaginate #pg="cngxPaginate" [total]="items().length" [cngxPageSize]="5">
    <ul class="demo-list-flush">
      @for (p of items().slice(pg.range()[0], pg.range()[1]); track p.name) {
        <li class="demo-list-row">
          <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
        </li>
      }
    </ul>
    <nav class="button-row" aria-label="Pagination" style="margin-top:12px">
      <button type="button" class="chip" [disabled]="pg.isFirst()" (click)="pg.previous()">Previous</button>
      <span>Page {{ pg.pageIndex() + 1 }} of {{ pg.totalPages() }}</span>
      <button type="button" class="chip" [disabled]="pg.isLast()" (click)="pg.next()">Next</button>
    </nav>
  </div>`,
  templateChrome: `<div class="status-row">
      <span class="status-badge">
        {{ pg.range()[0] + 1 }}-{{ pg.range()[1] > pg.total() ? pg.total() : pg.range()[1] }} of {{ pg.total() }} people
      </span>
    </div>`,
};
