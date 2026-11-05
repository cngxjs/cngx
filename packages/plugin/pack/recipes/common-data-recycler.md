---
title: "CngxRecycler: First-load skeleton via CngxAsyncState"
whenToUse: "Passing a CngxAsyncState source lets the recycler derive isLoading, showSkeleton, and isEmpty automatically. Skeleton slots fill the viewport while data loads. The skeleton is timed by the loading gate: it appears only after the showDelay (120 ms by default via CNGX_LOADING_CONFIG) so a fast load never flashes it, and is held for minDwell (400 ms) once shown. Override with provideLoadingConfigAt(withShowDelay(...), withMinDwell(...))."
symbols: [CngxRecycler]
---

# CngxRecycler: First-load skeleton via CngxAsyncState

Passing a CngxAsyncState source lets the recycler derive isLoading, showSkeleton, and isEmpty automatically. Skeleton slots fill the viewport while data loads. The skeleton is timed by the loading gate: it appears only after the showDelay (120 ms by default via CNGX_LOADING_CONFIG) so a fast load never flashes it, and is held for minDwell (400 ms) once shown. Override with provideLoadingConfigAt(withShowDelay(...), withMinDwell(...)).

## Symbols

- `CngxRecycler`

## Setup

```ts
protected readonly asyncState = createManualState<{ id: number; name: string }[]>();
protected readonly asyncRecycler = injectRecycler({
  scrollElement: '.async-scroll',
  totalCount: () => (this.asyncState.data() ?? []).length,
  estimateSize: 48,
  state: this.asyncState,
});
protected readonly asyncVisible = this.asyncRecycler.sliced(
  computed(() => this.asyncState.data() ?? []),
);

protected skeletonRange(n: number): readonly number[] {
  return Array.from({ length: n }, (_, i) => i);
}
```

## Wiring

```html
<div class="async-scroll demo-scroll-frame" role="list" aria-label="Demo items"
     [attr.aria-busy]="asyncRecycler.isLoading() || asyncRecycler.showSkeleton() || asyncRecycler.isRefreshing() || null"
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
</div>
```
