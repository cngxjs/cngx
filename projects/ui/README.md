# @cngx/ui

Finished, styled Angular components that compose headless directives from
`@cngx/common` with opinionated rendering. These are the "organism" layer —
ready to drop into an application without additional template work.

## Theming

Every component supports two theming paths:

1. **CSS Custom Properties** — override `--cngx-*` variables on any parent
   element. Works without Angular Material.

2. **Material Theme SCSS** — each component ships a `*-theme.scss` file with
   `base()`, `color($theme)`, `density($theme)`, and `theme($theme)` mixins
   that map Material design tokens to the CSS custom properties.

```scss
@use '@angular/material' as mat;
@use '@cngx/ui/src/lib/speak/speak-button-theme' as speak;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include speak.theme($theme);
}
```

M3 themes use `var(--mat-sys-*)` tokens. M2 themes derive from the palette.
Density scales sizes from default (0) to compact (-4).

## Components

### CngxMatPaginator

Material paginator wrapper that connects to `CngxPaginate` (headless,
`@cngx/common`) via `[cngxPaginateRef]`.

```html
<div cngxPaginate #pg="cngxPaginate" [total]="items().length">
  <!-- table / list -->
</div>
<cngx-mat-paginator [cngxPaginateRef]="pg" [pageSizeOptions]="[5, 10, 25]" />
```

**Inputs:** `cngxPaginateRef` (required, CngxPaginate instance), `pageSizeOptions` (number[])

### CngxSpeakButton

Ready-made speaker button that connects to `CngxSpeak` (headless,
`@cngx/common`) via `[speakRef]`.

```html
<span [cngxSpeak]="text" #tts="cngxSpeak">{{ text }}</span>
<cngx-speak-button [speakRef]="tts" />
```

**Inputs:** `speakRef` (required, CngxSpeak instance)

**CSS Custom Properties:**

| Variable | Default | Description |
|-|-|-|
| `--cngx-speak-btn-size` | `28px` | Button width and height |
| `--cngx-speak-btn-icon-size` | `14px` | SVG icon size |
| `--cngx-speak-btn-radius` | `4px` | Border radius |
| `--cngx-speak-btn-border-width` | `1px` | Border width |
| `--cngx-speak-btn-bg` | `--cngx-surface` / `#fff` | Background color |
| `--cngx-speak-btn-color` | `--cngx-text-secondary` / `#666` | Icon color |
| `--cngx-speak-btn-active-color` | `--cngx-accent` / `#f5a623` | Icon color while speaking or on hover |
| `--cngx-speak-btn-transition` | `0.15s` | Color transition duration |

**Material theme:** `@use '@cngx/ui/src/lib/speak/speak-button-theme'`

### CngxSidenav

Declarative sidebar organism with dual-sidebar support, responsive mode
switching, mini/rail mode, resize handle, and keyboard shortcut toggle.

```html
<cngx-sidenav-layout>
  <cngx-sidenav position="start" [(opened)]="navOpen" mode="side"
                [resizable]="true" shortcut="mod+b" width="240px">
    <cngx-sidenav-header>Workspace</cngx-sidenav-header>
    <a cngxNavLink [active]="true">Dashboard</a>
    <a cngxNavLink>Settings</a>
    <cngx-sidenav-footer>v1.0</cngx-sidenav-footer>
  </cngx-sidenav>
  <cngx-sidenav-content>
    <router-outlet />
  </cngx-sidenav-content>
</cngx-sidenav-layout>
```

**Modes:** `'over'` (overlay + backdrop), `'push'` (pushes content), `'side'` (permanent), `'mini'` (collapsed rail, expands on hover)

**CngxSidenav inputs:**

| Input | Type | Default | Description |
|-|-|-|-|
| `position` | `'start' \| 'end'` | `'start'` | Logical position (flips in RTL) |
| `mode` | `SidenavMode` | `'over'` | Interaction mode |
| `responsive` | `string` | — | CSS media query; matches = `'side'`, else falls back to `mode` |
| `width` | `string` (model) | `'280px'` | Panel width, two-way `[(width)]` for resize |
| `miniWidth` | `string` | `'56px'` | Collapsed rail width in mini mode |
| `expandOnHover` | `boolean` | `true` | Expand mini rail on mouse hover |
| `resizable` | `boolean` | `false` | Show drag handle for user resize |
| `minWidth` | `string` | `'120px'` | Min width constraint during resize |
| `maxWidth` | `string` | `'600px'` | Max width constraint during resize |
| `shortcut` | `string` | — | Keyboard shortcut, e.g. `'mod+b'` (`mod` = Cmd on Mac, Ctrl elsewhere) |

**CngxSidenav signals:** `opened` (model), `expanded` (mini hover state), `effectiveMode`, `effectiveWidth`, `resizing`, `isOverlay`
**Methods:** `open()`, `close()`, `toggle()`, `expand()`, `collapse()`

**Slot components:** `CngxSidenavHeader`, `CngxSidenavFooter` (projected into named slots)
**Layout:** `CngxSidenavLayout` (container, manages backdrop + scroll lock), `CngxSidenavContent` (main area)

**CSS Custom Properties:**

| Variable | Default | Description |
|-|-|-|
| `--cngx-sidenav-width` | `280px` | Panel width |
| `--cngx-sidenav-mini-width` | `56px` | Mini mode rail width |
| `--cngx-sidenav-bg` | M3 surface-container | Background |
| `--cngx-sidenav-color` | M3 on-surface | Text color |
| `--cngx-sidenav-border-color` | M3 outline-variant | Border color |
| `--cngx-sidenav-padding` | density-dependent | Header/footer padding |
| `--cngx-sidenav-header-bg` | M3 surface-container-low | Header background |
| `--cngx-sidenav-footer-bg` | M3 surface-container-low | Footer background |
| `--cngx-sidenav-backdrop-bg` | M3 scrim | Backdrop color |
| `--cngx-sidenav-backdrop-opacity` | `0.5` | Backdrop opacity |
| `--cngx-sidenav-transition-duration` | `0.25s` | Animation duration |
| `--cngx-sidenav-resize-handle-width` | `4px` | Resize handle hit area |
| `--cngx-sidenav-resize-handle-color` | M3 primary | Handle highlight color |
| `--cngx-sidenav-expanded-shadow` | `4px 0 12px rgba(0,0,0,0.1)` | Mini expanded shadow |

**Nav link theming** (applied inside sidenavs via `sidenav.theme()`):

| Variable | Description |
|-|-|
| `--cngx-nav-link-color` | Default text color |
| `--cngx-nav-link-hover-color` | Hover text color |
| `--cngx-nav-link-active-color` | Active text color |
| `--cngx-nav-link-active-bg` | Active background (M3 secondary-container) |
| `--cngx-nav-link-radius` | Border radius (default 8px) |
| `--cngx-nav-link-padding` | Padding (density-dependent) |

**Material theme:** `@use '@cngx/ui/sidenav/sidenav-theme'` — includes nav-link theme automatically
