import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginate: Paginated list with the CngxMatPaginator bridge',
  subtitle: '<code>CngxPaginate</code> works with any list, not just tables. The <code>[cngxMatPaginator]</code> bridge adopts a <code>&lt;mat-paginator&gt;</code> in place and composes the brain via <code>hostDirectives</code>; a sibling list slices <code>pg.paginate.range()</code> off the exported reference - no separate <code>CngxPaginate</code> placement.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: [
    'CngxPaginate',
    'CngxMatPaginator',
  ],
  moduleImports: [
    'import { MatPaginatorModule } from \'@angular/material/paginator\';',
    'import { PEOPLE, type Person } from \'../../../../fixtures\';',
  ],
  imports: ['CngxMatPaginator', 'MatPaginatorModule'],
  setup: `protected readonly items = signal<Person[]>([
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' Jr.' })),
  ]);`,
  template: `  <ul class="demo-list-flush">
    @for (p of items().slice(pg.paginate.range()[0], pg.paginate.range()[1]); track p.name) {
      <li class="demo-list-row">
        <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
      </li>
    }
  </ul>
  <mat-paginator
    cngxMatPaginator
    #pg="cngxMatPaginator"
    [total]="items().length"
    [cngxPageSize]="5"
    [pageSizeOptions]="[5, 10, 16]"
  ></mat-paginator>`,
  templateChrome: `<div class="status-row">
      <span class="status-badge">
        {{ pg.paginate.range()[0] + 1 }}-{{ pg.paginate.range()[1] > pg.paginate.total() ? pg.paginate.total() : pg.paginate.range()[1] }} of {{ pg.paginate.total() }} people
      </span>
    </div>`,
};
