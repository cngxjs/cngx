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

### Notes

- Observer auto-recreates when `root`, `rootMargin`, or `threshold` inputs change.
- Observer disconnects on destroy or when `enabled` is `false`.
- Includes a time-based debounce guard to prevent rapid re-triggers.

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

### Notes

- Sentinel is a 1px invisible element with `aria-hidden="true"`.
- Sentinel and observer are created in `afterNextRender`, cleaned up via `DestroyRef`.
- Sticky header itself remains visible to screen readers (`aria-hidden` is not set on host).

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

### Notes

- Observer recreated via `effect()` when `sections`, `threshold`, `root`, or `rootMargin` change.
- Uses 11 threshold steps (0, 0.1, 0.2 … 1.0) for accurate ratio tracking.
- Pairs naturally with `CngxNavLink` for scroll-based navigation highlighting.

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

### Notes

- Host styles applied automatically: `-webkit-line-clamp`, `display: -webkit-box`, `-webkit-box-orient: vertical`, `overflow: hidden`.
- All styles removed when expanded.
- `ResizeObserver` re-checks on container resize.
- `isClamped` is only updated when collapsed — expanded state preserves the last known value.
- Consumer is responsible for the toggle button and `aria-expanded` attribute.

## Other Exports

`CngxIntersectionObserver`, `CngxResizeObserver`, `CngxScrollLock`, `CngxBackdrop`,
`CngxMediaQuery`, `CngxDrawer`, `CngxDrawerPanel`, `CngxDrawerContent`, `CngxInfiniteScroll`
