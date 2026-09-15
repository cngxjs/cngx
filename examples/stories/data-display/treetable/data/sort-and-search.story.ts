import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxTreetable: Sort and search',
  subtitle:
    'Search-driven tree filtering: <code>filterTree</code> keeps a parent when any descendant matches, <code>nodeMatchesSearch</code> is the full-text predicate over primitive fields, and a programmatic <code>sortTree</code> pass composes in the same <code>computed()</code>. All consumer-side pure functions - nothing in the table filters or sorts for you.',
  description:
    'Because <code>filterTree</code> rebuilds the tree, positional default ids would remap between filtered and unfiltered renders. The <code>[nodeId]</code> input derives stable ids from the employee name so expansion and selection survive the transformation. For header-click sorting through <code>CngxSort</code> / <code>CngxSortHeader</code> see the header-click-sort and multi-column-sort demos.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['integration', 'behavior'],
  apiComponents: ['CngxTreetable', 'sortTree', 'filterTree', 'nodeMatchesSearch'],
  moduleImports: [
    "import { CngxTreetable, filterTree, nodeMatchesSearch, sortTree } from '@cngx/data-display/treetable';",
    "import { ORG_TREE, type Employee } from '../../../../fixtures';",
  ],
  imports: ['CngxTreetable'],
  setup: `protected readonly search = signal('');
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');
  protected readonly employeeId = (employee: Employee): string => employee.name;

  protected readonly viewTree = computed(() => {
    const term = this.search().trim();
    const matched = term
      ? filterTree([ORG_TREE], (employee) => nodeMatchesSearch(employee, term))
      : [ORG_TREE];
    return sortTree(matched, 'name', this.sortDirection());
  });

  protected handleToggleSort(): void {
    this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  }`,
  template: `  <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
    <label for="tt-search">Search</label>
    <input
      id="tt-search"
      type="search"
      [value]="search()"
      (input)="search.set($any($event.target).value)"
    />
    <button type="button" class="chip" (click)="handleToggleSort()">
      Sort by name: {{ sortDirection() }}
    </button>
  </div>

  <cngx-treetable #tt [tree]="viewTree()" [nodeId]="employeeId" />`,
  templateChrome: `<div class="event-grid" style="margin-top:12px">
    <div class="event-row">
      <span class="event-label">Nodes after filter</span>
      <span class="event-value">{{ tt.flatNodes().length }}</span>
    </div>
    <div class="event-row">
      <span class="event-label">Rows rendered</span>
      <span class="event-value">{{ tt.visibleNodes().length }}</span>
    </div>
  </div>`,
};
