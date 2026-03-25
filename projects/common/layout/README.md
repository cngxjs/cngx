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

---

## CngxStickyHeader

Communicates when a `position: sticky` element becomes stuck. Does NOT apply sticky positioning — CSS handles that. Inserts a sentinel element before the host and uses `IntersectionObserver` to detect when the sentinel scrolls out.

```html
<header cngxStickyHeader style="position: sticky; top: 0;">
  Page header
</header>
```

```css
.cngx-sticky--active { box-shadow: 0 2px 4px rgba(0,0,0,.1); }
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `threshold` | `number` | `0` | IO threshold — `0` triggers as soon as sentinel leaves |

### Outputs

| Output | Type | Description |
|-|-|-|
| `stickyChange` | `boolean` | Emitted when the sticky state changes |

### Signals

| Signal | Type | Description |
|-|-|-|
| `isSticky` | `boolean` | Whether the header is currently stuck |

### CSS Classes

| Class | When |
|-|-|
| `cngx-sticky--active` | Header is in stuck position |

### Selector

`[cngxStickyHeader]` -- exportAs `"cngxStickyHeader"`

### Notes

- Sentinel is a 1px invisible element with `aria-hidden="true"`.
- Sentinel and observer are created in `afterNextRender`, cleaned up via `DestroyRef`.
- Sticky header itself remains visible to screen readers (`aria-hidden` is not set on host).

---

## CngxScrollSpy

Tracks which section is currently most visible in the viewport. Observes a list of elements by their IDs using `IntersectionObserver` with fine-grained thresholds (10% steps). Reports the one with the highest ratio above the minimum threshold.

```html
<nav [cngxScrollSpy]="['intro', 'features', 'pricing']" #spy="cngxScrollSpy">
  <a [class.active]="spy.activeId() === 'intro'" href="#intro">Intro</a>
  <a [class.active]="spy.activeId() === 'features'" href="#features">Features</a>
  <a [class.active]="spy.activeId() === 'pricing'" href="#pricing">Pricing</a>
</nav>

<section id="intro">…</section>
<section id="features">…</section>
<section id="pricing">…</section>
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxScrollSpy` | `string[]` | required | Section IDs to observe |
| `threshold` | `number` | `0.3` | Minimum visibility ratio to consider a section active |
| `root` | `string \| null` | `null` | CSS selector for custom scroll container |
| `rootMargin` | `string` | `'0px'` | Root margin for the observer |

### Outputs

| Output | Type | Description |
|-|-|-|
| `activeIdChange` | `string \| null` | Emitted when the active section changes |

### Signals

| Signal | Type | Description |
|-|-|-|
| `activeId` | `string \| null` | ID of the most-visible section (or `null` if none meets threshold) |

### Selector

`[cngxScrollSpy]` -- exportAs `"cngxScrollSpy"`

### Notes

- Observer recreated via `effect()` when `sections`, `threshold`, `root`, or `rootMargin` change.
- Uses 11 threshold steps (0, 0.1, 0.2 … 1.0) for accurate ratio tracking.
- Pairs naturally with `CngxNavLink` for scroll-based navigation highlighting.

---

## CngxTruncate

Manages text truncation with expand/collapse state detection. Applies `-webkit-line-clamp` when collapsed and uses `ResizeObserver` to detect whether the text actually overflows. The `isClamped` signal lets the consumer show a toggle button only when needed.

```html
<p [cngxTruncate]="3" [(expanded)]="expanded" #trunc="cngxTruncate">
  Long text content…
</p>
@if (trunc.isClamped() || trunc.expanded()) {
  <button (click)="expanded.set(!expanded())"
          [attr.aria-expanded]="expanded()">
    {{ expanded() ? 'Show less' : 'Show more' }}
  </button>
}
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxTruncate` | `number` | `3` | Maximum visible lines when collapsed |
| `expanded` | `boolean` | `false` | Whether text is fully visible. Supports two-way `[(expanded)]` |

### Signals

| Signal | Type | Description |
|-|-|-|
| `isClamped` | `boolean` | Whether content actually overflows the line limit |

### Selector

`[cngxTruncate]` -- exportAs `"cngxTruncate"`

### Notes

- Host styles applied automatically: `-webkit-line-clamp`, `display: -webkit-box`, `-webkit-box-orient: vertical`, `overflow: hidden`.
- All styles removed when expanded.
- `ResizeObserver` re-checks on container resize.
- `isClamped` is only updated when collapsed — expanded state preserves the last known value.
- Consumer is responsible for the toggle button and `aria-expanded` attribute.

---

## Other Exports

`CngxIntersectionObserver`, `CngxResizeObserver`, `CngxScrollLock`, `CngxBackdrop`,
`CngxMediaQuery`, `CngxDrawer`, `CngxDrawerPanel`, `CngxDrawerContent`, `CngxInfiniteScroll`
