# Icon

Display atom that gives any glyph a size scale and the correct ARIA shape. Not an icon library: cngx ships no glyphs, no registry, no name lookup. You bring the icon (Material, Lucide, Heroicons, Font Awesome, inline SVG, emoji), `CngxIcon` makes it consistent and accessible.

## Import

```ts
import { CngxIcon } from '@cngx/common/display';
```

## Quick start

```html
<!-- Decorative: hidden from AT -->
<cngx-icon>
  <mat-icon>settings</mat-icon>
</cngx-icon>

<!-- Informative: announced as "Saved" -->
<cngx-icon label="Saved">
  <svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
</cngx-icon>

<!-- Size variant -->
<cngx-icon size="lg" label="Settings">
  <i class="fa-solid fa-gear"></i>
</cngx-icon>
```

## Selector duality

Two selectors, same component:

- `cngx-icon` as element: a clean wrapper around projected content.
- `[cngxIcon]` as attribute: promote any structurally-empty host (`<i>`, `<span>`, your own SVG element) into a sized, ARIA-correct icon without adding a wrapper DOM node.

```html
<i cngxIcon size="sm" class="fa-solid fa-user"></i>
<svg cngxIcon label="Cart" viewBox="0 0 24 24"><path d="..."/></svg>
```

Use the attribute when the underlying element is already the icon. Use the element when you project arbitrary content.

## Accessibility

ARIA shape is computed from a single input. There is no third state.

| `label` | Host attributes |
|-|-|
| unset (default) | `aria-hidden="true"` |
| set to a string | `role="img"`, `aria-label="<value>"` |

The icon is therefore decorative by default. Set `label` only when the icon carries information that is not already in the surrounding text. The classic pattern:

```html
<!-- The text already says "Saved". The icon is decoration. -->
<span><cngx-icon><mat-icon>check</mat-icon></cngx-icon> Saved</span>

<!-- Icon-only button. The icon is the entire label. -->
<button>
  <cngx-icon label="Close dialog"><mat-icon>close</mat-icon></cngx-icon>
</button>
```

