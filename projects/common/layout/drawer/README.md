# Drawer System

Complete drawer/sidebar control with state management, focus trapping, and backdrop handling. Supports both controlled and uncontrolled modes with multiple interaction patterns and accessibility built in.

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
           mode="over"
           [enabled]="drawer.opened()"
           [autoFocus]="true">
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

The drawer system is fully accessible out of the box:

- **ARIA roles:** Panel marked as `role="complementary"`. Backdrop is `aria-hidden`. Content has no special role, allowing natural semantic flow.
- **Keyboard interaction:**
  - `Escape` - Closes the drawer (handled by `CngxDrawer`)
  - Arrow keys - Managed by `CngxFocusTrap` (if enabled)
  - Tab - Trapped within the panel when open (via `CngxFocusTrap`)
- **Screen reader:** Siblings are marked `inert` when backdrop is visible, preventing SR navigation behind the overlay. Focus is automatically trapped and restored.
- **Focus management:** `CngxFocusTrap` (composed by `CngxDrawerPanel`) handles focus on open and restoration on close. Set `[autoFocus]` to control the focus target.

## Composition

The drawer system integrates with:

- **Host directives:** `CngxDrawerPanel` composes `CngxFocusTrap` for automatic focus management.
- **Combines with:** `CngxScrollLock` (prevent scrolling when drawer is open), `CngxBackdrop` (visual overlay and sibling inert toggling).
- **Provides:** No injectable tokens (all state is passed via inputs).

### Example: Full Drawer with Scroll Lock

```typescript
// Prevent body scroll when drawer is open
<div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()">
  <div [cngxBackdrop]="drawer.opened()"
       (backdropClick)="drawer.close()"
       class="drawer-backdrop"></div>
  <nav [cngxDrawerPanel]="drawer"
       position="left"
       mode="over"
       [enabled]="drawer.opened()">
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

  &.cngx-drawer-panel--side {
    position: relative;
    box-shadow: none;
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

### Responsive Drawer (Over/Side Toggle)

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
           [mode]="mq.matches() ? 'side' : 'over'"
           [closeOnClickOutside]="!mq.matches()"
           [enabled]="drawer.opened()"
           [autoFocus]="true">
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

```typescript
<div cngxDrawer #drawer="cngxDrawer" [cngxScrollLock]="drawer.opened()">
  <div [cngxBackdrop]="drawer.opened()"
       (backdropClick)="drawer.close()"
       role="presentation"
       class="modal-backdrop"></div>
  <aside [cngxDrawerPanel]="drawer"
         position="right"
         mode="over"
         [enabled]="drawer.opened()"
         [autoFocus]="'first-focusable'">
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
       mode="push"
       [enabled]="drawer.opened()">
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
- `CngxFocusTrap` in `@cngx/common/a11y` - Composed by `CngxDrawerPanel`
- `CngxScrollLock` in `@cngx/common/layout` - Pair with drawer to prevent scrolling
