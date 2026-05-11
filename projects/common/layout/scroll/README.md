# Scroll System

Scroll-aware directives for sticky headers, infinite scroll, scroll locking, and active section tracking. All utilities use native browser APIs (`IntersectionObserver`, `ResizeObserver`, media queries) with Signal-based reactivity.

## Import

```typescript
import {
  CngxScrollSpy,
  CngxScrollLock,
  CngxStickyHeader,
  CngxInfiniteScroll,
} from '@cngx/common/layout';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import {
  CngxScrollSpy,
  CngxScrollLock,
  CngxStickyHeader,
  CngxInfiniteScroll,
} from '@cngx/common/layout';

@Component({
  selector: 'app-scroll-example',
  template: `
    <div [cngxScrollLock]="isModalOpen()">
      <!-- Sticky header -->
      <header cngxStickyHeader #sticky="cngxStickyHeader"
              [class.shadow]="sticky.isSticky()">
        Page Header
      </header>

      <!-- Scroll spy navigation -->
      <nav [cngxScrollSpy]="['intro', 'features', 'pricing']" #spy="cngxScrollSpy">
        <a [class.active]="spy.activeId() === 'intro'" href="#intro">Intro</a>
        <a [class.active]="spy.activeId() === 'features'" href="#features">Features</a>
        <a [class.active]="spy.activeId() === 'pricing'" href="#pricing">Pricing</a>
      </nav>

      <!-- Content sections -->
      <section id="intro">Introduction</section>
      <section id="features">Features</section>
      <section id="pricing">Pricing</section>

      <!-- Infinite scroll sentinel -->
      <div cngxInfiniteScroll
           [loading]="isFetching()"
           (loadMore)="fetchNextPage()">
        @if (isFetching()) { <p>Loading...</p> }
      </div>
    </div>
  `,
  imports: [CngxScrollSpy, CngxScrollLock, CngxStickyHeader, CngxInfiniteScroll],
})
export class ScrollExampleComponent {
  isModalOpen = signal(false);
  isFetching = signal(false);

  fetchNextPage() {
    this.isFetching.set(true);
    // Fetch logic
  }
}
```

---

## CngxScrollSpy

Tracks which section is currently most visible in the viewport using `IntersectionObserver`. Ideal for scroll-based navigation highlighting and reading progress.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxScrollSpy` | `string[]` | Required | IDs of the sections to observe. |
| `threshold` | `number` | `0.3` | Minimum visibility ratio (0–1) to consider a section as a candidate. |
| `root` | `string \| null` | `null` | CSS selector for the scroll container root. `null` uses the viewport. |
| `rootMargin` | `string` | `'0px'` | Root margin for the observer (CSS margin syntax, e.g., `'100px 0px'`). |

### Outputs

| Output | Emits | Description |
|-|-|-|
| `activeIdChange` | `string \| null` | Emitted when the active section changes. |

### Signals

#### Public Signals (read-only)
- `activeId: Signal<string \| null>` — ID of the section with the highest intersection ratio. Null if none meet the threshold.

### Usage Example

```html
<nav [cngxScrollSpy]="['section-1', 'section-2', 'section-3']"
     #spy="cngxScrollSpy"
     [threshold]="0.5">
  <a [class.active]="spy.activeId() === 'section-1'" href="#section-1">Section 1</a>
  <a [class.active]="spy.activeId() === 'section-2'" href="#section-2">Section 2</a>
  <a [class.active]="spy.activeId() === 'section-3'" href="#section-3">Section 3</a>
</nav>

<section id="section-1">Content 1</section>
<section id="section-2">Content 2</section>
<section id="section-3">Content 3</section>
```

---

## CngxScrollLock

Prevents scrolling on the document body by setting `overflow: hidden` and `scrollbar-gutter: stable` on `<html>`. Multiple instances are ref-counted — original styles are only restored when the last lock is released.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxScrollLock` | `boolean` | `false` | Whether scroll lock is active. |

### Behavior

