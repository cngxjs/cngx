import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRecyclerPlaceholder: Fast-fling skeleton placeholders',
  subtitle:
    '<code>[cngxRecyclerPlaceholder]</code> paints a row-aligned skeleton background on the scrolling content element. Fling the list hard or drag the scrollbar to a far offset: the frame where rendered rows lag <code>scrollTop</code> reveals skeleton bars instead of the bare surface.',
  description:
    'A 100,000-row fixed-height list windowed by injectRecycler, offset with padding-block on the scrolling <ul>. CngxRecyclerPlaceholder rides that <ul> and keys its repeat rhythm off the recycler rowSizeHint, so any uncovered offset region paints skeleton bars during a fast fling or teleport jump. Pure CSS background layer: no extra DOM nodes, nothing in the a11y tree.',
  level: 'molecule',
  audience: ['dev', 'a11y'],
  artifact: 'building-block',
  focus: ['behavior', 'a11y-pattern'],
  apiComponents: ['CngxRecyclerPlaceholder', 'CngxRecycler'],
  moduleImports: [
    "import { injectRecycler, CngxRecyclerPlaceholder } from '@cngx/common/data';",
  ],
  imports: ['CngxRecyclerPlaceholder'],
  setup: `protected readonly allItems = signal(
    Array.from({ length: 100_000 }, (_, i) => ({ id: i, name: 'Row ' + (i + 1) })),
  );
  protected readonly recycler = injectRecycler({
    scrollElement: '.fling-scroll',
    totalCount: () => this.allItems().length,
    estimateSize: 56,
    overscan: 6,
  });
  protected readonly visibleItems = this.recycler.sliced(this.allItems);`,
  template: `  <div class="fling-scroll demo-scroll-frame" role="list" aria-label="Demo rows"
       style="height:400px">
    <ul style="margin:0;padding-inline:0;list-style:none">
      @if (recycler.offsetBefore(); as before) {
        <li role="presentation" aria-hidden="true"
            [cngxRecyclerPlaceholder]="recycler" [style.height.px]="before"></li>
      }
      @for (item of visibleItems(); track item.id; let i = $index) {
        <li role="listitem"
            style="height:56px;display:flex;align-items:center;padding-inline:16px;box-sizing:border-box">
          {{ item.name }}
        </li>
      }
      @if (recycler.offsetAfter(); as after) {
        <li role="presentation" aria-hidden="true"
            [cngxRecyclerPlaceholder]="recycler" [style.height.px]="after"></li>
      }
    </ul>
  </div>`,
  templateChrome: `<div class="status-row" style="margin-top:8px;gap:16px">
    <span class="status-badge">
      Showing {{ recycler.firstVisible() + 1 }}-{{ recycler.lastVisible() + 1 }}
      of {{ recycler.ariaSetSize() }}
    </span>
    <span class="status-badge">DOM rows: {{ recycler.end() - recycler.start() }}</span>
    <span class="status-badge">Row rhythm: {{ recycler.rowSizeHint() }}px</span>
  </div>`,
};
