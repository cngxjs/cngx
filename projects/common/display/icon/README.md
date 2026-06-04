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

`size` ∈ `xs | sm | md | lg | xl` (default `md`). Each variant pins `--cngx-icon-size` to its scale token. All values are in `em`, so an icon next to running text matches the surrounding font scale automatically.

| Variant | Default | Token |
|-|-|-|
| `xs` | `0.75em` | `--cngx-icon-size-xs` |
| `sm` | `1em` | `--cngx-icon-size-sm` |
| `md` | `1.25em` | `--cngx-icon-size-md` |
| `lg` | `1.5em` | `--cngx-icon-size-lg` |
| `xl` | `2em` | `--cngx-icon-size-xl` |

For one-off overrides use inline `--cngx-icon-size`:

```html
<cngx-icon style="--cngx-icon-size: 32px">…</cngx-icon>
```

Projected `<svg>` children get `width: 1em; height: 1em; fill: currentColor` automatically, so an inline SVG inherits both size and color without further setup.

## Working with icon libraries

Anything that renders a glyph works. The cngx role is sizing plus ARIA, nothing else.

### Material Icons (font)

```html
<cngx-icon label="Delete">
  <mat-icon aria-hidden="true">delete</mat-icon>
</cngx-icon>
```

Note that `<mat-icon>` ships its own fixed `font-size: 24px`. To respect `CngxIcon`'s size scale, project it as content and override the Material icon size at the Material theme level (`--mat-icon-size: 1em`), or accept Material's 24px and stop using the `size` input on this instance.

### Lucide / Heroicons / inline SVG

```html
<cngx-icon label="User profile">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 21v-2a8 8 0 0 1 16 0v2"/>
  </svg>
</cngx-icon>
```

The `:scope > svg` rule pins it to `1em × 1em` with `fill: currentColor`.

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
