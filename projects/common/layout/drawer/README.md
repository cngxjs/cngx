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
  type CngxDrawerModality,
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
- **Modality:** `modality` is `'page'`, `'contained'` or `'none'`; unbound, `over` is `'page'` and `push` is `'none'`.
  - `'page'` (full-height drawer over the app header): the open panel traps focus (`CngxFocusTrap`), renders `role="dialog"` + `aria-modal="true"` named by `label` (else a static `aria-label` / `aria-labelledby` on the panel, else `CNGX_LAYOUT_I18N.drawerDialog`), makes everything outside it `inert` up to `<body>` like a modal dialog and locks scrolling on the nearest scroll container above it, else the document root.
  - `'contained'` (clipped drawer below a live app header): `inert` and scroll lock stay inside the `[cngxDrawer]` host; everything outside the host stays live, and the element whose `aria-controls` names the panel is never inerted. No trap and no `aria-modal`; the panel keeps its landmark `role`, focus moves into it on open and Tab can reach the header. Put the header outside the `[cngxDrawer]` host.
  - `'none'`: the page stays operable and the panel renders its landmark `role` (default `complementary`).
  - In every modality focus-trap anchors, live regions, the CDK overlay container, the toast and banner outlets and a visible `CngxBackdrop` stay live, and a pre-existing `inert` is kept on release. `push` is never modal; `'page'` or `'contained'` with `push` resolve to `'none'` and warn `CNGX1075`.
- **Closed state:** the panel is `aria-hidden` and `inert` while closed, so its controls are unreachable for keyboard and AT.
- **Focus management:** focus moves into a `page` or `contained` panel on open and returns to the element focused at open when the drawer closes, unless the user moved focus elsewhere. A restore target that another owner (a `CngxBackdrop`) still holds `inert` is focused after the release.
- **Scrim:** add the `cngx-drawer` class to the `[cngxDrawer]` host and the bundled `cngx-drawer.css` paints a scrim over the host while a `page` or `contained` panel is open (`--cngx-drawer-scrim-bg`, default `--cngx-backdrop-bg`; `--cngx-drawer-scrim-z-index`, default `1`; `--cngx-drawer-scrim-duration`). A press on the scrim closes the drawer. Position the panel above the scrim with a higher `z-index`.

## Composition

The drawer system integrates with:

- **Host directives:** `CngxDrawerPanel` composes `CngxDrawerSurface`, which composes `CngxFocusTrap`, `CngxFocusRestore` and `CngxClickOutside` and drives them; none of their inputs is re-exposed.
- **Combines with:** `CngxBackdrop` (visual overlay and sibling inert toggling) when the scrim must live outside the drawer host; otherwise the `cngx-drawer` class is enough.
- **Provides:** `CngxDrawer` provides `CNGX_PANEL_TARGET` and `CNGX_DRAWER_HOST` (`useExisting`). The panel reads its drawer through the `CngxDrawerHost` contract (`opened`, `panelId`, `elementRef`, `close()`, `connectPanel()`), bound explicitly (`[cngxDrawerPanel]="drawer"`) or, on a bare `cngxDrawerPanel` attribute next to `cngxDrawer`, from `CNGX_DRAWER_HOST`. Any state owner that implements the contract can drive a panel.
- **Escape:** inside the open panel, the panel's surface closes the drawer; elsewhere in the `[cngxDrawer]` host, the drawer closes itself. One keypress closes once, controlled or not.
- **Standalone surface:** `[cngxDrawerSurface]` works without a drawer: bind `[active]`, handle `(dismiss)`, and pass `[role]="null"` on a `<nav>` / `<aside>` host to keep its implicit role.

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

### Clipped Drawer Below a Live Header

The header sits outside the `[cngxDrawer]` host, so the contained panel leaves it live; the hamburger stays the toggle. `button[cngxPanelToggle]` is the icon-button form of `cngxPanelTrigger` with its own glyph: three bars and a cross on a modal over-drawer like this one, a panel frame for a push or non-modal drawer, with a chevron that points away from the panel column while closed and toward it while open. The glyph follows the panel's live `mode` and modality, so a breakpoint that switches `mode` switches it too. The toggle's name does not change with the state: bind `label` (a drawer gives its trigger no name, so it falls back to `CNGX_LAYOUT_I18N.panelTrigger`), and `aria-expanded` reports whether the panel is open.

```typescript
<header>
  <button type="button" [cngxPanelToggle]="drawer" label="Main navigation"></button>
</header>
<div cngxDrawer #drawer="cngxDrawer" panelId="app-nav" class="cngx-drawer">
  <nav [cngxDrawerPanel]="drawer" modality="contained" [role]="null" aria-label="Main">
    <!-- Navigation links -->
  </nav>
  <main [cngxDrawerContent]="drawer"><!-- Content under the scrim --></main>
</div>
```

### Modal Drawer (Focus Trap + Escape Close)

`mode="over"` is page-modal by default; the panel traps focus and locks scrolling on its own.

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
