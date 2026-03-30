# Observer System

Low-level observer directives wrapping native browser APIs. Use for reactive size tracking, viewport visibility, and media query changes. All observers expose state as Angular signals.

## Import

```typescript
import {
  CngxIntersectionObserver,
  CngxResizeObserver,
  CngxMediaQuery,
} from '@cngx/common/layout';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxIntersectionObserver, CngxResizeObserver, CngxMediaQuery } from '@cngx/common/layout';

@Component({
  selector: 'app-observer-example',
  template: `
    <!-- Intersection observer for lazy loading -->
    <img cngxIntersectionObserver #io="cngxIntersectionObserver"
         [src]="io.isIntersecting() ? imagePath() : ''"
         alt="Lazy loaded image" />

    <!-- Resize observer for responsive behavior -->
    <div cngxResizeObserver #ro="cngxResizeObserver"
         style="resize: horizontal; overflow: auto;">
      <p>Width: {{ ro.width() | number:'1.0-0' }}px</p>
      <p>Height: {{ ro.height() | number:'1.0-0' }}px</p>
    </div>

    <!-- Media query for responsive logic -->
    <div cngxMediaQuery="(min-width: 768px)" #mq="cngxMediaQuery">
      @if (mq.matches()) {
        <p>Desktop layout</p>
      } @else {
        <p>Mobile layout</p>
      }
    </div>
  `,
  imports: [CngxIntersectionObserver, CngxResizeObserver, CngxMediaQuery],
})
export class ObserverExampleComponent {
  imagePath = signal('');
}
```

---

## CngxIntersectionObserver

Observes whether the host element is visible in the viewport or a scroll container using the `IntersectionObserver` API. Exposes visibility state as Angular signals.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `root` | `string \| null` | `null` | CSS selector for the scroll container root. `null` uses the viewport. |
| `rootMargin` | `string` | `'0px'` | Margin around the root (CSS margin syntax, e.g., `'100px 0px'`). |
| `threshold` | `number \| number[]` | `0` | Visibility ratio(s) (0–1) at which callback fires. `0` = any pixel visible, `1` = fully visible. |

### Outputs

| Output | Emits | Description |
|-|-|-|
| `intersectionChange` | `IntersectionObserverEntry` | Emitted on every intersection change with raw entry. |
| `entered` | `void` | Emitted once when element enters the observed area. |
| `left` | `void` | Emitted once when element leaves the observed area. |

### Signals

#### Public Signals (read-only)
- `isIntersecting: Signal<boolean>` — `true` when any part of the element is visible within the root.
- `intersectionRatio: Signal<number>` — Fraction of the element currently visible (0–1).

### Usage Examples

#### Lazy Load Images

```html
<img cngxIntersectionObserver #io="cngxIntersectionObserver"
     (entered)="loadImage($event)"
     [src]="io.isIntersecting() ? imagePath : placeholder" />
```

#### Scroll-Triggered Animation

```html
<section cngxIntersectionObserver #io="cngxIntersectionObserver"
         [threshold]="0.5"
         [class.fade-in]="io.isIntersecting()">
  Fades in when 50% visible
</section>

<style>
  section {
    opacity: 0;
    transition: opacity 0.5s ease;
  }

  section.fade-in {
    opacity: 1;
  }
</style>
```

#### Custom Scroll Container

```html
<div class="scroll-container" style="overflow: auto; height: 400px;">
  <div cngxIntersectionObserver
       [root]="'.scroll-container'"
       [rootMargin]="'100px'"
       (entered)="onVisible()">
    Observed within .scroll-container
  </div>
</div>
```

#### Analytics: Track Impressions

```typescript
<div cngxIntersectionObserver #io="cngxIntersectionObserver"
     (entered)="trackImpression()">
  Ad unit (fires impression when visible)
</div>
```

---

## CngxResizeObserver

Observes size changes of the host element via the `ResizeObserver` API. Exposes dimensions as Angular signals for responsive component logic in TypeScript.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `box` | `'content-box' \| 'border-box' \| 'device-pixel-content-box'` | `'content-box'` | Which box model to observe. |

### Outputs

| Output | Emits | Description |
|-|-|-|
| `resize` | `ResizeObserverEntry` | Emitted on every resize with raw entry. |

### Signals