If a third-party glyph component sets its own ARIA (e.g. Material's `<mat-icon>`), put `aria-hidden="true"` on the inner element so it is not announced a second time when `CngxIcon` already carries the label.

## Sizing

`size` ∈ `xs | sm | md | lg | xl` (default `md`). Each variant pins `--cngx-icon-size` to its scale token. All values are in `em`, so an icon next to running text matches the surrounding font scale automatically. `xs` floors at 12px and draws outline glyphs with stroke width 2.5 (`--cngx-icon-stroke-width-xs`): below that, a 24-unit glyph's strokes drop under one pixel and smear on standard-density screens.

| Variant | Default | Token |
|-|-|-|
| `xs` | `max(0.75em, 12px)` | `--cngx-icon-size-xs` |
| `sm` | `1em` | `--cngx-icon-size-sm` |
| `md` | `1.25em` | `--cngx-icon-size-md` |
| `lg` | `1.5em` | `--cngx-icon-size-lg` |
| `xl` | `2em` | `--cngx-icon-size-xl` |

The scale tokens inherit, so re-tuning them on `:root` or any ancestor reaches every icon below it. For one-off overrides set `--cngx-icon-size` on the icon itself:

```html
<cngx-icon style="--cngx-icon-size: 32px">…</cngx-icon>
```

### Small boxes: the micro and small tiers

The default cngx glyphs (`svg[cngxIconSvg]` and the svgs cngx builds imperatively) can carry a second, hand-hinted drawing on a 12-unit grid. In a box from 10px up to, but not including, 15px it replaces the 24-grid path, so at the 12px `xs` floor every edge lands on a whole pixel instead of smearing across two. The svg is a size container and the switch is plain CSS: no input, no measurement, and the same shape on every device pixel ratio. The micro drawing is a fill outline, so `--cngx-icon-svg-stroke-width` and `--cngx-icon-stroke-width-xs` do not reach it. A glyph without a micro drawing keeps its 24-grid path at every size. The rules ship in `cngx.css`; a page without it renders the 24-grid path at every size. Glyphs you project yourself are not affected.

One size up, a glyph can carry a third drawing on a 16-unit grid, shown in a box from 15px up to, but not including, 20px, exact at a 16px box. It works the same way: a hand-hinted fill outline, selected purely by the container size, independent of the micro tier - a glyph may carry one, the other, both, or neither, and the band each applies in is chosen on its own. DOM order of the paths is always 24-grid, micro, small. Like the micro tier it lives in `cngx.css` and never reaches glyphs you project yourself.

Where cngx draws a default glyph at the micro size (the select and paginator carets, the stepper check and error line, the tab add and close glyphs, the context-menu submenu caret, the reorder list move arrows, the checkbox check and dash), the box never drops below `--cngx-icon-svg-micro-floor`, `0.75rem` (12px) by default. Above the floor the box follows what sizes that glyph: the caret size token for the select (`--cngx-select-caret-size`) and paginator (`--cngx-paginator-caret-size`) carets, the indicator font (`--cngx-step-indicator-font-size`) for the stepper check, the inherited font for the stepper error line, the tab glyphs and the context-menu caret, the move size token (`--cngx-select-reorder-move-size`) for the reorder list arrows, and the box size (`--cngx-checkbox-size-*`) for the checkbox. To take such a glyph out of the band, size it outside: growing that driver lifts it to 15px and up, and `--cngx-icon-svg-micro-floor: 0px` lets shrinking it take the box below 10px again. The value must be a length; a unitless `0` makes the floor rule invalid.

```css
.compact-toolbar {
  --cngx-icon-svg-micro-floor: 0px;
  --cngx-select-caret-size: 1em;
}
```

Projected `<svg>` children get `width: 1em; height: 1em` automatically, and `fill: currentColor` when they carry no `fill` attribute of their own, so an inline SVG inherits both size and color without further setup. A stroke icon that ships `fill="none"` (Lucide, Feather) keeps it.

## Working with icon libraries

Anything that renders a glyph works. The cngx role is sizing plus ARIA, nothing else.

### Material Icons (font)

```html
<cngx-icon label="Delete">
  <mat-icon aria-hidden="true">delete</mat-icon>
</cngx-icon>
```

`<mat-icon>` ships a fixed 24px box and font size, styled outside any layer, so on its own it ignores `CngxIcon`'s size scale. The Material icon bridge (`@cngx/themes/material/icon-theme`, or the whole `@cngx/themes/material/theme`) sizes a wrapped `<mat-icon>` to a 1em box of the `cngx-icon` rung, so `size` applies. Without the bridge, use `<mat-icon inline>` to inherit the rung.

### Lucide / Heroicons / inline SVG

```html
<cngx-icon label="User profile">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21v-2a8 8 0 0 1 16 0v2"/>
  </svg>
</cngx-icon>
```

The `:scope > svg` rule pins it to `1em × 1em`. Its `fill="none"` is kept, so the outline is drawn by `stroke="currentColor"`; an SVG without a `fill` attribute gets `fill: currentColor` instead.

### Font Awesome / icon fonts

```html
<i cngxIcon size="sm" class="fa-solid fa-user" aria-hidden="true"></i>
```

### Unicode / emoji

```html
<cngx-icon>✓</cngx-icon>
```

## Anti-pattern: stacking on a component selector

Both selectors of `CngxIcon` match plain hosts. **Do not** stack `[cngxIcon]` onto another component that already has its own host bindings:

```html
<!-- Avoid -->
<mat-icon cngxIcon label="Close">settings</mat-icon>
```

Both components attach to the same element and both try to set `role`, `aria-hidden`, `aria-label`, and sizing. Resolution depends on directive declaration order and is not deterministic enough for ARIA. Wrap instead:

```html
<!-- Prefer -->
<cngx-icon label="Close" size="lg">
  <mat-icon aria-hidden="true">settings</mat-icon>
</cngx-icon>
```

The same applies to any third-party icon component with its own host bindings.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and tokens.
- Stories: `examples/stories/common/display/icon/`.
- Used by: `CngxTag`, `CngxBadge`, `CngxChip`, `CngxCloseButton`, every Material bridge that ships a default glyph.
