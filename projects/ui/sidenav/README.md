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
      <cngx-sidenav position="start" [(opened)]="navOpen" [responsive]="'(min-width: 1024px)'">
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

## Material Theme

Include the theme SCSS files in your global stylesheet:

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/sidenav-theme' as sidenav;
@use '@cngx/themes/material/nav-link-theme' as nav-link;

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
