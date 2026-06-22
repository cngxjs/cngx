import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxMatPaginator: Announce page changes',
  subtitle:
    'A plain <code>&lt;mat-paginator&gt;</code> only relabels its own range text, which a screen reader does not announce. With <code>announce</code> the bridge mounts a visually-hidden <code>aria-live</code> region and speaks the new page and range; <code>[announceLabel]</code> localises the wording.',
  description:
    'The badge below mirrors the exact string sent to the live region. A screen reader hears it on every page or size change without focus moving. The announcement is derived from the brain state, never set imperatively.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['a11y-pattern', 'behavior'],
  references: [
    {
      label: 'WCAG 2.2 SC 4.1.3 Status Messages',
      href: 'https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html',
    },
  ],
  apiComponents: ['CngxMatPaginator', 'CngxPaginate'],
  moduleImports: [
    "import { MatPaginatorModule } from '@angular/material/paginator';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxMatPaginator', 'MatPaginatorModule'],
  setup: `protected readonly items = signal<Person[]>([
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' Jr.' })),
  ]);
  protected readonly label = (c: {
    page: number;
    totalPages: number;
    start: number;
    end: number;
    total: number;
  }) => \`Page \${c.page} of \${c.totalPages}, items \${c.start} to \${c.end} of \${c.total}\`;`,
  template: `  <ul class="demo-list-flush">
    @for (p of items().slice(ref.paginate.range()[0], ref.paginate.range()[1]); track p.name) {
      <li class="demo-list-row"><strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}</li>
    }
  </ul>
  <mat-paginator
    cngxMatPaginator
    #ref="cngxMatPaginator"
    announce
    [announceLabel]="label"
    [total]="items().length"
    [pageSizeOptions]="[5, 10, 25]"
  ></mat-paginator>`,
  templateChrome: `<div class="status-row" style="margin-top:12px">
      <span class="status-badge">{{ label({
        page: ref.paginate.pageIndex() + 1,
        totalPages: ref.paginate.totalPages(),
        start: ref.paginate.total() === 0 ? 0 : ref.paginate.range()[0] + 1,
        end: ref.paginate.range()[1] > ref.paginate.total() ? ref.paginate.total() : ref.paginate.range()[1],
        total: ref.paginate.total()
      }) }}</span>
    </div>`,
};
