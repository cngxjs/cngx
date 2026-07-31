import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxSmartDataSource: options-passed sort',
  subtitle:
    'The grid hosts <code>CngxSort</code> below the consumer\'s injector, where <code>injectSmartDataSource()</code> cannot inject it. A <code>viewChild</code> thunk - <code>{ sort: () => grid()?.sort }</code> - hands the hosted atom to the source explicitly.',
  description:
    'Click a column head: the grid reorders through its own consumer-derived <code>computed()</code> (the prescribed shape), and the mirror list below reorders through the smart source, which reads the same hosted atom via the options thunk. The thunk resolves lazily, so the <code>viewChild</code> being <code>undefined</code> on the first pass is fine - the source picks the atom up as soon as the grid mounts.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['composition', 'integration'],
  apiComponents: ['CngxSmartDataSource', 'CngxDataGridAccordion', 'CngxDgaSortHeader'],
  moduleImports: [
    "import { toSignal } from '@angular/core/rxjs-interop';",
    "import { injectSmartDataSource } from '@cngx/common';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: [
    'CngxDataGridAccordion',
    'CngxDataGridHeader',
    'CngxDataGridRow',
    'CngxDgCell',
    'CngxDgaSortHeader',
  ],
  setup: `protected readonly grid = viewChild(CngxDataGridAccordion);
  protected readonly activeSort = signal<{ active: string; direction: 'asc' | 'desc' } | undefined>(
    undefined,
  );
  private readonly people = signal(PEOPLE.slice(0, 4));
  private readonly ds = injectSmartDataSource(this.people, { sort: () => this.grid()?.sort });
  protected readonly mirror = toSignal(this.ds.connect(), { initialValue: [] as Person[] });

  protected readonly rows = computed(() => {
    const sort = this.activeSort();
    const list = this.people();
    if (!sort) {
      return list;
    }
    const dir = sort.direction === 'asc' ? 1 : -1;
    const key = sort.active as keyof Person;
    return [...list].sort((a, b) => String(a[key]).localeCompare(String(b[key])) * dir);
  });`,
  template: `  <div style="max-width:640px;display:grid;gap:16px">
    <cngx-data-grid-accordion [headingLevel]="3" (sortChange)="activeSort.set($event)">
      <cngx-dga-header>
        <span cngxDgaCell col="grow" cngxDgaSortHeader="name">Name</span>
        <span cngxDgaCell col="md" cngxDgaSortHeader="role">Role</span>
        <span cngxDgaCell col="md">Location</span>
      </cngx-dga-header>
      @for (row of rows(); track row.name) {
        <cngx-dga-row [panelId]="row.name">
          <span cngxDgaCell primary>{{ row.name }}</span>
          <span cngxDgaCell>{{ row.role }}</span>
          <span cngxDgaCell>{{ row.location }}</span>
          {{ row.name }} works as {{ row.role }} in {{ row.location }}.
        </cngx-dga-row>
      }
    </cngx-data-grid-accordion>

    <section aria-label="Mirror list fed by the smart data source">
      <h4 style="margin:0 0 8px">Mirror list fed by <code>injectSmartDataSource</code></h4>
      <ol style="margin:0;padding-inline-start:1.5rem">
        @for (p of mirror(); track p.name) {
          <li>{{ p.name }} - {{ p.role }}</li>
        }
      </ol>
    </section>
  </div>`,
  templateChrome: `<div class="status-row">
    <span class="status-badge" [class.active]="!!activeSort()">
      sort {{ activeSort() ? activeSort()!.active + ' ' + activeSort()!.direction : 'off' }}
    </span>
    <span class="status-badge">{{ mirror().length }} rows mirrored</span>
  </div>`,
};
