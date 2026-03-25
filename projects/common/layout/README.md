# @cngx/common/layout

Layout observation, scroll control, drawer system, and skeleton loading directives.

## CngxSkeleton

Headless skeleton loading placeholder. Toggles between loading and content states via CSS classes
and ARIA attributes. The consumer renders the skeleton UI.

```html
<div [cngxSkeleton]="isLoading()" [count]="3" #sk="cngxSkeleton">
  @if (sk.loading()) {
    @for (i of sk.indices(); track i) {
      <div class="skeleton-line" aria-hidden="true"></div>
    }
  } @else {
    <p>{{ content() }}</p>
  }
</div>
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxSkeleton` | `boolean` | `false` | Controls the loading state |
| `shimmer` | `boolean` | `true` | Enables shimmer animation class (respects `prefers-reduced-motion`) |
| `count` | `number` | `1` | Repeat count for `indices()` signal |

### Signals

| Signal | Type | Description |
|-|-|-|
| `loading` | `boolean` | Mirrors the `cngxSkeleton` input |
| `indices` | `number[]` | Array of indices `[0..count-1]` for `@for` rendering |

### CSS Classes

| Class | When |
|-|-|
| `cngx-skeleton` | Always |
| `cngx-skeleton--loading` | `loading()` is `true` |
| `cngx-skeleton--shimmer` | Loading, shimmer enabled, and reduced motion not preferred |

### ARIA

- `aria-busy="true"` when loading

### Selector

`[cngxSkeleton]` -- exportAs `"cngxSkeleton"`

## CngxInfiniteScroll

Infinite scroll trigger using `IntersectionObserver`. Place on a sentinel element at the
bottom of a list. Fires `loadMore` when the sentinel enters the viewport.

```html
<div class="item-list">
  @for (item of items(); track item.id) {
    <app-item [data]="item" />
  }
  <div cngxInfiniteScroll
       [enabled]="hasNextPage()"
       [loading]="isFetching()"
       (loadMore)="fetchNext()"
       #scroll="cngxInfiniteScroll">
    @if (scroll.isLoading()) { <mat-spinner diameter="24" /> }
  </div>
</div>
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `threshold` | `number` | `0` | IntersectionObserver threshold (0--1) |
| `rootMargin` | `string` | `'0px 0px 200px 0px'` | Pre-fetch margin (200px before visible by default) |
| `root` | `string \| null` | `null` | CSS selector for custom scroll container (`null` = viewport) |
| `enabled` | `boolean` | `true` | When `false`, observer disconnects. Use to stop at end of data |
| `loading` | `boolean` | `false` | Set `true` while fetching. Prevents re-trigger |
| `debounceMs` | `number` | `200` | Minimum ms between consecutive `loadMore` emissions |

### Outputs

| Output | Type | Description |
|-|-|-|
| `loadMore` | `void` | Emitted when sentinel is visible, not loading, and debounce elapsed |

### Signals

| Signal | Type | Description |
|-|-|-|
| `isLoading` | `boolean` | Readonly mirror of the `loading` input |

### CSS Classes

| Class | When |
|-|-|
| `cngx-infinite-scroll` | Always (static) |
| `cngx-infinite-scroll--loading` | `isLoading()` is `true` |

### ARIA

- `aria-busy="true"` when loading

### Selector

`[cngxInfiniteScroll]` -- exportAs `"cngxInfiniteScroll"`

### Notes

- Observer auto-recreates when `root`, `rootMargin`, or `threshold` inputs change.
- Observer disconnects on destroy or when `enabled` is `false`.
- Includes a time-based debounce guard to prevent rapid re-triggers.

## Other Exports

`CngxIntersectionObserver`, `CngxResizeObserver`, `CngxScrollLock`, `CngxBackdrop`,
`CngxMediaQuery`, `CngxDrawer`, `CngxDrawerPanel`, `CngxDrawerContent`
