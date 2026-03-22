# @cngx/common — Layout Behaviors

Directives for viewport observation, scroll control, overlay management,
responsive media queries, and drawer/sidebar systems. All expose Signal-based
APIs with automatic lifecycle management.

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

### CngxScrollLock

Prevents body scrolling when enabled. Sets `overflow: hidden` and
`scrollbar-gutter: stable` on `<html>` to avoid layout shift. Restores
original values on disable or destroy.

```html
<div [cngxScrollLock]="isOpen()">
  ...modal or drawer content...
</div>
```

**Inputs:** `cngxScrollLock` (boolean, alias for `enabled`)

Use cases:
- Modal dialogs — prevent background scroll while open
- Drawer overlays — lock page behind the panel
- Bottom sheets, lightboxes, fullscreen menus

### CngxBackdrop

Manages overlay behavior: visibility toggling, click-to-close, and `inert`
attribute toggling on sibling elements for a11y.

When visible, all sibling elements of the host receive the `inert` attribute,
making them unfocusable and non-interactive. This is the correct way to
prevent interaction behind modal overlays — better than `pointer-events: none`
because it also blocks keyboard access.

The directive is purely behavioral — all visual styling (background color,
opacity, transitions) is the consumer's responsibility via CSS.

```html
<div class="container">
  <div [cngxBackdrop]="isOpen()" (backdropClick)="close()"
       class="my-backdrop"></div>
  <div class="content">This becomes inert when backdrop is visible</div>
</div>
```

**Inputs:** `cngxBackdrop` (boolean, alias for `visible`), `closeOnClick` (boolean, default `true`)
**Outputs:** `backdropClick` (void)
**Host classes:** `cngx-backdrop--visible`
**Host attrs:** `aria-hidden` (inverse of visible)

Consumer CSS example:
```css
.my-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}
.my-backdrop.cngx-backdrop--visible {
  opacity: 1;
  pointer-events: auto;
}
```

### CngxMediaQuery

Reactive media query directive wrapping `window.matchMedia()`. Exposes a
`matches` signal that updates live when the query result changes.

```html
<div cngxMediaQuery="(min-width: 1024px)" #desktop="cngxMediaQuery">
  @if (desktop.matches()) { Desktop layout } @else { Mobile layout }
</div>
```

**Inputs:** `cngxMediaQuery` (string, required — the CSS media query)
**Signals:** `matches` (boolean)

Use cases:
- Responsive drawer mode: `side` on desktop, `over` on mobile
- Conditional rendering based on viewport width
- Detecting `prefers-reduced-motion`, `prefers-color-scheme`, `prefers-contrast`
- Any logic that depends on a media query match

### Drawer System

See [`drawer/README.md`](drawer/README.md) for the full drawer/sidebar system
(`CngxDrawer`, `CngxDrawerPanel`, `CngxDrawerContent`).
