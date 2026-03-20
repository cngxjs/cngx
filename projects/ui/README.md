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
