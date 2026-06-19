import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxPaginator: Select panel footer',
  subtitle:
    'A long option set paged inside a select-style panel: the option list shows one page, and a compact <code>minimal</code> paginator sits in the panel footer. The same brain that paginates a table paginates a dropdown.',
  description:
    'Useful when an options endpoint returns hundreds of rows - page the panel instead of virtualising, keeping the footer controls in reach.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['integration', 'composition'],
  apiComponents: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorRange', 'CngxPaginatorNext'],
  moduleImports: [
    "import { CngxPaginator, CngxPaginatorPrev, CngxPaginatorRange, CngxPaginatorNext } from '@cngx/ui/paginator';",
  ],
  imports: ['CngxPaginator', 'CngxPaginatorPrev', 'CngxPaginatorRange', 'CngxPaginatorNext'],
  setup: `protected readonly options = signal<string[]>(
    Array.from({ length: 120 }, (_, i) => 'Option ' + (i + 1)),
  );
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(6);
  protected readonly selected = signal<string | undefined>(undefined);
  protected readonly pageOptions = computed<string[]>(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.options().slice(start, start + this.pageSize());
  });`,
  template: `  <div class="demo-listbox-surface">
    <ul class="demo-list-flush demo-panel-option-list" aria-label="Options">
      @for (opt of pageOptions(); track opt) {
        <li>
          <button
            type="button"
            class="demo-listbox-trigger demo-listbox-trigger--flush"
            [attr.aria-pressed]="selected() === opt"
            (click)="selected.set(opt)"
          >{{ opt }}</button>
        </li>
      }
    </ul>
    <cngx-paginator
      skin="minimal"
      class="demo-panel-footer-pgn"
      aria-label="Option pages"
      [total]="options().length"
      [(pageIndex)]="pageIndex"
      [(pageSize)]="pageSize"
    >
      <cngx-pgn-prev />
      <cngx-pgn-range />
      <cngx-pgn-next />
    </cngx-paginator>
  </div>`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row"><span class="event-label">Selected</span><span class="event-value">{{ selected() ?? '-' }}</span></div>
  </div>`,
};
