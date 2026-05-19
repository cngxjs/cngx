import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Uncontrolled Mode — Zero Class Boilerplate',
  subtitle: 'In uncontrolled mode, <code>CngxPaginate</code> manages its own <code>pageIndex</code> and <code>pageSize</code> internally. No component signals needed — just bind <code>[total]</code> and read <code>pg.range()</code> in the template. <code>CngxMatPaginator</code> writes directly to the directive\'s internal state via <code>setPage()</code> / <code>setPageSize()</code>. Use controlled mode (<code>[cngxPageIndex]</code>, <code>(pageChange)</code>) when you need the page state in your component class.',
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
  setup: `protected readonly items = signal<Person[]>([
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' Jr.' })),
  ]);`,
  template: `
  <pre class="code-block"><code>// Uncontrolled — zero class boilerplate
&lt;div cngxPaginate #pg="cngxPaginate" [total]="items.length"&gt;
  &#64;for (item of items.slice(pg.range()[0], pg.range()[1]); track item.id) &#123;
    &lt;div&gt;&#123;<!-- -->&#123; item.name &#125;<!-- -->&#125;&lt;/div&gt;
  &#125;
  &lt;cngx-mat-paginator [cngxPaginateRef]="pg" /&gt;
&lt;/div&gt;

// Controlled — page state in component class
protected readonly pageIndex = signal(0);
protected readonly pageSize  = signal(10);

// In template:
// [cngxPageIndex]="pageIndex()"
// [cngxPageSize]="pageSize()"
// (pageChange)="pageIndex.set($event)"
// (pageSizeChange)="pageSize.set($event)"</code></pre>`,
};
