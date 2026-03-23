import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'mat-table — Paginate (Custom nav)',
  apiComponents: ['CngxPaginate'],
  moduleImports: [
    "import { PEOPLE } from '../../../../fixtures';",
  ],
  setup: `
  protected readonly people = signal(PEOPLE);

  protected pageIndices(total: number): number[] {
    return Array.from({ length: total }, (_, i) => i);
  }
  `,
  sections: [
    {
      title: 'CngxPaginate — Headless with Custom Nav',
      subtitle:
        '<code>CngxPaginate</code> is purely headless — it has no template of its own. ' +
        'Consumers read <code>isFirst()</code>, <code>isLast()</code>, <code>pageIndex()</code>, and <code>totalPages()</code> to build any pagination UI they need. ' +
        'Here the directive lives on a <code>&lt;div&gt;</code> wrapper via template ref <code>#pg</code>. ' +
        'The <code>@for</code> loop slices the array using <code>pg.range()</code> directly in the template — no DataSource, no Material dependency.',
      imports: ['CngxPaginate'],
      template: `
  <div cngxPaginate #pg="cngxPaginate" [total]="people().length" [cngxPageSize]="3" style="display:contents">
    <div class="table-wrap">
      <table class="demo-table">
        <thead><tr><th>Name</th><th>Role</th><th>Location</th></tr></thead>
        <tbody>
          @for (p of people().slice(pg.range()[0], pg.range()[1]); track p.name) {
            <tr><td>{{ p.name }}</td><td>{{ p.role }}</td><td>{{ p.location }}</td></tr>
          }
        </tbody>
      </table>
    </div>

    <!-- Custom accessible pagination nav — no Material dependency -->
    <nav role="navigation" aria-label="Pagination" class="button-row">
      <button type="button" [disabled]="pg.isFirst()" (click)="pg.first()" aria-label="First page">&laquo;</button>
      <button type="button" [disabled]="pg.isFirst()" (click)="pg.previous()" aria-label="Previous page">&lsaquo;</button>

      @for (i of pageIndices(pg.totalPages()); track i) {
        <button type="button"
          (click)="pg.setPage(i)"
          [attr.aria-current]="pg.pageIndex() === i ? 'page' : null"
          [attr.aria-label]="'Page ' + (i + 1)"
          [class.chip--active]="pg.pageIndex() === i"
          class="chip">{{ i + 1 }}</button>
      }

      <button type="button" [disabled]="pg.isLast()" (click)="pg.next()" aria-label="Next page">&rsaquo;</button>
      <button type="button" [disabled]="pg.isLast()" (click)="pg.last()" aria-label="Last page">&raquo;</button>
    </nav>

    <!-- Live region — screen readers announce page changes -->
    <span aria-live="polite" aria-atomic="true" class="visually-hidden">
      Page {{ pg.pageIndex() + 1 }} of {{ pg.totalPages() }}
    </span>

    <div class="status-row">
      <span class="status-badge">page {{ pg.pageIndex() + 1 }} of {{ pg.totalPages() }}</span>
      <span class="status-badge">showing {{ pg.range()[0] + 1 }}–{{ pg.range()[1] > pg.total() ? pg.total() : pg.range()[1] }} of {{ pg.total() }}</span>
    </div>
  </div>`,
    },
    {
      title: 'ARIA Pattern Reference',
      subtitle:
        'Required ARIA attributes for accessible custom paginators. ' +
        '<code>CngxPaginate</code> exposes exactly the signals needed: <code>isFirst()</code>, <code>isLast()</code>, <code>pageIndex()</code>, <code>totalPages()</code>. ' +
        'The directive itself does <em>not</em> manage ARIA — that is the rendering layer\'s responsibility (headless principle).',
      template: `
  <pre class="code-block"><code>&lt;div cngxPaginate #pg="cngxPaginate" [total]="items.length"&gt;
  &lt;!-- list or table reads pg.range() --&gt;
  &#64;for (item of items.slice(pg.range()[0], pg.range()[1]); track item.id) &#123; ... &#125;

  &lt;nav role="navigation" aria-label="Pagination"&gt;
    &lt;button [disabled]="pg.isFirst()" (click)="pg.previous()" aria-label="Previous page"&gt;&lt;/button&gt;

    &#64;for (i of pageIndices(pg.totalPages()); track i) &#123;
      &lt;button
        (click)="pg.setPage(i)"
        [attr.aria-current]="pg.pageIndex() === i ? 'page' : null"
        [attr.aria-label]="'Page ' + (i + 1)"&gt;
        &#123;<!-- -->&#123; i + 1 &#125;<!-- -->&#125;
      &lt;/button&gt;
    &#125;

    &lt;button [disabled]="pg.isLast()" (click)="pg.next()" aria-label="Next page"&gt;&lt;/button&gt;
  &lt;/nav&gt;

  &lt;!-- Live region — screen readers announce page changes --&gt;
  &lt;span aria-live="polite" aria-atomic="true" class="visually-hidden"&gt;
    Page &#123;<!-- -->&#123; pg.pageIndex() + 1 &#125;<!-- -->&#125; of &#123;<!-- -->&#123; pg.totalPages() &#125;<!-- -->&#125;
  &lt;/span&gt;
&lt;/div&gt;</code></pre>`,
    },
  ],
};
