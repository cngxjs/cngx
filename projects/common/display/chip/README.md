# Chip

Removable pill atom. The user added the value, the user can dismiss it. Composed internally by `CngxMultiSelect`, `CngxCombobox`, `CngxChipInput`, and toolbar filter-chips so every multi-value trigger shares the same surface and the same remove interaction. Available standalone for the same purpose. For an applied, non-removable label that classifies something, reach for `CngxTag` instead.

## Import

```ts
import { CngxChip } from '@cngx/common/display';
```

## Quick start

```html
<!-- Static label chip -->
<cngx-chip>Red</cngx-chip>

<!-- Removable chip -->
<cngx-chip [removable]="true" (remove)="handleRemove($event)">
  Red
</cngx-chip>

<!-- Chip strip -->
@for (value of selected(); track value) {
  <cngx-chip
    [removable]="true"
    [removeAriaLabel]="'Remove ' + value"
    (remove)="handleRemove(value)"
  >
    {{ value }}
  </cngx-chip>
}
```

The strip's layout (gap, wrap) belongs to the container, not the chip.

## Accessibility

A bare chip is a static pill - no role, no tabstop. The interaction surface is the inline remove button, which is a real `<button type="button">` with its own focus ring. Screen readers announce it as a button labelled by `removeAriaLabel`.

`removeAriaLabel` defaults to `"Remove"`. Pass the option name in for screen readers that need to know which chip the button removes:

```html
<cngx-chip [removable]="true" [removeAriaLabel]="'Remove ' + color">
  {{ color }}
</cngx-chip>
```

Every chip host carries an `id` so parent components can wire `aria-describedby` / `aria-labelledby` against it. Supply `[id]` to control the value, otherwise a stable `cngx-chip-N` is generated.

The default × glyph inside the remove button is `aria-hidden="true"` - the button's label carries the announcement.

## Slotting a custom close icon

The default close glyph is a Unicode ×. Project any icon component into the `[cngxChipClose]` slot to replace it:

```html
<cngx-chip [removable]="true">
  Red
  <cngx-icon cngxChipClose label="Remove">
    <mat-icon aria-hidden="true">close</mat-icon>
  </cngx-icon>
</cngx-chip>
```

The slot is `ng-content`, not a TemplateRef input - drop the component in, no outlet dance.

## Variants

Surface tone is keyed by the `data-color` attribute on the host. Four built-in variants ship; consumers can add more by declaring their own `--cngx-chip-<name>-bg` / `--cngx-chip-<name>-color` pair and matching the selector.

| Attribute | Background token | Color token |
|-|-|-|
| (unset) | `--cngx-chip-bg` | `--cngx-chip-color` |
| `data-color="info"` | `--cngx-chip-info-bg` | `--cngx-chip-info-color` |
| `data-color="success"` | `--cngx-chip-success-bg` | `--cngx-chip-success-color` |
| `data-color="warning"` | `--cngx-chip-warning-bg` | `--cngx-chip-warning-color` |
| `data-color="danger"` | `--cngx-chip-danger-bg` | `--cngx-chip-danger-color` |

```html
<cngx-chip data-color="success" [removable]="true">Approved</cngx-chip>
```

The unkeyed default carries a primary-flavoured tint so a plain `<cngx-chip>` reads as accented out of the box. Dark-mode variants flip text colors only - backgrounds are alpha-tints that mix correctly against either surface.

## State hooks

The chip styles three states from host attributes - the parent owns the truth, the chip reflects it.

| Attribute | Effect |
|-|-|
| `aria-selected="true"` / `aria-pressed="true"` | Selected surface (`--cngx-chip-selected-bg` / `--cngx-chip-selected-color`) |
| `aria-disabled="true"` / `:disabled` | Disabled opacity, `pointer-events: none`, `cursor: not-allowed` |
| `role="button"` / `[tabindex]` / `:has(.cngx-chip__remove)` | Hover surface, `cursor: pointer` |

A label-only chip with no interactivity gets no hover affordance.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, outputs, and the full token list.
- Stories: `examples/stories/common/display/chip/`.
- `CngxTag` - the applied, non-removable counterpart.
- Primary consumers: `CngxMultiSelect`, `CngxCombobox`, `CngxChipInput`, filter-chips.
