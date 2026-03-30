# CngxSidenav

Declarative sidebar component supporting responsive mode switching, two-way opened binding, and content projection.

## Import

```typescript
import {
  CngxSidenav,
  CngxSidenavLayout,
  CngxSidenavContent,
  CngxSidenavHeader,
  CngxSidenavFooter,
} from '@cngx/ui';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import {
  CngxSidenav,
  CngxSidenavLayout,
  CngxSidenavContent,
  CngxSidenavHeader,
  CngxSidenavFooter,
} from '@cngx/ui';

@Component({
  selector: 'app-example',
  template: `
    <cngx-sidenav-layout>
      <cngx-sidenav position="start" [(opened)]="navOpen"
                    [responsive]="'(min-width: 1024px)'">
        <cngx-sidenav-header>Logo</cngx-sidenav-header>
        <a cngxNavLink [active]="true">Dashboard</a>
        <cngx-sidenav-footer>v1.0</cngx-sidenav-footer>
      </cngx-sidenav>
      <cngx-sidenav-content>
        <router-outlet />
      </cngx-sidenav-content>
    </cngx-sidenav-layout>
  `,
  imports: [
    CngxSidenav,
    CngxSidenavLayout,
    CngxSidenavContent,
    CngxSidenavHeader,
    CngxSidenavFooter,
  ],
})
export class ExampleComponent {
  navOpen = signal(false);
}
```

## Overview

`CngxSidenav` is a composable sidebar component that handles drawer behavior, keyboard shortcuts, responsive mode switching, and optional resize functionality. It coordinates with `CngxSidenavLayout` for backdrop and scroll-lock management.

Key features:
- **Mode switching:** `over` (overlay), `push` (nudges content), `side` (permanent), `mini` (collapsed icon rail with hover expand)
- **Responsive:** Media query-driven mode override via `[responsive]` input
- **Two-way binding:** `[(opened)]` synchronizes with external state
- **Resize:** Optional drag handle with min/max constraints
- **Keyboard:** Escape closes overlay, configurable global shortcut via `[shortcut]`
- **RTL-aware:** `position="start"` / `"end"` flip logically in RTL

## Components

### CngxSidenav

Main sidebar component.

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| position | `'start' \| 'end'` | `'start'` | Logical position — flips in RTL. |
| ariaLabel | `string \| undefined` | `undefined` | Accessible label for the complementary landmark. |
| mode | `'over' \| 'push' \| 'side' \| 'mini'` | `'over'` | Drawer mode. Overridden by `responsive` when set. |
| responsive | `string \| undefined` | `undefined` | CSS media query for responsive mode switching. When matched, mode becomes `'side'`. When not matched, falls back to `mode` input. |
| width | `string` (model) | `'280px'` | Sidenav panel width. Supports two-way `[(width)]` for resize synchronization. |
| miniWidth | `string` | `'56px'` | Width of the collapsed rail in `mini` mode. |
| expandOnHover | `boolean` | `true` | Whether hovering the mini rail expands to full width. |
| resizable | `boolean` | `false` | Enable user-resizable drag handle. |
| minWidth | `string` | `'120px'` | Minimum width constraint during resize. |
| maxWidth | `string` | `'600px'` | Maximum width constraint during resize. |
| shortcut | `string \| undefined` | `undefined` | Keyboard shortcut to toggle opened, e.g., `'ctrl+b'` or `'meta+b'`. Uses `ctrl` on Windows/Linux, `meta` (Cmd) on macOS when `'mod+<key>'` syntax is used. |
| opened | `boolean` (model) | `false` | Two-way opened state. Supports `[(opened)]="signal"`. |

#### Methods
- `open(): void` — Opens the sidenav.
- `close(): void` — Closes the sidenav (only in over/push mode; no-op in side/mini mode).
- `toggle(): void` — Toggles the opened state.
- `expand(): void` — Expands the mini rail to full width.
- `collapse(): void` — Collapses the expanded mini rail back to miniWidth.

#### Signals
- `effectiveMode: Signal<SidenavMode>` — Resolved mode; responsive query overrides the `mode` input.
- `isOverlay: Signal<boolean>` — Whether current mode is `'over'` (overlay).
- `expanded: Signal<boolean>` — Whether the mini-mode rail is currently expanded.
- `resizing: Signal<boolean>` — Whether a resize drag is in progress.

### CngxSidenavLayout

Container for one or two `CngxSidenav` panels and a `CngxSidenavContent`. Manages shared backdrop, scroll lock, and click-outside coordination.

#### Inputs
None — purely compositional.

#### Signals
- `startSidenav: Signal<CngxSidenav | null>` — The start-positioned sidenav, if any.
- `endSidenav: Signal<CngxSidenav | null>` — The end-positioned sidenav, if any.
- `hasOverlay: Signal<boolean>` — Whether any sidenav is open in overlay mode.

#### Methods
- `closeAllOverlays(): void` — Closes all sidenavs currently in overlay mode.

### CngxSidenavContent

Main content area within `CngxSidenavLayout`. Auto-adjusts margins for push/side modes. Must be a direct child of `CngxSidenavLayout`.

### CngxSidenavHeader

Marks content to be projected into the sidenav's sticky header area. Can use either `<cngx-sidenav-header>` or `[cngxSidenavHeader]` attribute directive.

### CngxSidenavFooter

Marks content to be projected into the sidenav's sticky footer area. Can use either `<cngx-sidenav-footer>` or `[cngxSidenavFooter]` attribute directive.

## Accessibility

`CngxSidenav` is fully accessible:

