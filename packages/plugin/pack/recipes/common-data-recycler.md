---
title: "CngxRecycler: First-load skeleton via CngxAsyncState"
whenToUse: "Passing a CngxAsyncState source lets the recycler derive isLoading, showSkeleton, and isEmpty automatically. Skeleton slots fill the viewport while data loads; skeletonDelay suppresses the skeleton on fast loads to prevent flashes."
symbols: [CngxRecycler]
---

# CngxRecycler: First-load skeleton via CngxAsyncState

Passing a CngxAsyncState source lets the recycler derive isLoading, showSkeleton, and isEmpty automatically. Skeleton slots fill the viewport while data loads; skeletonDelay suppresses the skeleton on fast loads to prevent flashes.

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
    skeletonDelay: 0,
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
