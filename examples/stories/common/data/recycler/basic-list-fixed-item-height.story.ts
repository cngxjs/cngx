import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Basic List — Fixed Item Height',
  subtitle: '<code>injectRecycler()</code> returns computed signals for the visible range. The consumer renders with <code>@for</code> and two padding spacers. 5000 items, only ~20 in the DOM at any time.',
  description: 'Signal-based virtualizer for long lists. Items outside the viewport are removed from the DOM. Consumer renders with @for and two spacer containers.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern', 'async-state'],
  apiComponents: [
    'CngxRecycler',
    'CngxMeasure',
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
  <div class="recycler-scroll" role="list" aria-label="Demo items"
       style="height:400px;overflow-y:auto;border:1px solid var(--cngx-color-border,#e0e0e0);border-radius:8px">
    <div [style.paddingTop.px]="recycler.offsetBefore()"
         [style.paddingBottom.px]="recycler.offsetAfter()">
      @for (item of visibleItems(); track item.id; let i = $index) {
        <div role="listitem"
             [cngxVirtualItem]="recycler"
             [cngxVirtualItemIndex]="recycler.start() + i"
             style="height:48px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--cngx-color-border,#e0e0e0)">
          <strong>{{ item.name }}</strong>&nbsp;&mdash;&nbsp;{{ item.description }}
        </div>
      }
    </div>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px;display:flex;gap:16px;flex-wrap:wrap;align-items:center">
    <span class="status-badge">
      Showing {{ recycler.firstVisible() + 1 }}&ndash;{{ recycler.lastVisible() + 1 }}
      of {{ recycler.ariaSetSize() }}
    </span>
    <span class="status-badge">
      DOM nodes: {{ recycler.end() - recycler.start() }}
    </span>
    <label style="display:flex;align-items:center;gap:4px">
      Go to:
      <input type="number" [value]="targetIndex()" (input)="targetIndex.set(+$any($event.target).value)"
             min="0" [max]="recycler.ariaSetSize() - 1"
             style="width:80px;padding:4px 8px;border:1px solid var(--cngx-color-border,#ccc);border-radius:4px">
    </label>
    <button type="button" (click)="handleScrollTo()"
            style="padding:4px 12px;border:1px solid var(--cngx-color-border,#ccc);border-radius:4px;cursor:pointer">
      Scroll
    </button>
    @if (recycler.pendingTarget() != null) {
      <span aria-live="polite" style="color:var(--cngx-text-muted,#666)">
        Waiting for item {{ recycler.pendingTarget()! + 1 }}...
      </span>
    }
  </div>`,
};