#### Public Signals (read-only)
- `contentRect: Signal<DOMRectReadOnly \| null>` — Full `DOMRectReadOnly` of the content box. `null` before first observation.
- `width: Signal<number>` — Current width in pixels. `0` before first observation.
- `height: Signal<number>` — Current height in pixels. `0` before first observation.
- `isReady: Signal<boolean>` — `true` after the first resize observation received.

### Usage Examples

#### Display Current Size

```html
<div cngxResizeObserver #ro="cngxResizeObserver"
     style="resize: horizontal; overflow: auto;">
  <p>{{ ro.width() | number:'1.0-0' }} × {{ ro.height() | number:'1.0-0' }} px</p>
</div>
```

#### Responsive Column Count (TypeScript Logic)

```typescript
@Component({
  template: `
    <div cngxResizeObserver #ro="cngxResizeObserver" class="grid">
      @for (item of items(); track item.id) {
        <div [style.grid-column]="'span ' + columnSpan()">{{ item }}</div>
      }
    </div>
  `,
})
export class ResponsiveGridComponent {
  readonly ro = viewChild(CngxResizeObserver);
  readonly columnSpan = computed(() => {
    const width = this.ro()?.width() ?? 0;
    if (width < 400) return 1;
    if (width < 800) return 2;
    return 3;
  });
}
```

#### Container Queries (JS Fallback for Older Browsers)

```typescript
readonly containerQueries = computed(() => ({
  small: (this.ro()?.width() ?? 0) < 500,
  medium: (this.ro()?.width() ?? 0) >= 500 && (this.ro()?.width() ?? 0) < 1000,
  large: (this.ro()?.width() ?? 0) >= 1000,
}));

// Use: [class.is-small]="containerQueries().small"
```

#### Dynamic Canvas Sizing

```typescript
@Component({
  template: `
    <canvas #canvas cngxResizeObserver (resize)="onResize($event)"></canvas>
  `,
})
export class CanvasComponent {
  @ViewChild('canvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild(CngxResizeObserver) ro!: CngxResizeObserver;

  onResize(entry: ResizeObserverEntry) {
    const ctx = this.canvas.nativeElement.getContext('2d');
    ctx?.clearRect(0, 0, entry.contentRect.width, entry.contentRect.height);
    // Redraw at new size
  }
}
```

---

## CngxMediaQuery

Reactive media query directive that exposes a `matches` signal. Wraps `window.matchMedia()` with automatic cleanup. Use for responsive layouts, drawer mode switching, and conditional rendering.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxMediaQuery` | `string` | Required | CSS media query string to evaluate (e.g., `'(min-width: 1024px)'`). |

### Signals

#### Public Signals (read-only)
- `matches: Signal<boolean>` — Whether the media query currently matches.

### Usage Examples

#### Responsive Drawer Mode

```html
<div cngxMediaQuery="(min-width: 1024px)" #mq="cngxMediaQuery">
  <nav [cngxDrawerPanel]="drawer"
       [mode]="mq.matches() ? 'side' : 'over'">
    <!-- Navigation -->
  </nav>
</div>
```

#### Dark Mode Awareness

```html
<div cngxMediaQuery="(prefers-color-scheme: dark)" #dark="cngxMediaQuery">
  @if (dark.matches()) {
    <p>🌙 Dark mode is active</p>
  } @else {
    <p>☀️ Light mode is active</p>
  }
</div>
```

#### Reduced Motion Accessibility

```html
<div cngxMediaQuery="(prefers-reduced-motion: reduce)" #reducedMotion="cngxMediaQuery">
  <div [class.animate]="!reducedMotion.matches()">
    Animated content (respects user preference)
  </div>
</div>
```

#### Multiple Queries

```typescript
@Component({
  template: `
    <div [ngSwitch]="deviceClass()">
      <div *ngSwitchCase="'mobile'">Mobile layout</div>
      <div *ngSwitchCase="'tablet'">Tablet layout</div>
      <div *ngSwitchCase="'desktop'">Desktop layout</div>
    </div>
  `,
})
export class ResponsiveLayoutComponent {
  readonly mobile = viewChild(CngxMediaQuery);
  readonly tablet = viewChild(CngxMediaQuery);

  deviceClass = computed(() => {
    if (this.mobile()?.matches()) return 'mobile';
    if (this.tablet()?.matches()) return 'tablet';
    return 'desktop';
  });
}
```

Implement with template directives:

```html
<!-- Check width breakpoints -->
<div cngxMediaQuery="(max-width: 599px)" #mobile="cngxMediaQuery"></div>
<div cngxMediaQuery="(min-width: 600px) and (max-width: 1199px)" #tablet="cngxMediaQuery"></div>
<div cngxMediaQuery="(min-width: 1200px)" #desktop="cngxMediaQuery"></div>

