import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginate: Uncontrolled mode, zero class boilerplate',
  subtitle: 'In uncontrolled mode, <code>CngxPaginate</code> manages its own <code>pageIndex</code> and <code>pageSize</code> internally. No component signals needed; bind <code>[total]</code> and read <code>pg.paginate.range()</code> in the template. The <code>[cngxMatPaginator]</code> bridge composes the brain on an adopted <code>&lt;mat-paginator&gt;</code> and writes its internal state directly. Use controlled mode (<code>[cngxPageIndex]</code>, <code>(pageChange)</code>) when you need the page state in your component class.',
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
  setup: `protected readonly items: readonly Person[] = PEOPLE;`,
  template: `  <ul class="demo-list-flush">
    @for (p of items.slice(pg.paginate.range()[0], pg.paginate.range()[1]); track p.name) {
      <li class="demo-list-row">
        <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
      </li>
    }
  </ul>
  <mat-paginator
    cngxMatPaginator
    #pg="cngxMatPaginator"
    [total]="items.length"
    [cngxPageSize]="3"
    [pageSizeOptions]="[3, 5, 8]"
  ></mat-paginator>`,
  templateChrome: `<div class="status-row">
    <span class="status-badge">page {{ pg.paginate.pageIndex() + 1 }} of {{ pg.paginate.totalPages() }}</span>
    <span class="status-badge">no signals declared in the class</span>
  </div>`,
};
