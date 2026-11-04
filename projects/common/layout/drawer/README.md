# Drawer System

Complete drawer control with state management, focus trapping, and backdrop handling. Supports both controlled and uncontrolled modes with multiple interaction patterns and accessibility built in.

A drawer is always transient: `over` overlays the content, `push` lays the panel out next to it. A panel that stays visible is a sidebar, not a drawer.

## Import

```typescript
import {
  CngxDrawer,
  CngxDrawerPanel,
  CngxDrawerContent,
  CngxBackdrop,
  type DrawerPosition,
  type DrawerMode,
} from '@cngx/common/layout';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxDrawer, CngxDrawerPanel, CngxDrawerContent, CngxBackdrop } from '@cngx/common/layout';

@Component({
  selector: 'app-drawer-example',
  template: `
    <div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()">
      <!-- Backdrop -->
      <div [cngxBackdrop]="drawer.opened()"
           (backdropClick)="drawer.close()"
           class="my-backdrop"></div>

      <!-- Panel (sidebar) -->
      <nav [cngxDrawerPanel]="drawer"
           position="left"
           mode="over">
        <button (click)="drawer.close()">Close</button>
        <a href="/home">Home</a>
        <a href="/about">About</a>
      </nav>

      <!-- Content area -->
      <main [cngxDrawerContent]="drawer">
        <button (click)="drawer.toggle()">Menu</button>
        <p>Page content here</p>
      </main>
    </div>
  `,
  imports: [CngxDrawer, CngxDrawerPanel, CngxDrawerContent, CngxBackdrop],
})
export class DrawerExampleComponent {}
```

## Accessibility

- **Transient surface:** an open panel runs on `CngxDrawerSurface`. Escape (focus inside the panel), the Android back gesture (`CloseWatcher`) and a press outside the panel close the drawer. A press on the trigger whose `aria-controls` names the panel `id` is not outside, so give the toggle `aria-controls` and the panel an `id`.
- **Modality:** `[modal]` defaults to `mode === 'over'`. A modal open panel traps focus (`CngxFocusTrap`), renders `role="dialog"` + `aria-modal="true"`, makes everything outside it `inert` up to `<body>` like a modal dialog (focus-trap anchors, live regions, the CDK overlay container, the toast and banner outlets and a visible `CngxBackdrop` stay live; a pre-existing `inert` is kept on release) and locks scrolling on the nearest scroll container above it, else the document root. A non-modal panel keeps the page operable and renders its landmark `role` (default `complementary`). `push` is never modal; `[modal]="true"` with `push` warns `CNGX1075`.
- **Closed state:** the panel is `aria-hidden` and `inert` while closed, so its controls are unreachable for keyboard and AT.
- **Focus management:** focus moves into a modal panel on open and returns to the element focused at open when the drawer closes, unless the user moved focus elsewhere.

## Composition

The drawer system integrates with:

- **Host directives:** `CngxDrawerPanel` composes `CngxDrawerSurface`, which composes `CngxFocusTrap`, `CngxFocusRestore` and `CngxClickOutside` and drives them; none of their inputs is re-exposed.
- **Combines with:** `CngxBackdrop` (visual overlay and sibling inert toggling).
- **Provides:** No injectable tokens (all state is passed via inputs). A bare `cngxDrawerPanel` attribute on an element that also carries `cngxDrawer` resolves that drawer.

### Example: Full Drawer with Scroll Lock

```typescript
// Prevent body scroll when drawer is open
<div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()">
  <div [cngxBackdrop]="drawer.opened()"
       (backdropClick)="drawer.close()"
       class="drawer-backdrop"></div>
  <nav [cngxDrawerPanel]="drawer"
       position="left"
       mode="over">
    <!-- Navigation items -->
  </nav>
  <main [cngxDrawerContent]="drawer">
    <!-- Page content -->
  </main>
</div>
```

### Example: Controlled Drawer

```typescript
readonly isOpen = signal(false);

// Control via signal
<div cngxDrawer
     [cngxDrawerOpened]="isOpen()"
     (openedChange)="isOpen.set($event)">
  <!-- Panel and content -->
</div>
```

## Styling

All colors and spacing use CSS Custom Properties with Material 3 defaults. The drawer itself is unstyled - the consumer is responsible for positioning, sizing, and animations.

