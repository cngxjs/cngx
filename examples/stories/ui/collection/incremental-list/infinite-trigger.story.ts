import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: Infinite trigger',
  subtitle:
    'Same organism, different trigger. A projected <code>cngx-pgn-infinite</code> drops a sentinel that auto-advances the page as it enters the scroll container, so the accumulated slice grows on scroll. Binding <code>[state]</code> lets each simulated fetch flip busy, so the sentinel paces itself instead of racing through every page.',
  description:
    'The infinite segment composes <code>CngxInfiniteScroll</code> and injects the same <code>CNGX_PAGINATOR_HOST</code> the organism provides - it reads <code>isBusy()</code> / <code>isLast()</code> and calls <code>next()</code>. The organism keeps rendering content while busy (it is no longer a first load), so the list stays visible as the next batch loads. On the last page the trigger region gives way to the end-reached label.',
  level: 'organism',
  audience: ['dev'],
  artifact: 'standalone',
  focus: ['composition', 'behavior', 'async-state'],
  apiComponents: ['CngxIncrementalList', 'CngxPaginatorInfinite'],
  moduleImports: [
    "import { CngxIncrementalList, CngxIncrementalItem, CngxPaginatorInfinite } from '@cngx/ui/collection';",
    "import { createManualState } from '@cngx/common/data';",
    "import { PEOPLE, type Person } from '../../../../fixtures';",
  ],
  imports: ['CngxIncrementalList', 'CngxIncrementalItem', 'CngxPaginatorInfinite'],
  setup: `protected readonly people: Person[] = Array.from({ length: 6 }, (_, copy: number) =>
    PEOPLE.map((p: Person) => (copy === 0 ? p : { ...p, name: p.name + ' #' + (copy + 1) })),
  ).flat();
  protected readonly listState = createManualState<Person[]>();
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(6);
  constructor() {
    this.listState.setSuccess(this.people);
  }
  // Pace the auto-load: each advance flips the state to refreshing for a beat so
  // the sentinel's busy-gate waits instead of racing through every page at once.
  private readonly _pace = effect(() => {
    const idx = this.pageIndex();
    untracked(() => {
      if (idx === 0) {
        return;
      }
      this.listState.set('refreshing');
      setTimeout(() => this.listState.setSuccess(this.people), 400);
    });
  });`,
  template: `  <div class="demo-incremental-frame">
    <cngx-incremental-list
      [state]="listState"
      [total]="people.length"
      [(pageIndex)]="pageIndex"
      [pageSize]="pageSize()"
    >
      <ng-template cngxIncrementalItem let-p>
        <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
      </ng-template>
      <cngx-pgn-infinite cngxIncrementalTrigger root=".demo-incremental-frame" rootMargin="0px 0px 48px 0px" />
    </cngx-incremental-list>
  </div>`,
  css: `.demo-incremental-frame {
  max-height: 320px;
  overflow-y: auto;
  border: 1px solid var(--mat-sys-outline-variant, #ccc);
  border-radius: 8px;
}`,
};
