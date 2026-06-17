import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMatPaginator: in-place instrumentation of an existing mat-paginator',
  subtitle:
    'The <code>[cngxMatPaginator]</code> bridge upgrades a <code>&lt;mat-paginator&gt;</code> you already own - add one attribute, no DOM rewrite. It composes the signal-native <code>CngxPaginate</code> brain via <code>hostDirectives</code>, so a sibling list slices <code>ref.paginate.range()</code> off the exported reference without importing <code>CngxPaginate</code> itself.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'composition'],
  apiComponents: [
    'CngxMatPaginator',
    'CngxPaginate',
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
    @for (p of items().slice(ref.paginate.range()[0], ref.paginate.range()[1]); track p.name) {
      <li class="demo-list-row">
        <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
      </li>
    }
  </ul>
  <mat-paginator
    cngxMatPaginator
    #ref="cngxMatPaginator"
    [total]="items().length"
    [pageSizeOptions]="[5, 10, 25]"
  ></mat-paginator>`,
  templateChrome: `<div class="status-row">
      <span class="status-badge">
        {{ ref.paginate.range()[0] + 1 }}-{{ ref.paginate.range()[1] > ref.paginate.total() ? ref.paginate.total() : ref.paginate.range()[1] }} of {{ ref.paginate.total() }} people
      </span>
    </div>`,
};
