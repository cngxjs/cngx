import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxIncrementalList: Infinite trigger',
  subtitle:
    'Same organism, different trigger. A projected <code>cngx-pgn-infinite</code> drops a sentinel at the bottom of the scroll frame; scrolling to it auto-advances the page, and the accumulated slice grows one batch at a time. Binding <code>[state]</code> flips busy during each simulated fetch, so the spinner shows before the next rows arrive.',
  description:
    'The infinite segment composes <code>CngxInfiniteScroll</code> and injects the same <code>CNGX_PAGINATOR_HOST</code> the organism provides - it reads <code>isBusy()</code> / <code>isLast()</code> and calls <code>next()</code>. The demo reveals each page only when its fetch settles (like a real data source), so the list grows on scroll rather than all at once; the organism keeps the loaded rows visible while the next batch loads. On the last page the trigger region gives way to the end-reached label.',
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
  setup: `protected readonly allPeople: Person[] = Array.from({ length: 6 }, (_, copy: number) =>
    PEOPLE.map((p: Person) => (copy === 0 ? p : { ...p, name: p.name + ' #' + (copy + 1) })),
  ).flat();
  protected readonly pageSize = signal(10);
  protected readonly pageIndex = signal(0);
  // Rows revealed so far. The first page overflows the frame, so the sentinel
  // starts below the fold and only fires once the user scrolls to it.
  protected readonly loaded = signal(10);
  protected readonly listState = createManualState<Person[]>();
  constructor() {
    this.listState.setSuccess(this.allPeople.slice(0, this.loaded()));
  }
  // Reveal-on-settle: the sentinel advances the page, the simulated fetch flips
  // busy for a beat, and only on settle does the revealed slice grow - so the
  // spinner shows first and the next batch appears after, like a real source.
  private readonly _pace = effect(() => {
    const wanted = Math.min((this.pageIndex() + 1) * this.pageSize(), this.allPeople.length);
    untracked(() => {
      if (wanted <= this.loaded()) {
        return;
      }
      this.listState.set('refreshing');
      setTimeout(() => {
        this.loaded.set(wanted);
        this.listState.setSuccess(this.allPeople.slice(0, wanted));
      }, 500);
    });
  });`,
  template: `  <div class="demo-incremental-frame">
    <cngx-incremental-list
      [state]="listState"
      [total]="allPeople.length"
      [(pageIndex)]="pageIndex"
      [pageSize]="pageSize()"
    >
      <ng-template cngxIncrementalItem let-p>
        <strong>{{ p.name }}</strong> - {{ p.role }}, {{ p.location }}
      </ng-template>
      <cngx-pgn-infinite cngxIncrementalTrigger root=".demo-incremental-frame" rootMargin="0px" />
    </cngx-incremental-list>
  </div>`,
};