- **ARIA roles:** Sidebar carries `role="complementary"` with optional `[attr.aria-label]`. In overlay mode, `aria-hidden="true"` when closed.
- **Keyboard interaction:**
  - `Escape` — Closes overlay mode sidenav
  - Custom shortcut (if configured) — Toggles opened state globally
- **Screen reader:** Complementary landmark announces the sidebar label; scroll lock prevents reading body content when sidebar is open in overlay.
- **Focus management:** On overlay close, focus is not automatically restored (consumer must manage).

## Composition

`CngxSidenav` composes these atoms internally:

- **Responsive media query:** Inline `matchMedia` listener wired to `mediaMatches` signal
- **Keyboard shortcut:** Global document listener via `effect(onCleanup)`
- **Scroll lock:** Coordinate with `CngxSidenavLayout` via `hasOverlay` computed
- **Resize:** Pointer-capture drag with RAFed position updates

## Styling

All dimensions and colors use CSS Custom Properties with Material 3 defaults:

```scss
// Override in your component or global styles
:host {
  --cngx-sidenav-width: 320px;
  --cngx-sidenav-transition-duration: 0.3s;
  --cngx-sidenav-bg: var(--mat-sys-surface-container, #f9fafb);
  --cngx-sidenav-color: var(--mat-sys-on-surface, #333);
}
```

## Examples

### Dual Sidebar

```typescript
<cngx-sidenav-layout>
  <cngx-sidenav position="start" [(opened)]="navOpen"
                [responsive]="'(min-width: 1024px)'">
    Left navigation
  </cngx-sidenav>
  <cngx-sidenav-content>
    Main content
  </cngx-sidenav-content>
  <cngx-sidenav position="end" [(opened)]="detailOpen">
    Right detail panel
  </cngx-sidenav>
</cngx-sidenav-layout>
```

### Responsive Mode Switching

```typescript
// On large screens (1024px+), sidebar is permanent (side mode)
// On mobile, sidebar overlays content (over mode)
<cngx-sidenav [responsive]="'(min-width: 1024px)'">
  Navigation that adapts to screen size
</cngx-sidenav>
```

### Mini Mode with Hover

```typescript
<cngx-sidenav mode="mini" [expandOnHover]="true" miniWidth="56px" width="280px">
  <ng-container *ngFor="let item of navItems">
    <svg class="nav-icon"><!-- icon --></svg>
    <span>{{ item.label }}</span>
  </ng-container>
</cngx-sidenav>
```

### Resizable Sidebar

```typescript
<cngx-sidenav [resizable]="true" [(width)]="sidenavWidth"
              minWidth="200px" maxWidth="500px">
  Content can be resized by dragging the handle
</cngx-sidenav>
```

### Keyboard Toggle

```typescript
// Cmd+B on macOS, Ctrl+B on Windows/Linux
<cngx-sidenav shortcut="mod+b" [(opened)]="navOpen">
  Toggled via keyboard shortcut
</cngx-sidenav>
```

### Sticky Header and Footer

```typescript
<cngx-sidenav>
  <cngx-sidenav-header>
    <img src="logo.svg" alt="Logo" />
  </cngx-sidenav-header>

  <!-- Scrollable content -->
  <nav>
    <a *ngFor="let item of navItems" [routerLink]="item.route">
      {{ item.label }}
    </a>
  </nav>

  <cngx-sidenav-footer>
    <small>v{{ appVersion }}</small>
  </cngx-sidenav-footer>
</cngx-sidenav>
```

## Material Theme

Include the theme SCSS files in your global stylesheet:

```scss
@use '@angular/material' as mat;
@use '@cngx/ui/sidenav/sidenav-theme' as sidenav;
@use '@cngx/ui/sidenav/nav-link-theme' as nav-link;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include sidenav.theme($theme);
  @include nav-link.theme($theme);
}
```

The theme mixin provides:
- Base spacing and timing tokens
- Material 3 system color tokens (`--mat-sys-*`) with fallback RGB values
- Material 2 palette color mappings
- Backdrop, header, and footer styling
- Support for both M3 and M2 themes (auto-detected)

## CSS Custom Properties

| Property | Default | Description |
|-|-|-|
| `--cngx-sidenav-width` | `280px` | Sidenav panel width |
| `--cngx-sidenav-mini-width` | `56px` | Collapsed rail width in mini mode |
| `--cngx-sidenav-transition-duration` | `0.25s` | Animation duration |
| `--cngx-sidenav-transition-easing` | `cubic-bezier(0.4, 0, 0.2, 1)` | Animation easing |
| `--cngx-sidenav-backdrop-opacity` | `0.5` | Overlay mode backdrop opacity |
| `--cngx-sidenav-border-width` | `1px` | Right border width |
| `--cngx-sidenav-header-height` | `auto` | Header fixed height (auto = content-sized) |
| `--cngx-sidenav-footer-height` | `auto` | Footer fixed height (auto = content-sized) |
| `--cngx-sidenav-bg` | M3 surface-container | Background color |
| `--cngx-sidenav-color` | M3 on-surface | Text color |
| `--cngx-sidenav-border-color` | M3 outline-variant | Border color |
| `--cngx-sidenav-backdrop-bg` | M3 scrim | Backdrop color |
| `--cngx-sidenav-header-bg` | M3 surface-container-low | Header background |
| `--cngx-sidenav-footer-bg` | M3 surface-container-low | Footer background |

## See Also

- [compodoc API documentation](../../../../../docs)
- Demo: `dev-app/src/app/demos/ui/sidenav-demo/`
- Tests: `projects/ui/src/lib/sidenav/sidenav.spec.ts`
