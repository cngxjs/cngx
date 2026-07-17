import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: End reached',
  subtitle:
    'Once every page is revealed the organism is exhausted (<code>isLast()</code>): the trigger region gives way to the end-reached label - the EN default is <code>All {total} loaded</code>. Here the whole set fits one page, so the list opens already at its tail.',
  description:
    'The end label is a derivation of the brain, not a managed flag: <code>exhausted</code> is <code>computed(() =&gt; host.isLast())</code>. A projected <code>*cngxIncrementalEnd</code> template replaces the default, and the phrasing is configurable via <code>withIncrementalListAriaLabels({ endReached })</code>. A projected trigger is hidden in this state, so no dead affordance remains.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['behavior', 'composition'],
  apiComponents: ['CngxIncrementalList', 'CngxPaginatorLoadMore'],
  moduleImports: [
    "import { CngxIncrementalList, CngxIncrementalItem, CngxPaginatorLoadMore } from '@cngx/ui/collection';",
    "import { createManualState } from '@cngx/common/data';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxIncrementalList', 'CngxIncrementalItem', 'CngxPaginatorLoadMore'],
  setup: `protected readonly people: Person[] = PEOPLE.slice(0, 3);
  protected readonly listState = createManualState<Person[]>();
  protected readonly pageSize = signal(5);
  constructor() {
    this.listState.setSuccess(this.people);
  }`,
  template: `  <cngx-incremental-list [state]="listState" [total]="people.length" [pageSize]="pageSize()">
    <ng-template cngxIncrementalItem let-p>
      <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
    </ng-template>
    <cngx-pgn-load-more cngxIncrementalTrigger />
  </cngx-incremental-list>`,
};
