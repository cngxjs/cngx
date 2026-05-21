import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRecycler: Basic list with fixed item heights',
  subtitle: '<code>injectRecycler()</code> returns computed signals for the visible range. The consumer renders with <code>@for</code> and two padding spacers. 5000 items, only ~20 in the DOM at any time.',
  description: 'Fixed 48px row height with 5000 items. Only ~20 rows live in the DOM at any time; offsetBefore and offsetAfter spacers reserve the remaining scroll height. CngxRecyclerAnnouncer covers the WAI-ARIA Feed pattern for screen readers.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern', 'async-state'],
  references: [
    { label: 'WAI-ARIA APG: Feed pattern', href: 'https://www.w3.org/WAI/ARIA/apg/patterns/feed/' },
  ],
  apiComponents: [
    'CngxRecycler',
    'CngxVirtualItem',
    'CngxRecyclerAnnouncer',
  ],
  moduleImports: [
    'import { injectRecycler, CngxVirtualItem, CngxRecyclerAnnouncer } from \'@cngx/common/data\';',
  ],
  imports: ['CngxVirtualItem', 'CngxRecyclerAnnouncer'],
  setup: `protected readonly allItems = signal(
    Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      name: 'Item ' + (i + 1),
      description: 'Description for item ' + (i + 1),
    })),
  );
  protected readonly recycler = injectRecycler({
    scrollElement: '.recycler-scroll',
    totalCount: () => this.allItems().length,
    estimateSize: 48,
    overscan: 10,
  });
  protected readonly visibleItems = this.recycler.sliced(this.allItems);`,
  setupChrome: `  protected readonly targetIndex = signal(0);
  protected handleScrollTo(): void {
    this.recycler.scrollToIndex(this.targetIndex());
  }`,
  template: `  <cngx-recycler-announcer [cngxRecyclerAnnouncer]="recycler" />
  <div class="recycler-scroll demo-scroll-frame" role="list" aria-label="Demo items"
       style="height:400px">
    <div [style.paddingTop.px]="recycler.offsetBefore()"
         [style.paddingBottom.px]="recycler.offsetAfter()">
      @for (item of visibleItems(); track item.id; let i = $index) {
        <div role="listitem"
             class="demo-scroll-row"
             [cngxVirtualItem]="recycler"
             [cngxVirtualItemIndex]="recycler.start() + i"
             style="height:48px">
          <strong>{{ item.name }}</strong>&nbsp;-&nbsp;{{ item.description }}
        </div>
      }
    </div>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px;gap:16px">
    <span class="status-badge">
      Showing {{ recycler.firstVisible() + 1 }}-{{ recycler.lastVisible() + 1 }}
      of {{ recycler.ariaSetSize() }}
    </span>
    <span class="status-badge">
      DOM nodes: {{ recycler.end() - recycler.start() }}
    </span>
    <label style="display:flex;align-items:center;gap:4px">
      Go to:
      <input type="number" class="demo-numeric-input"
             [value]="targetIndex()" (input)="targetIndex.set(+$any($event.target).value)"
             min="0" [max]="recycler.ariaSetSize() - 1">
    </label>
    <button type="button" class="demo-icon-button" (click)="handleScrollTo()">
      Scroll
    </button>
    @if (recycler.pendingTarget() != null) {
      <span aria-live="polite" class="demo-card-label">
        Waiting for item {{ recycler.pendingTarget()! + 1 }}...
      </span>
    }
  </div>`,
};
