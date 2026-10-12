import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: custom loading slot',
  subtitle:
    'Project <code>*cngxIncrementalLoading</code> to replace the built-in linear <code>cngx-progress</code> shown while the first page loads. Press "Reload from scratch" to re-enter the first load; untick "Use custom slot templates" to compare with the default bar.',
  description:
    'The slot has no template context and covers the first load only (the <code>skeleton</code> view, before any success); once rows are on screen later loads keep them visible. Resolution order is instance slot, then <code>CngxIncrementalListConfig.templates.loading</code>, then the built-in progress bar. The organism\'s polite live region announces "Loading" either way, so the placeholder rows here are <code>aria-hidden</code>.',
  level: 'organism',
  audience: ['dev', 'design'],
  artifact: 'standalone',
  focus: ['async-state', 'composition'],
  apiComponents: ['CngxIncrementalList', 'CngxIncrementalLoading', 'CngxIncrementalItem'],
  moduleImports: [
    "import { CngxIncrementalItem, CngxIncrementalList, CngxIncrementalLoading } from '@cngx/ui/collection';",
    "import { createManualState } from '@cngx/common/data';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxIncrementalList', 'CngxIncrementalItem', 'CngxIncrementalLoading'],
  setup: `protected readonly people: Person[] = PEOPLE;
  protected readonly listState = createManualState<Person[]>();
  protected readonly customSlots = signal(true);
  protected readonly placeholderRows = [0, 1, 2];

  constructor() {
    this.load();
  }

  protected load(): void {
    this.listState.reset();
    this.listState.set('loading');
    setTimeout(() => this.listState.setSuccess(this.people), 1500);
  }`,
  template: `  <cngx-incremental-list [state]="listState" [total]="people.length" [pageSize]="5">
    <ng-template cngxIncrementalItem let-p>
      <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
    </ng-template>
    @if (customSlots()) {
      <ng-template cngxIncrementalLoading>
        <div class="demo-list-placeholder" aria-hidden="true">
          @for (row of placeholderRows; track row) {
            <div class="demo-list-placeholder__row">
              <span class="demo-list-placeholder__avatar"></span>
              <span class="demo-list-placeholder__line"></span>
            </div>
          }
        </div>
      </ng-template>
    }
  </cngx-incremental-list>`,
  templateChromeBefore: `<div class="button-row" style="margin-bottom:16px">
    <button type="button" class="chip" (click)="load()">Reload from scratch</button>
    <label>
      <input
        type="checkbox"
        [checked]="customSlots()"
        (change)="customSlots.set($any($event.target).checked)"
      />
      Use custom slot templates
    </label>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px">
    <span class="cngx-ex-status-readout">status: {{ listState.status() }}</span>
  </div>`,
};
