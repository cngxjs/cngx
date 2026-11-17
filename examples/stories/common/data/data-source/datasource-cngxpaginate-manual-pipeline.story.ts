import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginate + manual DataSource pipeline',
  subtitle: 'Pagination slots into a manual pipeline: a <code>computed()</code> slices the rows by the component\'s <code>pageIndex</code> / <code>pageSize</code> signals. <code>[cngxPaginate]</code> runs in controlled mode: <code>[cngxPageIndex]</code> / <code>[cngxPageSize]</code> feed it, and <code>(pageChange)</code> / <code>(pageSizeChange)</code> write the native controls\' requests back.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'async-state'],
  apiComponents: ['CngxPaginate'],
  moduleImports: [
    'import { CngxPaginate } from \'@cngx/common/data\';',
    'import { PEOPLE, type Person } from \'../../../../fixtures\';',
  ],
  imports: ['CngxPaginate'],
  setup: `protected readonly pageIndex = signal(0);
  protected readonly pageSize  = signal(3);
  protected readonly paginated = computed((): Person[] =>
    PEOPLE.slice(
      this.pageIndex() * this.pageSize(),
      (this.pageIndex() + 1) * this.pageSize(),
    ),
  );
  protected readonly totalPeople = PEOPLE.length;
  protected setPage(i: number): void {
    const max = Math.max(0, Math.ceil(PEOPLE.length / this.pageSize()) - 1);
    this.pageIndex.set(Math.max(0, Math.min(i, max)));
  }
  protected setPageSize(s: number): void {
    this.pageSize.set(s);
    this.pageIndex.set(0);
  }`,
  template: `  <div
    cngxPaginate
    #pg="cngxPaginate"
    [cngxPageIndex]="pageIndex()"
    [cngxPageSize]="pageSize()"
    [total]="totalPeople"
    (pageChange)="setPage($event)"
    (pageSizeChange)="setPageSize($event)">
    <div class="table-wrap">
      <table class="demo-table">
        <thead>
          <tr><th>Name</th><th>Role</th><th>Location</th></tr>
        </thead>
        <tbody>
          @for (row of paginated(); track row.name) {
            <tr><td>{{ row.name }}</td><td>{{ row.role }}</td><td>{{ row.location }}</td></tr>
          } @empty {
            <tr><td colspan="3" class="empty-cell">No results.</td></tr>
          }
        </tbody>
      </table>
    </div>

    <nav class="button-row" aria-label="Pagination" style="margin-top:12px">
      <label>
        Rows per page
        <select (change)="pg.setPageSize(+$any($event.target).value)">
          @for (size of [3, 5, 8]; track size) {
            <option [value]="size" [selected]="size === pg.pageSize()">{{ size }}</option>
          }
        </select>
      </label>
      <button type="button" class="chip" [disabled]="pg.isFirst()" (click)="pg.previous()">Previous</button>
      <button type="button" class="chip" [disabled]="pg.isLast()" (click)="pg.next()">Next</button>
    </nav>
  </div>`,
  templateChrome: `<div class="status-row">
    <span class="status-badge">page {{ pageIndex() + 1 }} of {{ pg.totalPages() }}</span>
  </div>`,
};