### Variables

Consumer-provided CSS should cover:

- `--cngx-drawer-panel-width` - Width of a left/right drawer (e.g., `320px`)
- `--cngx-drawer-panel-height` - Height of a top/bottom drawer (e.g., `200px`)
- `--cngx-drawer-panel-shadow` - Shadow when in `'over'` mode
- `--cngx-drawer-panel-z-index` - Z-index of the panel (e.g., `100`)
- `--cngx-backdrop-color` - Background color of the backdrop (e.g., `rgba(0, 0, 0, 0.5)`)
- `--cngx-sticky-z-index` - Z-index for sticky positioning (default `1`)

### Example CSS

```scss
// Drawer panel styling
nav[cngxDrawerPanel] {
  position: fixed;
  background: var(--cngx-drawer-panel-bg, #fff);
  box-shadow: var(--cngx-drawer-panel-shadow, 0 2px 8px rgba(0, 0, 0, 0.1));
  transition: transform 0.3s ease;
  width: var(--cngx-drawer-panel-width, 320px);
  z-index: var(--cngx-drawer-panel-z-index, 100);

  &.cngx-drawer-panel--left {
    inset: 0 auto 0 0;
    transform: translateX(-100%);

    &.cngx-drawer-panel--open {
      transform: translateX(0);
    }
  }

  &.cngx-drawer-panel--over {
    position: fixed;
  }

  &.cngx-drawer-panel--push {
    position: relative;
  }

}

// Content offset
main[cngxDrawerContent] {
  transition: margin-left 0.3s ease;

  &.cngx-drawer-content--shifted {
    margin-left: var(--cngx-drawer-panel-width, 320px);
  }
}

// Backdrop styling
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: var(--cngx-backdrop-color, rgba(0, 0, 0, 0.5));
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease;

  &.cngx-backdrop--visible {
    opacity: 1;
    pointer-events: auto;
  }
}
```

## Examples

### Responsive Drawer (Over/Push Toggle)

```typescript
@Component({
  selector: 'app-responsive-drawer',
  template: `
    <div cngxDrawer #drawer="cngxDrawer"
         cngxMediaQuery="(min-width: 1024px)" #mq="cngxMediaQuery"
         [cngxScrollLock]="drawer.opened() && !mq.matches()">
      <div [cngxBackdrop]="drawer.opened() && !mq.matches()"
           (backdropClick)="drawer.close()"></div>
      <nav [cngxDrawerPanel]="drawer"
           [mode]="mq.matches() ? 'push' : 'over'"
           [closeOnClickOutside]="!mq.matches()">
        <!-- Navigation -->
      </nav>
      <main [cngxDrawerContent]="drawer">
        <!-- Content -->
      </main>
    </div>
  `,
  imports: [CngxDrawer, CngxDrawerPanel, CngxDrawerContent, CngxBackdrop, CngxMediaQuery],
})
export class ResponsiveDrawerComponent {}
```

### Modal Drawer (Focus Trap + Escape Close)

`mode="over"` is modal by default; the panel traps focus and locks scrolling on its own.

```typescript
<div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()">
  <div [cngxBackdrop]="drawer.opened()"
       (backdropClick)="drawer.close()"
       role="presentation"
       class="modal-backdrop"></div>
  <aside [cngxDrawerPanel]="drawer"
         position="right"
         mode="over">
    <h2>Dialog Title</h2>
    <p>Dialog content</p>
    <button (click)="drawer.close()">Close</button>
  </aside>
</div>
```

### Push-Mode Drawer (Content Shifts)

```typescript
<div cngxDrawer #drawer="cngxDrawer">
  <nav [cngxDrawerPanel]="drawer"
       position="left"
       mode="push">
    <!-- Navigation links -->
  </nav>
  <main [cngxDrawerContent]="drawer">
    <!-- Content shifts right when drawer opens -->
  </main>
</div>
```

## See Also

- [compodocx API documentation](https://cngxjs.github.io/cngx/)
- Demo: `examples/stories/common/drawer-demo/`
- Tests: `projects/common/layout/drawer/*.spec.ts`
- `CngxDrawerSurface` in `@cngx/common/layout` - Composed by `CngxDrawerPanel`
- `CngxScrollLock` in `@cngx/common/layout` - Pair with drawer to prevent scrolling
