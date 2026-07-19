import type { DemoSpec } from '../../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: Card skin',
  subtitle:
    '<code>skin="card"</code> sits the list on an elevated, rounded surface with row dividers - surface, border, and radius all derive from the foundation tokens (and <code>--mat-sys-*</code> under a Material theme). Structure and ARIA are unchanged.',
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
  template: `  <cngx-incremental-list skin="card" [state]="listState" [total]="people.length" [pageSize]="5">
    <ng-template cngxIncrementalItem let-p>
      <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
    </ng-template>
  </cngx-incremental-list>`,
};