- Sets `overflow: hidden` and `scrollbar-gutter: stable` on `<html>` when enabled.
- Prevents layout shift from scrollbar disappearance via `scrollbar-gutter: stable`.
- Restores original styles when disabled.
- Ref-counts instances: last lock to release restores styles.

### Usage Example

```html
<!-- With a drawer -->
<div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()">
  <!-- Panel and content -->
</div>

<!-- With a modal -->
<div [cngxScrollLock]="isModalOpen()">
  <!-- Modal content -->
</div>
```

---

## CngxStickyHeader

Communicates when a sticky-positioned element becomes stuck (scrolled past its natural position) using a sentinel element and `IntersectionObserver`.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `threshold` | `number` | `0` | Intersection threshold. `0` triggers as soon as the sentinel leaves viewport. |

### Outputs

| Output | Emits | Description |
|-|-|-|
| `stickyChange` | `boolean` | Emitted when the sticky state changes. |

### Signals

#### Public Signals (read-only)
- `isSticky: Signal<boolean>` — Whether the header is currently in its stuck position (scrolled past natural position).

### CSS Classes

- `.cngx-sticky--active` — Applied when the header is stuck.

### Host Styling

The directive automatically applies:
- `position: sticky`
- `top: 0`
- `z-index: var(--cngx-sticky-z-index, 1)`

### Usage Example

```html
<header cngxStickyHeader #sh="cngxStickyHeader"
        [class.with-shadow]="sh.isSticky()">
  Page Header
</header>

<style>
  header.with-shadow {
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
</style>
```

### How It Works

A 1px invisible sentinel element is inserted before the host. When the sentinel scrolls out of view, the header must be stuck. The `IntersectionObserver` tracks sentinel visibility and updates the `isSticky` signal accordingly.

---

## CngxInfiniteScroll

Infinite scroll trigger using `IntersectionObserver`. Place on a sentinel element at the bottom of a scrollable list. Fires `loadMore` when the sentinel enters the viewport (with debounce guard).

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `threshold` | `number` | `0` | Intersection threshold (0–1). `0` = any pixel visible. |
| `rootMargin` | `string` | `'0px 0px 200px 0px'` | Pre-fetch margin. Triggers 200px before sentinel is visible. |
| `root` | `string \| null` | `null` | CSS selector for custom scroll container. `null` uses viewport. |
| `enabled` | `boolean` | `true` | When `false`, observer disconnects entirely. Use to stop when all items loaded. |
| `loading` | `boolean` | `false` | Set to `true` while fetching. Prevents re-trigger until fetch completes. |
| `debounceMs` | `number` | `200` | Minimum ms between consecutive `loadMore` emissions. |

### Outputs

| Output | Emits | Description |
|-|-|-|
| `loadMore` | `void` | Emitted when sentinel is visible, not loading, and debounce has elapsed. |

### Signals

#### Public Signals (read-only)
- `isLoading: Signal<boolean>` — Readonly mirror of the `loading` input.

### CSS Classes

- `.cngx-infinite-scroll` — Always applied.
- `.cngx-infinite-scroll--loading` — Applied when `loading()` is true.

### ARIA Attributes

- `aria-busy="true"` — Applied when `loading()` is true.

### Usage Example

```typescript
readonly items = signal<Item[]>([]);
readonly isFetching = signal(false);
readonly hasMore = signal(true);
readonly page = signal(1);

fetchNextPage() {
  if (this.isFetching()) return;
  this.isFetching.set(true);

  this.api.getItems(this.page()).subscribe({
    next: (result) => {
      this.items.mutate((list) => list.push(...result.items));
      this.page.update((p) => p + 1);
      this.hasMore.set(result.hasMore);
    },
    finalize: () => this.isFetching.set(false),
  });
}
```

```html
<div class="item-list">
  @for (item of items(); track item.id) {
    <app-item [data]="item" />
  }

  <div cngxInfiniteScroll
       [enabled]="hasMore()"
       [loading]="isFetching()"
       [rootMargin]="'0px 0px 400px 0px'"
       (loadMore)="fetchNextPage()">
    @if (isFetching()) {
      <div class="loading-indicator">Loading...</div>
    }
    @if (!hasMore()) {
      <p class="end-message">All items loaded</p>
    }
  </div>
</div>
```

