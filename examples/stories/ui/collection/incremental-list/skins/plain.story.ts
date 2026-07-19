import type { DemoSpec } from '../../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: Plain skin',
  subtitle:
    'The default <code>skin="plain"</code> - a browser-native list with no chrome. Skins are paint-only and reflect onto <code>[data-skin]</code>; structure, ARIA, and behaviour are identical across every value.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['visual-variants'],
  apiComponents: ['CngxIncrementalList'],
  moduleImports: [
    "import { CngxIncrementalList, CngxIncrementalItem } from '@cngx/ui/collection';",
    "import { createManualState } from '@cngx/common/data';",
    "import { PEOPLE, type Person } from '../../../../../fixtures';",
  ],
  imports: ['CngxIncrementalList', 'CngxIncrementalItem'],
  setup: `protected readonly people: Person[] = PEOPLE.slice(0, 5);
  protected readonly listState = createManualState<Person[]>();
  constructor() {
    this.listState.setSuccess(this.people);
  }`,
  template: `  <cngx-incremental-list skin="plain" [state]="listState" [total]="people.length" [pageSize]="5">
    <ng-template cngxIncrementalItem let-p>
      <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
    </ng-template>
  </cngx-incremental-list>`,
};
