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
import { Component, signal } from '@angular/core';
import { CngxNavLink } from '@cngx/common';
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
    CngxNavLink,
  ],
})
export class ExampleComponent {
  navOpen = signal(false);
}
```

## Overview

`CngxSidenav` is a composable sidebar component that handles drawer behavior, keyboard shortcuts, responsive mode switching, and optional resize functionality. It coordinates with `CngxSidenavLayout` for backdrop and scroll-lock management.

Key features:

- **Mode switching:** `over` (overlay), `push` (nudges content), `side` (permanent), `mini` (collapsed icon rail; hover expands after a tunable dwell via `[expandDelay]` / `[collapseDelay]`)
- **Responsive:** Media query-driven mode override via `[responsive]` input
- **Two-way binding:** `[(opened)]` synchronizes with external state
- **Resize:** Optional drag handle with min/max constraints
- **Keyboard:** Escape closes overlay, configurable global shortcut via `[shortcut]`
- **RTL-aware:** `position="start"` / `"end"` flip logically in RTL
- **Deep-linking:** persist open state to a URL query param via `[cngxSidenavRouterSync]` (see [Deep-linking](#deep-linking-router-sync))
- **App-wide defaults:** `CNGX_SIDENAV_CONFIG` cascade for dimensions, responsive query, shortcut, hover dwell, and router-sync param (see [Configuration](#configuration))

## Configuration

Every dimension default, the responsive query, the toggle shortcut, and the mini hover dwell resolve through a standard cascade. Per-instance bindings always win; unset keys fall back to the library defaults, so an unconfigured `<cngx-sidenav>` behaves exactly as before.

Resolution priority (high to low):

1. Per-instance input (`[width]`, `[shortcut]`, `[expandDelay]`, ...)
2. `provideSidenavConfigAt(...)` in a component's `viewProviders` (sub-tree scope)
3. `provideSidenavConfig(...)` at the application root
4. Library defaults

```typescript
import {
  provideSidenavConfig,
  withSidenavDimensions,
  withSidenavResponsive,
  withSidenavShortcut,
  withSidenavHoverDwell,
} from '@cngx/ui';

bootstrapApplication(AppComponent, {
  providers: [
    provideSidenavConfig(
      withSidenavDimensions({ width: '320px', miniWidth: '64px' }),
      withSidenavResponsive('(min-width: 1024px)'),
      withSidenavShortcut('mod+b'),
      withSidenavHoverDwell({ enterDelay: 200, leaveDelay: 150 }),
    ),
  ],
});
```

| Feature | Overrides |
|-|-|
| `withSidenavDimensions({ width?, miniWidth?, minWidth?, maxWidth? })` | Panel dimensions |
| `withSidenavResponsive(query)` | Default responsive media query |
| `withSidenavShortcut(combo)` | Default toggle shortcut |
| `withSidenavHoverDwell({ enterDelay?, leaveDelay? })` | Mini expand/collapse dwell (ms) |
| `withSidenavRouterSync({ param })` | Default deep-link query-param key |

Read the resolved config in an injection context with `injectSidenavConfig()`. Scope overrides to a sub-tree with `provideSidenavConfigAt(...)` in a component's `viewProviders`.

### Mini hover dwell

In `mini` mode the rail expands only after the pointer rests for `expandDelay` ms and collapses after `collapseDelay` ms, so a sweep across the rail never expands it. Both are tunable per instance and app-wide:

```html
<cngx-sidenav mode="mini" [expandDelay]="250" [collapseDelay]="150">...</cngx-sidenav>
```

Defaults are `expandDelay` 120ms and `collapseDelay` 0ms (instant collapse). The app-wide default is `withSidenavHoverDwell({ enterDelay, leaveDelay })`; per-instance `[expandDelay]` / `[collapseDelay]` win over it.

## Deep-linking (router sync)

Add `[cngxSidenavRouterSync]` to a `<cngx-sidenav>` to persist its open state in a URL query param. Opening writes `?nav=open`, an initial `?nav=open` restores it open on load, closing removes the param, and browser back/forward re-hydrates it. The directive reaches the rail through the `CNGX_SIDENAV` contract token and delegates to `injectQueryParamSync` from `@cngx/common/layout`.

```typescript
import {
  CngxSidenav,
  CngxSidenavLayout,
  CngxSidenavContent,
  CngxSidenavRouterSync,
} from '@cngx/ui';
```

```html
<cngx-sidenav cngxSidenavRouterSync position="start" mode="over" [(opened)]="navOpen">
  ...
</cngx-sidenav>
```

The query-param key defaults to `nav`. Override it per instance with `[param]`, or move the app-wide default through the config cascade:

```typescript
import { provideSidenavConfig, withSidenavRouterSync } from '@cngx/ui';

provideSidenavConfig(withSidenavRouterSync({ param: 'menu' }));
```

Resolution order for the key: per-instance `[param]` beats `withSidenavRouterSync({ param })`, which beats the `nav` literal. `router.navigate` rejections surface on the directive's `(syncError)` output. Without `@angular/router` the directive dev-warns once and no-ops.

## Accessibility

- **ARIA roles:** Sidebar carries `role="complementary"` with optional `[attr.aria-label]`. In overlay mode, `aria-hidden="true"` when closed.
- **Keyboard interaction:**
  - `Escape` - Closes overlay mode sidenav
  - Custom shortcut (if configured) - Toggles opened state globally
- **Screen reader:** Complementary landmark announces the sidebar label; scroll lock prevents reading body content when sidebar is open in overlay.
- **Focus management:** In overlay (`over`) mode a CDK focus trap keeps Tab within the rail while open, moves focus into the rail on open, and restores focus to the element that opened it on close.

## Composition

`CngxSidenav` composes these atoms internally:

- **Responsive media query:** Inline `matchMedia` listener wired to `mediaMatches` signal
- **Keyboard shortcut:** Global document listener via `effect(onCleanup)`
- **Scroll lock:** Coordinate with `CngxSidenavLayout` via `hasOverlay` computed
- **Resize:** Pointer-capture drag with RAFed position updates
- **Mini hover intent:** Debounced expand-on-hover via the composed `CngxHoverIntent` host directive (`@cngx/common/interactive`), reading `CNGX_HOVER_INTENT_DEFAULTS` from the resolved config


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
