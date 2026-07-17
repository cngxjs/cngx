import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: Load-more trigger',
  subtitle:
    'Append-style collection organism. Bind <code>[state]</code> and <code>[total]</code>; the organism reveals the accumulated slice (<code>cumulativeRange()</code>) and a projected <code>cngx-pgn-load-more</code> steps the next page in. The trigger injects the shared <code>CNGX_PAGINATOR_HOST</code> the organism provides - no new context type.',
  description:
    'The trigger holds no accumulation state and the organism owns no <code>[mode]</code> flag: the button is swappable projected content marked with <code>cngxIncrementalTrigger</code>. Once every page is revealed the trigger region is replaced by the end-reached label, so assistive tech never hears a "Load more" action on a dead control.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior'],
  apiComponents: ['CngxIncrementalList', 'CngxPaginatorLoadMore'],
  moduleImports: [
    "import { CngxIncrementalList, CngxIncrementalItem, CngxPaginatorLoadMore } from '@cngx/ui/collection';",
    "import { createManualState } from '@cngx/common/data';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxIncrementalList', 'CngxIncrementalItem', 'CngxPaginatorLoadMore'],
  setup: `protected readonly people: Person[] = [
    ...PEOPLE,
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' Jr.' })),
    ...PEOPLE.map((p: Person) => ({ ...p, name: p.name + ' III' })),
  ];
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
