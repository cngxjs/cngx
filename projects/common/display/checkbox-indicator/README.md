# Checkbox Indicator

Visual-only glyph for checked / indeterminate / disabled. It owns no selection state - the consumer passes the flags in. The atom renders a boxed checkmark (or a bare glyph) and nothing else: no click, no keyboard, no ARIA announcement. The truth about "selected" lives on the surrounding row (`role="option"` + `aria-selected`, `role="treeitem"` + `aria-checked`, `role="menuitemcheckbox"`). Composed by `@cngx/forms/select` panels, tree nodes, menu-item-checkboxes, and any custom row that wants the cngx checkbox look without re-inventing it.

## Import

```ts
import { CngxCheckboxIndicator } from '@cngx/common/display';
```

## Quick start

```html
<!-- Checked -->
<cngx-checkbox-indicator [checked]="row.selected()" />

<!-- Indeterminate takes precedence over checked -->
<cngx-checkbox-indicator
  [checked]="allSelected()"
  [indeterminate]="someSelected() && !allSelected()"
/>

<!-- Inside a custom option row. The row owns aria-selected; the indicator is decoration. -->
<div role="option" [attr.aria-selected]="isSelected()" (click)="toggle()">
  <cngx-checkbox-indicator [checked]="isSelected()" [disabled]="row.disabled()" size="sm" />
  <span>{{ row.label }}</span>
</div>
```

## Accessibility

The host carries `aria-hidden="true"` unconditionally. The indicator never participates in the accessibility tree: it is decoration. The surrounding interactive element communicates the state:

|Container|ARIA the container must carry|
|-|-|
|Option row in a listbox|`role="option"` + `aria-selected`|
|Tree node|`role="treeitem"` + `aria-checked`|
|Menu item with checkbox semantics|`role="menuitemcheckbox"` + `aria-checked`|
|Custom row|whatever role/state matches its semantics|

`disabled` is cosmetic only (opacity dim). The indicator never intercepts events, so the consumer must also disable the row's hit area and set `aria-disabled` on the container.

## Variants

Two visual forms via `variant`:

|Value|Render|
|-|-|
|`checkbox` (default)|Bordered box that fills on checked / indeterminate|
|`checkmark`|Bare glyph, no box - tracks `--cngx-color-primary`|

`@cngx/forms/select` picks the form via its `selectionIndicatorVariant` config; consumers compose either directly.

## States

|Input|Effect|Host class|
|-|-|-|
|`checked`|Checkmark glyph in the filled box (or bare glyph in `checkmark` variant)|`cngx-checkbox-indicator--checked`|
|`indeterminate`|Dash glyph; takes precedence over `checked`|`cngx-checkbox-indicator--indeterminate`|
|`disabled`|Opacity dim, no event blocking|`cngx-checkbox-indicator--disabled`|

## Sizes

`size` is `sm | md | lg` (default `md`). Each pins `--cngx-checkbox-size` to the matching token. Values are in `em`, so the indicator scales with the surrounding font.

|Variant|Default|Token|
|-|-|-|
|`sm`|`0.875em`|`--cngx-checkbox-size-sm`|
|`md`|`1em`|`--cngx-checkbox-size-md`|
|`lg`|`1.25em`|`--cngx-checkbox-size-lg`|

For one-off overrides set `--cngx-checkbox-size` inline.

## Custom glyphs

`checkGlyph` and `dashGlyph` accept a `TemplateRef<void>` that replaces the built-in `&#10003;` / `&minus;` spans. The replacement template owns its own styling - the `__check` / `__dash` classes are not applied to consumer content.

```html
<ng-template #tick>
  <cngx-icon><svg viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg></cngx-icon>
</ng-template>

<cngx-checkbox-indicator [checked]="selected()" [checkGlyph]="tick" />
```

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and tokens.
- Stories: `examples/stories/common/display/checkbox-indicator/`.
- Sibling: `CngxRadioIndicator` for single-choice rows.
