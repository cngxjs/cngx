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

Selective wiring stays available for apps that ship a subset: include `material/system-bridge` once, then only the component bridges you use:

```scss
@use '@cngx/themes/material/system-bridge' as cngx-system;
@use '@cngx/themes/material/action-button-theme' as action-btn;

html {
  @include cngx-system.theme($theme);
  @include action-btn.theme($theme);
}
```

`system-bridge` maps the cngx foundation tokens (`--cngx-color-*`, `--cngx-space-*`, `--cngx-radius-*`, `--cngx-shadow-*`, ...) onto Material's `--mat-sys-*` values; the per-component bridges refine on top. `@angular/material` and `@angular/cdk` are optional peer dependencies - without the bridge, nothing in this package needs them.

## When not to use it

The component libraries work without `@cngx/themes`: every stylesheet falls back to literal values when a token is unset. You lose dark mode, density tracking, and one-place branding - so skip this package only for isolated embeds where the host page owns all styling.
