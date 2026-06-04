import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRecycler: scrollToIndex and deep-link',
  subtitle: '<code>scrollToIndex()</code> scrolls to any item by index. When the index exceeds <code>totalCount</code> (data not loaded yet), <code>pendingTarget</code> stores it and resolves automatically when <code>totalCount</code> grows past the target.',
  description: 'scrollToIndex jumps to any row by index. When the target exceeds totalCount, pendingTarget holds it and resolves automatically once data grows past the target. Enables deep-linking before data has loaded. The pending announcement uses aria-live="polite".',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern', 'async-state'],
  references: [
    { label: 'WAI-ARIA 1.2: aria-live', href: 'https://www.w3.org/TR/wai-aria-1.2/#aria-live' },
  ],
  apiComponents: [
    'CngxRecycler',
  ],
  moduleImports: [
    'import { injectRecycler } from \'@cngx/common/data\';',
  ],
  setup: `protected readonly scrollItems = signal(
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
  protected readonly scrollVisible = this.scrollRecycler.sliced(this.scrollItems);`,
  setupChrome: `  protected readonly scrollTarget = signal(0);
  protected handleScrollDemo(): void {
    this.scrollRecycler.scrollToIndex(this.scrollTarget());
  }`,
  template: `  <div class="recycler-scroll-demo demo-scroll-frame" style="height:300px">
    <div [style.paddingTop.px]="scrollRecycler.offsetBefore()"
         [style.paddingBottom.px]="scrollRecycler.offsetAfter()">
      @for (item of scrollVisible(); track item.id) {
        <div class="demo-scroll-row" style="height:40px">
          {{ item.name }}
        </div>
      }
    </div>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-bottom:8px">
    <label style="display:flex;align-items:center;gap:4px">
      Go to index:
      <input type="number" class="demo-numeric-input"
             [value]="scrollTarget()" (input)="scrollTarget.set(+$any($event.target).value)"
             min="0" [max]="scrollRecycler.ariaSetSize() - 1">
    </label>
    <button type="button" class="demo-icon-button" (click)="handleScrollDemo()">
      Scroll
    </button>
    <span class="status-badge">
      Visible: {{ scrollRecycler.firstVisible() + 1 }}-{{ scrollRecycler.lastVisible() + 1 }}
    </span>
    @if (scrollRecycler.pendingTarget() != null) {
      <span aria-live="polite" class="demo-card-label">
        Waiting for item {{ scrollRecycler.pendingTarget()! + 1 }}...
      </span>
    }
  </div>`,
};
