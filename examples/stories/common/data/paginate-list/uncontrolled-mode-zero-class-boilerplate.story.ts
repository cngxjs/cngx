import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginate: Uncontrolled mode, zero class boilerplate',
  subtitle:
    'In uncontrolled mode, <code>CngxPaginate</code> manages its own <code>pageIndex</code> internally. No component signals needed: bind <code>[total]</code>, read <code>pg.range()</code> in the template and let the native buttons call <code>pg.previous()</code> / <code>pg.next()</code>. Use controlled mode (<code>[cngxPageIndex]</code>, <code>(pageChange)</code>) when you need the page state in your component class.',
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
  setup: `protected readonly items: readonly Person[] = PEOPLE;`,
  template: `  <div cngxPaginate #pg="cngxPaginate" [total]="items.length" [cngxPageSize]="3">
    <ul class="demo-list-flush">
      @for (p of items.slice(pg.range()[0], pg.range()[1]); track p.name) {
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
    <span class="status-badge">no signals declared in the class</span>
  </div>`,
};
