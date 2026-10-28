# @cngx/themes

The theme package for cngx: one CSS import for the default look, one Sass entry for Material integration. No runtime code - everything here is CSS and Sass mixins.

## What ships

- `cngx.css` - single-import default theme: cascade-layer order, the full foundation token set (OKLCH system tokens, `@property` registrations, `light-dark()` dark mode), reset, bare-element base layer, the `.cngx-sr-only` utility, and the externalised CSS of every cngx `@Directive` that paints DOM.
- `example-brand.css` - a worked brand override you copy and edit, not import forever.
- `material/` - 55 per-component Sass bridges plus `system-bridge.scss`, `density-bridge.scss`, and the `theme.scss` aggregator that maps a Material theme (M2 or M3) onto the cngx token system.

`@Component` CSS is not in here - Angular bundles it per component via `styleUrl`. `cngx.css` carries only what components cannot: layer order, tokens, and directive (Track B) styles.

## Default theme

```css
/* styles.css */
@import '@cngx/themes/cngx.css';
```

That is the whole setup. Layer order (declared once, first): `cngx.reset`, `cngx.tokens`, `cngx.base`, `cngx.components`, `cngx.theme`, `app`. Your own selectors land in `app` and therefore always beat library styles without specificity games.

## Customisation

Override tokens in the `cngx.theme` layer - never restyle component internals:

```css
@import '@cngx/themes/cngx.css';

@layer cngx.theme {
  :root {
    --cngx-color-primary: oklch(55% 0.2 260);
    --cngx-radius-md: 0.25rem;
  }
}
```

`example-brand.css` shows the full token surface in use. Every component also documents its own `--cngx-*` properties on its Theming tab.

### Brand accent and gradient

Two system tokens derive from the primary colour, so they follow a brand override without further work:

- `--cngx-color-accent` - the primary at the same lightness and chroma with the hue turned -70: `oklch(from var(--cngx-color-primary) l c calc(h - 70))`. Ember orange becomes pink. Override it in `cngx.theme` for a hand-picked second colour.
- `--cngx-gradient-brand` - `linear-gradient(100deg, var(--cngx-color-primary), var(--cngx-color-accent))`.

No cngx component reads either token. The default theme stays browser-native; both exist for your own surfaces. Use the accent only as part of the gradient, never as a colour of its own for UI state: focus rings, progress, selection and other state signals stay on `--cngx-color-primary`, so there is one signal colour.

```css
.hero {
  background: var(--cngx-gradient-brand);
  color: oklch(1 0 0);
}

.headline {
  background: var(--cngx-gradient-brand);
  background-clip: text;
  color: transparent;
}
```

Both are recomputed in every colour-scheme block (light, OS dark, `data-color-scheme` / `.dark` / `.light` islands) and by the Material system bridge. A custom property resolves its `var()` where it is declared, so a subtree that sets its own `--cngx-color-primary` outside those blocks re-declares the two tokens next to it:

```css
.campaign {
  --cngx-color-primary: oklch(0.6 0.2 260);
  --cngx-color-accent: oklch(from var(--cngx-color-primary) l c calc(h - 70));
  --cngx-gradient-brand: linear-gradient(100deg, var(--cngx-color-primary), var(--cngx-color-accent));
}
```

## Material bridge

If the app runs Angular Material, one include themes every cngx component from the Material theme:

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/theme' as cngx-material;

$theme: mat.define-theme();

html {
  @include mat.all-component-themes($theme);
  @include cngx-material.theme($theme);
}
```

Apps scaffolded by `ng add @angular/material` use the map API `mat.theme((...))`, which leaves no `$theme` object. Use `theme-system($density)` there, with the same density value as the map:

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/theme' as cngx-material;

html {
  @include mat.theme((color: (primary: mat.$azure-palette), density: -2));
  @include cngx-material.theme-system(-2);
}
```

Fidelity is the same as `theme($theme)`: in M3 every bridge reads the `--mat-sys-*` values `mat.theme` emits, so only the density scale has to be passed along. The mixin builds an internal `mat.define-theme` object for that; its default palette shows up only as the fallback in a few `var(--mat-sys-*, <hex>)` reads (sidenav, nav-link) and never applies while `mat.theme` is included.

Selective wiring stays available for apps that ship a subset: include `material/system-bridge` once, then only the component bridges you use:

```scss
@use '@cngx/themes/material/system-bridge' as cngx-system;
@use '@cngx/themes/material/button-theme' as button;

html {
  @include cngx-system.theme($theme);
  @include button.theme($theme);
}
```

`system-bridge` maps the cngx foundation tokens (`--cngx-color-*`, `--cngx-space-*`, `--cngx-radius-*`, `--cngx-shadow-*`, ...) onto Material's `--mat-sys-*` values; the per-component bridges refine on top. `@angular/material` and `@angular/cdk` are optional peer dependencies - without the bridge, nothing in this package needs them.

### Breaking changes: button-family bridges

The button family is bridged by one entry now. Three Sass entry points are gone:

|Removed|Use instead|
|-|-|
|`@cngx/themes/material/action-button-theme`|`button-theme` for the button paint, metrics and shape (every `.cngx-button` host, `cngxActionButton` included); `async-click-theme` for the `--cngx-async-*` state tint of a bare `cngxAsyncClick` host|
|`@cngx/themes/material/close-button-theme`|`button-theme` (it maps the close-button colour, radius, box and glyph)|
|`density($level)` in `@cngx/themes/material/feedback-theme`|nothing to include: `button-theme` sizes the close button of alert, toast and popover; re-scale it with `[data-density]` or a Material `density` scale, or set `--cngx-close-button-size` / `--cngx-close-button-icon-size` on a host|

The `theme` aggregate includes `button-theme` and `async-click-theme`, so an app on `cngx-material.theme($theme)` or `theme-system($density)` needs no change. A selective include swaps the old `@use` for the new one:

```scss
// before
@use '@cngx/themes/material/action-button-theme' as action-btn;
@use '@cngx/themes/material/close-button-theme' as close-btn;
@include action-btn.theme($theme);
@include close-btn.theme($theme);

// after
@use '@cngx/themes/material/button-theme' as button;
@use '@cngx/themes/material/async-click-theme' as async-click;
@include button.theme($theme);
@include async-click.theme($theme);
```

## When not to use it

The component libraries work without `@cngx/themes`: every stylesheet falls back to literal values when a token is unset. You lose dark mode, density tracking, and one-place branding - so skip this package only for isolated embeds where the host page owns all styling.
