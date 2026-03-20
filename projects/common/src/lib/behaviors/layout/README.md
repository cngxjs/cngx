# @cngx/common — Layout Behaviors

Directives that observe the host element's position and size in the viewport,
exposing browser observer APIs as Angular signals.

## Why not use the browser APIs directly?

`IntersectionObserver` and `ResizeObserver` are callback-based APIs that require
manual lifecycle management (`observe` / `disconnect`). These directives handle
creation, reconfiguration on input changes, and cleanup on destroy automatically.
All state is exposed as signals — no subscriptions, no manual teardown.

## Directives

### CngxIntersectionObserver

Tracks whether the host element is visible in the viewport or a scroll container.

```html
<div cngxIntersectionObserver #io="cngxIntersectionObserver"
     (entered)="loadMore()" [threshold]="0.5">
  @if (io.isIntersecting()) { Visible at {{ io.intersectionRatio() | percent }} }
</div>
```

**Inputs:** `root` (CSS selector | null), `rootMargin` (string), `threshold` (number | number[])
**Signals:** `isIntersecting` (boolean), `intersectionRatio` (number 0–1)
**Outputs:** `intersectionChange` (IntersectionObserverEntry), `entered` (void), `left` (void)

Use cases:
- Infinite scroll sentinels
- Lazy-loading images or heavy components
- Scroll-triggered animations (fade in on enter)
- Analytics: track which sections the user actually sees
- "Back to top" button visibility

### CngxResizeObserver

Tracks the host element's size via the ResizeObserver API.

```html
<div cngxResizeObserver #ro="cngxResizeObserver" style="resize: both; overflow: auto;">
  {{ ro.width() | number:'1.0-0' }} x {{ ro.height() | number:'1.0-0' }} px
</div>
```

**Inputs:** `box` (ResizeObserverBoxOptions, default `'content-box'`)
**Signals:** `width` (number), `height` (number), `contentRect` (DOMRectReadOnly | null), `isReady` (boolean)
**Outputs:** `resize` (ResizeObserverEntry)

Use cases:
- Responsive component logic in TypeScript (beyond CSS media queries)
- Dynamic chart/canvas sizing
- Container-query-like behavior without CSS Container Queries
- Adapting column count or layout mode based on available width
