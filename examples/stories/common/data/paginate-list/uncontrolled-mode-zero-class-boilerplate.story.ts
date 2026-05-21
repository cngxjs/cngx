import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginate: Uncontrolled mode, zero class boilerplate',
  subtitle: 'In uncontrolled mode, <code>CngxPaginate</code> manages its own <code>pageIndex</code> and <code>pageSize</code> internally. No component signals needed; just bind <code>[total]</code> and read <code>pg.range()</code> in the template. <code>CngxMatPaginator</code> writes directly to the directive\'s internal state via <code>setPage()</code> / <code>setPageSize()</code>. Use controlled mode (<code>[cngxPageIndex]</code>, <code>(pageChange)</code>) when you need the page state in your component class.',
  level: 'atom',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior', 'integration'],
  apiComponents: [
    'CngxPaginate',
    'CngxMatPaginator',
  ],
  moduleImports: [
    'import { PEOPLE, type Person } from \'../../../../fixtures\';',
  ],
  imports: ['CngxPaginate', 'CngxMatPaginator'],
  setup: `protected readonly items: readonly Person[] = PEOPLE;`,
  template: `  <div cngxPaginate #pg="cngxPaginate" [total]="items.length" [cngxPageSize]="3" style="display:contents">
    <ul class="demo-list-flush">
      @for (p of items.slice(pg.range()[0], pg.range()[1]); track p.name) {
        <li class="demo-list-row">
          <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
        </li>
      }
    </ul>
    <cngx-mat-paginator [cngxPaginateRef]="pg" [pageSizeOptions]="[3, 5, 8]" />
  </div>`,
  templateChrome: `<div class="status-row">
    <span class="status-badge">page {{ pg.pageIndex() + 1 }} of {{ pg.totalPages() }}</span>
    <span class="status-badge">no signals declared in the class</span>
  </div>`,
};
