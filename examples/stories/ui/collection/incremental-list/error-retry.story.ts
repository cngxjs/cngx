import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: Error + retry',
  subtitle:
    'The organism switches its view by async status from the single <code>[state]</code> source: skeleton on first load, content on success, empty on a settled empty result, and an error + retry affordance on failure. Activating retry emits the <code>(retry)</code> output so the consumer re-runs its data source.',
  description:
    'Drive the state with the buttons to walk each branch. The built-in error view carries a retry button; its click emits <code>(retry)</code>, which this demo wires to a reload. A projected <code>*cngxIncrementalError</code> template can replace the default and receives a <code>retry()</code> callback plus the raw <code>error</code> in its context.',
  level: 'organism',
  audience: ['dev', 'a11y'],
  artifact: 'standalone',
  focus: ['async-state', 'error-handling'],
  apiComponents: ['CngxIncrementalList'],
  moduleImports: [
    "import { CngxIncrementalList, CngxIncrementalItem } from '@cngx/ui/collection';",
    "import { createManualState } from '@cngx/common/data';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxIncrementalList', 'CngxIncrementalItem'],
  setup: `protected readonly people: Person[] = PEOPLE;
  protected readonly listState = createManualState<Person[]>();
  protected readonly pageSize = signal(5);
  protected reload(): void {
    this.listState.set('loading');
    setTimeout(() => this.listState.setSuccess(this.people), 400);
  }`,
  setupChrome: `protected showLoading(): void {
    this.listState.reset();
    this.listState.set('loading');
  }
  protected showSuccess(): void {
    this.listState.setSuccess(this.people);
  }
  protected showEmpty(): void {
    this.listState.reset();
    this.listState.setSuccess([]);
  }
  protected showError(): void {
    this.listState.reset();
    this.listState.set('loading');
    this.listState.setError(new Error('Network unreachable'));
  }`,
  template: `  <cngx-incremental-list
    [state]="listState"
    [total]="people.length"
    [pageSize]="pageSize()"
    (retry)="reload()"
  >
    <ng-template cngxIncrementalItem let-p>
      <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
    </ng-template>
  </cngx-incremental-list>`,
  templateChromeBefore: `<div class="button-row" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
    <button type="button" class="chip" (click)="showLoading()">loading</button>
    <button type="button" class="chip" (click)="showSuccess()">success</button>
    <button type="button" class="chip" (click)="showEmpty()">empty</button>
    <button type="button" class="chip" (click)="showError()">error</button>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ listState.status() }}</span>
  </div>`,
};
