import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Paginated List — CngxPaginate + CngxMatPaginator',
  subtitle: '<code>CngxPaginate</code> works with any list, not just tables. Put <code>[cngxPaginate]</code> on any wrapper element, bind <code>[total]</code> to the full item count, and slice the array with <code>pg.range()</code> in the <code>@for</code> loop. <code>CngxMatPaginator</code> provides the Material paginator UI via <code>[cngxPaginateRef]</code>.',
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
  setup: `protected readonly items = signal<Person[]>([
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' Jr.' })),
  ]);`,
  template: `  <div cngxPaginate #pg="cngxPaginate" [total]="items().length" [cngxPageSize]="5" style="display:contents">
    <ul style="list-style:none;padding:0;margin:0">
      @for (p of items().slice(pg.range()[0], pg.range()[1]); track p.name) {
        <li style="padding:8px 0;border-bottom:1px solid var(--cngx-color-border,#e0e0e0)">
          <strong>{{ p.name }}</strong> &mdash; {{ p.role }}, {{ p.location }}
        </li>
      }
    </ul>
    <cngx-mat-paginator [cngxPaginateRef]="pg" [pageSizeOptions]="[5, 10, 16]" />
    
  </div>`,
  templateChrome: `<div class="status-row">
      <span class="status-badge">
        {{ pg.range()[0] + 1 }}–{{ pg.range()[1] > pg.total() ? pg.total() : pg.range()[1] }} of {{ pg.total() }} people
      </span>
    </div>`,
};
