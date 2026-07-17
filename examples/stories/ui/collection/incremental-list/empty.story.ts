import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: Empty',
  subtitle:
    'When the bound state settles with no data (<code>setSuccess([])</code>) the organism renders its empty branch - the built-in default is <code>cngx-empty-state</code>, whose title flows from the config cascade (<code>provideIncrementalListConfig</code> / EN default).',
  description:
    'The empty view is one of the five slot regions. A projected <code>*cngxIncrementalEmpty</code> template replaces the default outright; a shared override can be supplied app-wide via <code>withIncrementalListTemplates</code> or the label re-phrased via <code>withIncrementalListAriaLabels</code>.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state'],
  apiComponents: ['CngxIncrementalList'],
  moduleImports: [
    "import { CngxIncrementalList, CngxIncrementalItem } from '@cngx/ui/collection';",
    "import { createManualState } from '@cngx/common/data';",
    "import { type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxIncrementalList', 'CngxIncrementalItem'],
  setup: `protected readonly listState = createManualState<Person[]>();
  protected readonly pageSize = signal(5);
  constructor() {
    this.listState.setSuccess([]);
  }`,
  template: `  <cngx-incremental-list [state]="listState" [total]="0" [pageSize]="pageSize()">
    <ng-template cngxIncrementalItem let-p>
      <strong>{{ p.name }}</strong> - {{ p.role }}
    </ng-template>
  </cngx-incremental-list>`,
};
