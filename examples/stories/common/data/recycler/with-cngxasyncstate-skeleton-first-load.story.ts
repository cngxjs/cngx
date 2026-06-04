import type { DemoSpec } from '../../../../dev-tools/demo-spec';

export const STORY: DemoSpec = {
  title: 'CngxRecycler: First-load skeleton via CngxAsyncState',
  subtitle: 'The recycler derives <code>isLoading</code>, <code>showSkeleton</code>, and <code>isEmpty</code> from a <code>CngxAsyncState</code> source; same pattern as <code>CngxCardGrid</code> and <code>CngxTreetable</code>. Skeleton slots fill the viewport height automatically.',
  description: 'Passing a CngxAsyncState source lets the recycler derive isLoading, showSkeleton, and isEmpty automatically. Skeleton slots fill the viewport while data loads; skeletonDelay suppresses the skeleton on fast loads to prevent flashes.',
  level: 'molecule',
  audience: ['dev'],
  artifact: 'building-block',
  focus: ['async-state', 'composition'],
  apiComponents: [
    'CngxRecycler',
  ],
  moduleImports: [
    'import { computed } from \'@angular/core\';',
    'import { injectRecycler, createManualState } from \'@cngx/common/data\';',
  ],
  setup: `protected readonly asyncState = createManualState<{ id: number; name: string }[]>();
  protected readonly asyncRecycler = injectRecycler({
    scrollElement: '.async-scroll',
    totalCount: () => (this.asyncState.data() ?? []).length,
    estimateSize: 48,
    state: this.asyncState,
    skeletonDelay: 0,
  });
  protected readonly asyncVisible = this.asyncRecycler.sliced(
    computed(() => this.asyncState.data() ?? []),
  );

  protected skeletonRange(n: number): readonly number[] {
    return Array.from({ length: n }, (_, i) => i);
  }`,
  setupChrome: `  constructor() {
    this.loadAsyncDemo();
  }
  protected handleReloadAsync(): void {
    this.asyncState.reset();
    this.loadAsyncDemo();
  }
  private loadAsyncDemo(): void {
    this.asyncState.set('loading');
    setTimeout(() => {
      this.asyncState.setSuccess(
        Array.from({ length: 200 }, (_, i) => ({
          id: i,
          name: 'Entry ' + (i + 1),
        })),
      );
    }, 1500);
  }`,
  template: `  <div class="async-scroll demo-scroll-frame" role="list" aria-label="Demo items"
       style="height:300px;overflow-y:auto">
    @if (asyncRecycler.showSkeleton()) {
      @for (_ of skeletonRange(asyncRecycler.skeletonSlots()); track $index) {
        <div role="presentation" aria-hidden="true"
             class="demo-scroll-row demo-skeleton-row"
             style="height:48px"></div>
      }
    } @else {
      <div [style.paddingTop.px]="asyncRecycler.offsetBefore()"
           [style.paddingBottom.px]="asyncRecycler.offsetAfter()">
        @for (item of asyncVisible(); track item.id) {
          <div role="listitem" class="demo-scroll-row" style="height:48px">
            {{ item.name }}
          </div>
        }
      </div>
    }
  </div>`,
  templateChrome: `<div class="status-row" style="margin-bottom:8px">
    <span class="status-badge">Status: {{ asyncState.status() }}</span>
    @if (asyncRecycler.showSkeleton()) {
      <span class="status-badge">Skeleton slots: {{ asyncRecycler.skeletonSlots() }}</span>
    }
    <button type="button" class="demo-icon-button" (click)="handleReloadAsync()">
      Reload
    </button>
  </div>`,
};
