import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginate + manual DataSource pipeline',
  subtitle: 'Pagination slots naturally into the manual pipeline. Pass a <code>computed()</code> that includes the slice to <code>injectDataSource()</code>. The <code>[cngxMatPaginator]</code> bridge runs in controlled mode: it wires the component\'s <code>pageIndex</code> / <code>pageSize</code> signals to the composed brain, and <code>(pageChange)</code> / <code>(pageSizeChange)</code> keep them in sync.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'async-state'],
  apiComponents: [
    'CngxPaginate',
    'CngxMatPaginator',
  ],
  moduleImports: [
    'import { MatPaginatorModule } from \'@angular/material/paginator\';',
    'import { PEOPLE, type Person } from \'../../../../fixtures\';',
  ],
  imports: ['CngxMatPaginator', 'MatPaginatorModule'],
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
  template: `  <div class="table-wrap">
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

  <!-- CngxMatPaginator bridge in controlled mode -->
  <mat-paginator
    cngxMatPaginator
    #pg="cngxMatPaginator"
    [cngxPageIndex]="pageIndex()"
    [cngxPageSize]="pageSize()"
    [total]="totalPeople"
    [pageSizeOptions]="[3, 5, 8]"
    (pageChange)="setPage($event)"
    (pageSizeChange)="setPageSize($event)"
  ></mat-paginator>`,
  templateChrome: `<div class="status-row">
    <span class="status-badge">page {{ pageIndex() + 1 }} of {{ pg.paginate.totalPages() }}</span>
  </div>`,
};
