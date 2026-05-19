import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'Variable Heights — CngxMeasure',
  subtitle: 'For items with varying heights, add <code>[cngxMeasure]</code> to each item. The recycler accumulates measured heights for accurate scroll position calculation.',
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
    'import { injectRecycler, CngxMeasure } from \'@cngx/common/data\';',
  ],
  imports: ['CngxMeasure'],
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

protected readonly variableItems = signal(
    Array.from({ length: 2000 }, (_, i) => ({
      id: i,
      name: 'Item ' + (i + 1),
      content: Array.from({ length: 1 + (i % 5) }, (__, j) => 'Line ' + (j + 1)).join(' | '),
    })),
  );

  protected readonly varRecycler = injectRecycler({
    scrollElement: '.recycler-var-scroll',
    totalCount: () => this.variableItems().length,
    estimateSize: 48,
    overscan: 5,
  });

  protected readonly varVisible = this.varRecycler.sliced(this.variableItems);`,
  template: `
  <div class="recycler-var-scroll"
       style="height:400px;overflow-y:auto;border:1px solid var(--cngx-color-border,#e0e0e0);border-radius:8px">
    <div [style.paddingTop.px]="varRecycler.offsetBefore()"
         [style.paddingBottom.px]="varRecycler.offsetAfter()">
      @for (item of varVisible(); track item.id; let i = $index) {
        <div [cngxMeasure]="varRecycler" [cngxMeasureIndex]="varRecycler.start() + i"
             style="padding:12px 16px;border-bottom:1px solid var(--cngx-color-border,#e0e0e0)">
          <strong>{{ item.name }}</strong>
          <p style="margin:4px 0;color:var(--cngx-text-muted,#666)">{{ item.content }}</p>
        </div>
      }
    </div>
  </div>`,
};
