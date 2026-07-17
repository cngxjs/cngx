import type { DemoSpec } from '../../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: Divided skin',
  subtitle:
    '<code>skin="divided"</code> draws a hairline separator between rows - the token derives from the foundation <code>--cngx-color-border</code> (and <code>--mat-sys-outline-variant</code> under a Material theme). Paint only; the same content and ARIA as every skin.',
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
  template: `  <cngx-incremental-list skin="divided" [state]="listState" [total]="people.length" [pageSize]="5">
    <ng-template cngxIncrementalItem let-p>
      <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
    </ng-template>
  </cngx-incremental-list>`,
};
