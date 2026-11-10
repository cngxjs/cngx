# CngxSidenav

Declarative sidebar component. Responsive out of the box: the rail docks beside the content on a wide layout and overlays it on a narrow one, with nothing bound.

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
      <cngx-sidenav position="start" [(opened)]="navOpen">
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

`CngxSidenav` is a composable sidebar component that handles drawer behavior, keyboard shortcuts, width-driven mode switching, and optional resize functionality. An open overlay runs on a composed `CngxDrawerSurface` (focus trap, `inert`, scroll lock, dismissal); `CngxSidenavLayout` draws the backdrop.

Key features:

- **Responsive by default:** `mode` is `auto` unless you say otherwise - it follows the width class of the surrounding layout: a drawer (`over`) below `48rem`, a collapsed rail with the full nav as an overlay from `48rem`, docked (`side`) from `64rem`
- **Mode switching:** bind `mode` to pin `over` (overlay) or `side` (docked); the former push is `side` with `collapsedAs="hidden"`
- **Collapsed rail:** `[(collapsed)]` rests a docked rail as an icon rail (`collapsedAs="rail"`, `miniWidth` wide) or hides it (`collapsedAs="hidden"`); a collapsed rail peeks at full width over the content after a tunable hover dwell (`[expandDelay]` / `[collapseDelay]`). The rail is a composed `CngxSidebar` from `@cngx/common/layout`
- **Two-way binding:** `[(opened)]` synchronizes with external state
- **Resize:** Optional drag handle with min/max constraints; the separator speaks its position as a percent of the min-max range (`aria-valuetext`, `sidenav` language section)
- **Keyboard:** Escape closes overlay, configurable global shortcut via `[shortcut]`
- **RTL-aware:** `position="start"` / `"end"` flip logically in RTL
- **Deep-linking:** persist open state to a URL query param via `[cngxSidenavRouterSync]` (see [Deep-linking](#deep-linking-router-sync))
- **App-wide defaults:** `CNGX_SIDENAV_CONFIG` cascade for dimensions, shortcut, hover dwell, and router-sync param (see [Configuration](#configuration))

## Container, not viewport

The docking decision reads the width of the surrounding `CngxSidenavLayout`, not the width of the window. A rail inside a dashboard pane collapses when that pane is narrow, whatever the browser window is doing.

The thresholds live in exactly one place - a `@container` rule block in `sidenav-layout.css` that writes `--cngx-sidenav-width-class` on the rail. Below 48rem the class is `compact` (the rail is a drawer), from 48rem `medium`, from 64rem `expanded` (both dock the rail). Override both rules to move the thresholds:

```css
@container cngx-sidenav-layout (min-inline-size: 40rem) {
  cngx-sidenav-layout > cngx-sidenav {
    --cngx-sidenav-width-class: medium;
  }
}

@container cngx-sidenav-layout (min-inline-size: 72rem) {
  cngx-sidenav-layout > cngx-sidenav {
    --cngx-sidenav-width-class: expanded;
  }
}
```

`CngxSidenav` reads the resolved value as `widthClass()`; it never evaluates a condition itself. A value outside the three classes renders as `compact` and warns [`CNGX3026`](../../../core-concepts/error-codes/cngx3026.md) in dev mode. To opt out of auto entirely, bind `mode`:

```html
<!-- always an overlay, whatever the layout width -->
<cngx-sidenav mode="over" [(opened)]="navOpen">…</cngx-sidenav>
```

A rail mounted without `<cngx-sidenav-layout>` has no container to measure; it renders as `over` and warns in dev mode.

See `core-concepts/responsive-by-default.md` for the library-wide contract.

## External toggle

A hamburger outside the rail toggles it with one `CngxPanelTrigger` (`@cngx/common/layout`) bound to the rail's `panelTarget`. The trigger sets `aria-controls` and mirrors `expanded` as `aria-expanded`, and `toggle()` follows the width class: it collapses the docked rail in `expanded`, opens the full nav over the rail in `medium` and the drawer in `compact`. A bare `cngxPanelTrigger` inside the rail (a pin or close button) resolves the same target through `CNGX_PANEL_TARGET`.

```html
<button type="button" [cngxPanelTrigger]="nav.panelTarget">Menu</button>

<cngx-sidenav-layout>
  <cngx-sidenav #nav="cngxSidenav">…</cngx-sidenav>
  <cngx-sidenav-content>…</cngx-sidenav-content>
</cngx-sidenav-layout>
```

An open overlay closes on any press outside the rail, except inside an element whose `aria-controls` lists the rail's id. A hand-rolled toggle needs that attribute: without it its press dismisses the rail and its `click` reopens it. Every rail has an id: a generated one by default, or the static `id="..."` you set on the host (read it back via `nav.id()`).

## Configuration

Every dimension default, the toggle shortcut, and the rail hover dwell resolve through a standard cascade. The docking threshold is deliberately not in the cascade - it is a CSS rule (see above), so it travels with the skin. Per-instance bindings always win; unset keys fall back to the library defaults, so an unconfigured `<cngx-sidenav>` behaves exactly as before.

Resolution priority (high to low):

1. Per-instance input (`[width]`, `[shortcut]`, `[expandDelay]`, ...)
2. `provideSidenavConfigAt(...)` in a component's `viewProviders` (sub-tree scope)
3. `provideSidenavConfig(...)` at the application root
4. Library defaults

```typescript
import {
  provideSidenavConfig,
  withSidenavDimensions,
  withSidenavShortcut,
  withSidenavHoverDwell,
} from '@cngx/ui';

bootstrapApplication(AppComponent, {
  providers: [
    provideSidenavConfig(
      withSidenavDimensions({ width: '320px', miniWidth: '64px' }),
      withSidenavShortcut('mod+b'),
      withSidenavHoverDwell({ enterDelay: 200, leaveDelay: 150 }),
    ),
  ],
});
```

| Feature | Overrides |
|-|-|
| `withSidenavDimensions({ width?, miniWidth?, minWidth?, maxWidth? })` | Panel dimensions |
| `withSidenavShortcut(combo)` | Default toggle shortcut for `position="start"` rails; an `end` rail needs its own `[shortcut]` |
| `withSidenavHoverDwell({ enterDelay?, leaveDelay? })` | Collapsed-rail peek dwell (ms) |
| `withSidenavRouterSync({ param })` | Default deep-link query-param key |
| `withSidenavPersistence(storageKey?)` | Persist each rail's `collapsed` in `CNGX_SIDENAV_STORAGE` under `<storageKey>:<position>`; seeds an unbound `collapsed` |

Read the resolved config in an injection context with `injectSidenavConfig()`. Scope overrides to a sub-tree with `provideSidenavConfigAt(...)` in a component's `viewProviders`.

### Rail hover dwell

A collapsed rail peeks only after the pointer rests for `expandDelay` ms and the peek ends `collapseDelay` ms after it leaves, so a sweep across the rail never peeks it. Both are tunable per instance and app-wide:

```html
<cngx-sidenav mode="side" [collapsed]="true" [expandDelay]="250" [collapseDelay]="150">...</cngx-sidenav>
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

- **ARIA roles:** The rail is a `role="complementary"` landmark while docked or closed. An open overlay (`over`, including `auto` below the threshold) is a modal dialog instead: `role="dialog"` with `aria-modal="true"`, matching its focus trap, Escape and backdrop. `aria-modal` never appears without `role="dialog"`. In overlay mode, `aria-hidden="true"` and `inert` when closed. `modality="contained"` keeps the modal inside the layout and `modality="none"` keeps the page operable (no trap, no backdrop, the rail stays a landmark).
- **Accessible name:** Every rail is named. Resolution: `[ariaLabel]`, then `withSidenavLabels({ startRegion, endRegion })`, then the `sidenav` language section. The default depends on `position`: `Navigation` for `start`, `Side panel` for `end`, so two rails never share one name.
- **Keyboard interaction:**
  - `Escape` - Closes overlay mode sidenav
  - Custom shortcut (if configured) - Runs `toggle()` from anywhere on the page and announces "Navigation expanded" / "Navigation collapsed" (`collapsedAnnouncement` / `expandedAnnouncement` labels, `CNGX_SIDENAV_ANNOUNCER_FACTORY` to swap the announcer). It is a `sidenav.toggle` binding in the app hotkey registry, so it stays quiet while another modal holds focus
- **Screen reader:** The landmark or dialog announces the rail's name; while a page-modal overlay is open everything outside it is `inert`, so the body content is not reachable.
- **Focus management:** An open overlay (`modality="page"`) traps Tab within the rail, moves focus into the rail on open, and restores focus to the element that opened it on close. Focus inside a closing drawer is moved out before it turns `aria-hidden`.

## Composition

`CngxSidenav` composes these atoms internally:

- **Width class:** the layout's `CngxContainer` publishes `--cngx-sidenav-width-class`
- **Keyboard shortcut:** `injectHotkeys` binding `sidenav.toggle` in the rail's hotkey scope (`@cngx/common/interactive`)
- **Overlay:** `CngxDrawerSurface` host directive (focus trap, focus restore, `inert`, scroll lock, Escape / back gesture / outside press), driven per `modality`
- **Resize:** `CngxResizable` (`@cngx/common/layout`) on the handle: window-splitter ARIA, pointer drag, arrow keys
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