@if (mobile.matches()) { Mobile }
@else if (tablet.matches()) { Tablet }
@else { Desktop }
```

---

## Accessibility

Observer utilities are fully accessible:

- **ARIA roles:** Observers do not add roles (purely behavioral). Host elements retain natural semantics.
- **Keyboard interaction:** Observers do not intercept keyboard events. Native scroll, resize, and media query behavior is preserved.
- **Screen reader:** `CngxMediaQuery` detects `prefers-reduced-motion` and `prefers-color-scheme` which screen readers can announce via system settings. Resize observer changes are not announced automatically (consumer should provide ARIA updates if needed).
- **Focus management:** No focus changes from observers. Scroll behavior and layout shifts are managed by the consumer.

## Composition

Observer utilities are standalone and compose with higher-level directives:

- **Host directives:** None (all are standalone).
- **Combines with:** `CngxInfiniteScroll` (uses `CngxIntersectionObserver` internally), `CngxDrawer` (pair with `CngxMediaQuery` for responsive modes), `CngxStickyHeader` (uses `CngxIntersectionObserver` internally).
- **Provides:** No injectable tokens.

### Example: Responsive Component Using All Observers

```typescript
@Component({
  selector: 'app-responsive-widget',
  template: `
    <div cngxResizeObserver #ro="cngxResizeObserver"
         cngxIntersectionObserver #io="cngxIntersectionObserver"
         [class.compact]="isCompact()"
         [class.visible]="io.isIntersecting()"
         (entered)="onEnter()">
      <h3>Responsive Widget</h3>
      <p>Width: {{ ro.width() }}px</p>
      <p>Visible: {{ io.isIntersecting() }}</p>
      <p>Intersection: {{ (io.intersectionRatio() * 100) | number:'1.0-0' }}%</p>
    </div>

    <!-- Media query context selector -->
    <div cngxMediaQuery="(max-width: 600px)" #compact="cngxMediaQuery"></div>
  `,
  imports: [CngxResizeObserver, CngxIntersectionObserver, CngxMediaQuery],
})
export class ResponsiveWidgetComponent {
  readonly compact = viewChild(CngxMediaQuery);
  readonly ro = viewChild(CngxResizeObserver);
  readonly io = viewChild(CngxIntersectionObserver);

  readonly isCompact = computed(() => (this.compact()?.matches() ?? false) || (this.ro()?.width() ?? 0) < 300);

  onEnter() {
    console.log('Widget entered viewport');
  }
}
```

## Styling

Observers are behavioral only — no default styling. CSS custom properties are available for consumer use.

### Variables

Observers do not define CSS custom properties. Use inline styles or standard CSS for the observed elements.

## Examples

### Image Gallery with Lazy Loading

```typescript
@Component({
  selector: 'app-image-gallery',
  template: `
    <div class="gallery">
      @for (image of images(); track image.id) {
        <img cngxIntersectionObserver #io="cngxIntersectionObserver"
             [src]="io.isIntersecting() ? image.src : 'placeholder.svg'"
             [alt]="image.alt"
             loading="lazy" />
      }
    </div>
  `,
  imports: [CngxIntersectionObserver],
})
export class ImageGalleryComponent {
  readonly images = signal([
    { id: 1, src: '/img1.jpg', alt: 'Image 1' },
    { id: 2, src: '/img2.jpg', alt: 'Image 2' },
  ]);
}
```

### Responsive Table

```typescript
@Component({
  selector: 'app-responsive-table',
  template: `
    <div cngxResizeObserver #ro="cngxResizeObserver" class="table-container">
      <table [class.compact]="ro.width() && ro.width() < 800">
        <!-- Table content -->
      </table>
    </div>
  `,
  imports: [CngxResizeObserver],
})
export class ResponsiveTableComponent {}
```

## See Also

- [compodoc API documentation](http://localhost:4200/docs/common/layout)
- Demo: `dev-app/src/app/demos/common/observers-demo/`
- Tests: `projects/common/layout/src/observers/*.spec.ts`
- `CngxScrollSpy` in `@cngx/common/layout` — Uses `CngxIntersectionObserver` internally
- `CngxTruncate` in `@cngx/common/layout` — Uses `CngxResizeObserver` internally
- [MDN: IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [MDN: Window.matchMedia()](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)
