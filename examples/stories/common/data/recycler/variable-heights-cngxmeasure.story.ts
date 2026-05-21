import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRecycler: Variable heights with CngxMeasure',
  subtitle: 'For items with varying heights, add <code>[cngxMeasure]</code> to each item. The recycler accumulates measured heights for accurate scroll position calculation.',
  description: 'Apply [cngxMeasure] to each row to feed the observed height back into the recycler. estimateSize seeds the calculation; measured heights replace the estimate as rows scroll into view, keeping offsetBefore and offsetAfter accurate.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['behavior'],
  apiComponents: [
    'CngxRecycler',
    'CngxMeasure',
  ],
  moduleImports: [
    'import { injectRecycler, CngxMeasure } from \'@cngx/common/data\';',
  ],
  imports: ['CngxMeasure'],
  setup: `protected readonly variableItems = signal(
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
  <div class="recycler-var-scroll demo-scroll-frame" style="height:400px">
    <div [style.paddingTop.px]="varRecycler.offsetBefore()"
         [style.paddingBottom.px]="varRecycler.offsetAfter()">
      @for (item of varVisible(); track item.id; let i = $index) {
        <div class="demo-scroll-row-stack"
             [cngxMeasure]="varRecycler" [cngxMeasureIndex]="varRecycler.start() + i">
          <strong>{{ item.name }}</strong>
          <p class="demo-card-label" style="margin:4px 0">{{ item.content }}</p>
        </div>
      }
    </div>
  </div>`,
};
