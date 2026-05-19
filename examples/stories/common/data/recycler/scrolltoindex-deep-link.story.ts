import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'ScrollToIndex + Deep-Link',
  subtitle: '<code>scrollToIndex()</code> scrolls to any item by index. When the index exceeds <code>totalCount</code> (data not loaded yet), <code>pendingTarget</code> stores it and resolves automatically when <code>totalCount</code> grows past the target.',
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
    'import { injectRecycler } from \'@cngx/common/data\';',
  ],
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

protected readonly scrollItems = signal(
    Array.from({ length: 2000 }, (_, i) => ({
      id: i,
      name: 'Entry ' + (i + 1),
    })),
  );

  protected readonly scrollRecycler = injectRecycler({
    scrollElement: '.recycler-scroll-demo',
    totalCount: () => this.scrollItems().length,
    estimateSize: 40,
    overscan: 5,
  });

  protected readonly scrollVisible = this.scrollRecycler.sliced(this.scrollItems);
  protected readonly scrollTarget = signal(0);

  protected handleScrollDemo(): void {
    this.scrollRecycler.scrollToIndex(this.scrollTarget());
  }`,
  template: `
  <div style="display:flex;gap:8px;align-items:center;margin-bottom:8px;flex-wrap:wrap">
    <label style="display:flex;align-items:center;gap:4px">
      Go to index:
      <input type="number" [value]="scrollTarget()" (input)="scrollTarget.set(+$any($event.target).value)"
             min="0" [max]="scrollRecycler.ariaSetSize() - 1"
             style="width:80px;padding:4px 8px;border:1px solid var(--cngx-color-border,#ccc);border-radius:4px">
    </label>
    <button type="button" (click)="handleScrollDemo()"
            style="padding:6px 16px;border:1px solid var(--cngx-color-border,#ccc);border-radius:4px;cursor:pointer">
      Scroll
    </button>
    <span class="status-badge">
      Visible: {{ scrollRecycler.firstVisible() + 1 }}&ndash;{{ scrollRecycler.lastVisible() + 1 }}
    </span>
    @if (scrollRecycler.pendingTarget() != null) {
      <span aria-live="polite" style="color:var(--cngx-text-muted,#666)">
        Waiting for item {{ scrollRecycler.pendingTarget()! + 1 }}...
      </span>
    }
  </div>
  <div class="recycler-scroll-demo"
       style="height:300px;overflow-y:auto;border:1px solid var(--cngx-color-border,#e0e0e0);border-radius:8px">
    <div [style.paddingTop.px]="scrollRecycler.offsetBefore()"
         [style.paddingBottom.px]="scrollRecycler.offsetAfter()">
      @for (item of scrollVisible(); track item.id) {
        <div style="height:40px;display:flex;align-items:center;padding:0 16px;border-bottom:1px solid var(--cngx-color-border,#e0e0e0)">
          {{ item.name }}
        </div>
      }
    </div>
  </div>`,
};