---

## Accessibility

The scroll system is fully accessible out of the box:

- **ARIA roles:** Scroll utilities do not add roles (no semantic DOM changes). Content structure remains natural.
- **Keyboard interaction:**
  - `Escape` — Closes any modals with `CngxScrollLock` active
  - Scroll wheel / arrow keys — Native scroll behavior preserved (only `overflow` is hidden, not prevented)
- **Screen reader:** `aria-busy="true"` on infinite scroll sentinel when loading. Sticky header state available via `isSticky()` signal for dynamic aria-labels.
- **Focus management:** Scroll lock does not trap focus; it only prevents viewport scrolling. Use with focus-trapping directives (`CngxFocusTrap`) for modal behavior.

## Composition

Scroll utilities integrate with:

- **Host directives:** `CngxInfiniteScroll` and `CngxStickyHeader` are standalone (no composition).
- **Combines with:** `CngxScrollLock` + drawer/modal, `CngxScrollSpy` + navigation, `CngxInfiniteScroll` + data lists.
- **Provides:** No injectable tokens.

### Example: Page with Sticky Header, Scroll Spy Nav, and Infinite List

```typescript
@Component({
  selector: 'app-page',
  template: `
    <div [cngxScrollLock]="false">
      <!-- Sticky header -->
      <header cngxStickyHeader [class.sticky-active]="sticky.isSticky()"
              #sticky="cngxStickyHeader">
        <h1>Page Title</h1>
      </header>

      <!-- Sticky navigation -->
      <nav cngxStickyHeader [threshold]="0.5"
           [cngxScrollSpy]="['section1', 'section2', 'section3']"
           #spy="cngxScrollSpy">
        <a [class.active]="spy.activeId() === 'section1'" href="#section1">
          Section 1
        </a>
        <a [class.active]="spy.activeId() === 'section2'" href="#section2">
          Section 2
        </a>
        <a [class.active]="spy.activeId() === 'section3'" href="#section3">
          Section 3
        </a>
      </nav>

      <!-- Scrollable content -->
      <main>
        <section id="section1">Content</section>
        <section id="section2">Content</section>
        <section id="section3">Content</section>

        <!-- Infinite scroll -->
        <div cngxInfiniteScroll
             [enabled]="hasMore()"
             [loading]="isLoading()"
             [rootMargin]="'0px 0px 500px 0px'"
             (loadMore)="loadMore()">
          @if (isLoading()) { Loading... }
        </div>
      </main>
    </div>
  `,
  imports: [CngxScrollLock, CngxStickyHeader, CngxScrollSpy, CngxInfiniteScroll],
})
export class PageComponent {
  readonly items = signal<Item[]>([]);
  readonly isLoading = signal(false);
  readonly hasMore = signal(true);

  loadMore() {
    // Fetch next items
  }
}
```

## Styling

Scroll utilities are mostly unstyled (behavior-only). CSS custom properties are available for consumer customization.

### Variables

- `--cngx-sticky-z-index` (default `1`) — Z-index for sticky headers.

### Example CSS

```scss
// Sticky header with shadow
header[cngxStickyHeader].cngx-sticky--active {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.95);
}

// Infinite scroll sentinel styling
div[cngxInfiniteScroll] {
  padding: 2rem 0;
  text-align: center;

  &.cngx-infinite-scroll--loading {
    visibility: visible;
  }

  &:not(.cngx-infinite-scroll--loading) {
    visibility: hidden;
  }
}
```

## See Also

- [compodoc API documentation](http://localhost:4200/docs/common/layout)
- Demo: `dev-app/src/app/demos/common/scroll-demo/`
- Tests: `projects/common/layout/src/scroll/*.spec.ts`
- `CngxIntersectionObserver` in `@cngx/common/layout` — Low-level observer primitive
- `CngxResizeObserver` in `@cngx/common/layout` — Element size tracking
