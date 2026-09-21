# Observer System

Low-level observer directives wrapping native browser APIs. Use for reactive size tracking, viewport visibility, and media query changes. All observers expose state as Angular signals. For media queries there is also an inject-form factory - `injectMediaQuery` - for use where no host element exists.

Three of them answer "how wide is it", and the difference matters:

| Directive | Axis | Reach for it when |
|-|-|-|
| `CngxContainer` / `injectContainerSize` | The container's own inline size | A component adapts to the space it was given. This is the default for in-flow layout. |
| `CngxResizeObserver` | The host element's box | You need the raw `ResizeObserverEntry` (canvas sizing, measurement). |
| `CngxMediaQuery` / `injectMediaQuery` | The viewport | Overlay modality only: a popover becoming a bottom sheet, a dialog going full-screen. |

## Import

```typescript
import {
  CngxContainer,
  CngxIntersectionObserver,
  CngxResizeObserver,
  CngxMediaQuery,
  injectContainerSize,
  injectMediaQuery,
  observeResize,
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

## CngxIntersectionObserver

Observes whether the host element is visible in the viewport or a scroll container using the `IntersectionObserver` API. Exposes visibility state as Angular signals.

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

## CngxResizeObserver

Observes size changes of the host element via the `ResizeObserver` API. Exposes dimensions as Angular signals for responsive component logic in TypeScript.

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

## CngxMediaQuery

Reactive media query directive that exposes a `matches` signal. Wraps `window.matchMedia()` with automatic cleanup. Use for responsive layouts, drawer mode switching, and conditional rendering.

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

## injectMediaQuery

The inject-form of `CngxMediaQuery`. Returns a reactive `Signal<boolean>` that reflects whether the host window matches a CSS media query - **without needing a host element**. Use it where the directive has nowhere to attach: inside a route guard, a store, a `computed()`, or any injection context that reacts to a viewport or preference query. For host-bound templates, prefer the `[cngxMediaQuery]` directive; for pure styling, prefer CSS `@media` / `@container`.

Same lifecycle as the directive: seeds from `MediaQueryList.matches`, updates on the `change` event, and removes the listener via `DestroyRef` when the injection scope is destroyed. SSR-safe - in non-DOM environments (no `defaultView` or no `matchMedia`) it returns a static `false` signal and wires no listener, so the same code runs on the server without throwing. Returns a `Signal<boolean>`, never an `Observable`.

### In a component field

```typescript
import { Component, computed } from '@angular/core';
import { injectMediaQuery } from '@cngx/common/layout';

@Component({ /* … */ })
export class Dashboard {
  private readonly compact = injectMediaQuery('(max-width: 640px)');
  protected readonly layout = computed(() => (this.compact() ? 'stacked' : 'grid'));
}
```

### In a store (no host element)

```typescript
import { Injectable, computed } from '@angular/core';
import { injectMediaQuery } from '@cngx/common/layout';

@Injectable({ providedIn: 'root' })
export class ViewportStore {
  private readonly mobile = injectMediaQuery('(max-width: 639px)');
  private readonly tablet = injectMediaQuery('(min-width: 640px) and (max-width: 1023px)');
  readonly deviceClass = computed(() =>
    this.mobile() ? 'mobile' : this.tablet() ? 'tablet' : 'desktop',
  );
}
```

### In a route guard

```typescript
import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { injectMediaQuery } from '@cngx/common/layout';

// Send narrow viewports to the mobile-optimised route.
export const desktopOnlyGuard: CanActivateFn = () => {
  const compact = injectMediaQuery('(max-width: 640px)');
  return compact() ? inject(Router).parseUrl('/m/dashboard') : true;
};
```

## CngxContainer

Declares the host as an inline-size query container and publishes its size to descendants through `CNGX_CONTAINER_SIZE`. Read it with `injectContainerSize()`.

### CSS decides, JS reads the property

The point of the directive is *not* to move breakpoints into TypeScript. The breakpoint stays in the stylesheet, once; the `@container` rule writes a custom property, and the component reads the resolved value. TypeScript never parses a CSS length and never re-evaluates the condition, so a consumer who ejects the skin changes the threshold in one place.

```css
cngx-thing-layout {
  container-name: cngx-thing-layout;
}

cngx-thing-layout > cngx-thing {
  --cngx-thing-wide: 0;
}

@container cngx-thing-layout (min-inline-size: 64rem) {
  cngx-thing-layout > cngx-thing {
    --cngx-thing-wide: 1;
  }
}
```

```typescript
private readonly container = inject(CNGX_CONTAINER_SIZE, { optional: true });
private readonly host = inject(ElementRef<Element>).nativeElement;

private readonly wide =
  this.container?.property('--cngx-thing-wide', this.host) ?? signal('').asReadonly();

readonly mode = computed(() => (this.wide() === '1' ? 'side' : 'over'));
```

**The rule must style a descendant, never the container itself.** A container query resolves against an *ancestor* query container of the element it styles, so a rule whose subject is the container element matches nothing and the property never changes. Pass that descendant as the second argument to `property()`.

### Surface

| Member | Type | Notes |
|-|-|-|
| `inlineSize` | `Signal<number>` | Border-box inline size, `0` before the first observation. |
| `blockSize` | `Signal<number>` | Border-box block size, `0` before the first observation. |
| `isReady` | `Signal<boolean>` | `true` once the first observation arrived. |
| `property(name, on?)` | `Signal<string>` | Resolved custom property, re-read on every resize. Memoized per `(target, name)`. |

The directive sets `container-type` only. The container **name belongs in the stylesheet** next to the rules that query it: an unnamed `@container` matches the nearest container of any name, so a consumer wrapping the component in their own container would silently re-target the query.

`container-type: inline-size` applies size containment. An element that must shrink-wrap its content (an inline chip, a `width: max-content` bar) must not be a container.

Before the first observation `property()` returns the empty string, so a component takes its narrow branch for that first frame. The observer's initial callback runs after layout and before paint, so nothing flashes; seeding the value synchronously in a constructor would read before the first layout and return the wrong answer.

See `core-concepts/responsive-by-default.md` for the full contract, including the rem tier table.

## observeResize / createResizeSignal

The kernel behind `CngxResizeObserver` and `CngxContainer`, mirroring `observeMediaQuery` / `createMediaQuerySignal` in `@cngx/core/utils`. Reach for it when a component needs resize observation without a host directive.

```typescript
// Low-level: re-wire per effect run when the target or box is reactive.
effect((onCleanup) => {
  onCleanup(observeResize(win, el, this.box(), (entry) => this.entry.set(entry)));
});

// Signal form: teardown owned by DestroyRef.
const entry = createResizeSignal(el, 'border-box', inject(DestroyRef), win);
```

Both no-op on a host without `ResizeObserver` (SSR, jsdom) rather than throwing.

## Accessibility

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

Observers are behavioral only - no default styling. CSS custom properties are available for consumer use.

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

- [compodocx API documentation](https://cngxjs.github.io/cngx/)
- Demo: `examples/stories/common/observers-demo/`
- Tests: `projects/common/layout/observers/*.spec.ts`
- `CngxScrollSpy` in `@cngx/common/layout` - Uses `CngxIntersectionObserver` internally
- `CngxTruncate` in `@cngx/common/layout` - Uses `CngxResizeObserver` internally
- [MDN: IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)
- [MDN: Window.matchMedia()](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia)
