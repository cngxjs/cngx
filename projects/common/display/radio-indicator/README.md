# Radio Indicator

Visual-only glyph for the single-choice case: a circle frame with a centred dot when checked. It owns no selection state - the consumer passes the flags in. The atom never intercepts events and never announces anything: no click, no keyboard, no ARIA. The truth about "selected" lives on the surrounding row (`role="radio"` + `aria-checked`, `role="menuitemradio"` + `aria-checked`, or whatever the container's semantics demand). Composed by the `@cngx/forms/select` single-select panel (`selectionIndicatorVariant: 'radio'`), menu-item-radios, and any custom row that wants the cngx radio look without re-inventing it.

## Import

```ts
import { CngxRadioIndicator } from '@cngx/common/display';
```

## Quick start

```html
<!-- Checked -->
<cngx-radio-indicator [checked]="row.selected()" />

<!-- Inside a custom radio row. The row owns aria-checked; the indicator is decoration. -->
<div role="radio" [attr.aria-checked]="isSelected()" (click)="select()">
  <cngx-radio-indicator [checked]="isSelected()" [disabled]="row.disabled()" size="sm" />
  <span>{{ row.label }}</span>
</div>

<!-- Brand-glyph dot via TemplateRef. Still gated on [checked]. -->
<ng-template #starDot>
  <span aria-hidden="true">★</span>
</ng-template>
<cngx-radio-indicator [checked]="isSelected()" [dotGlyph]="starDot" />
```

## Accessibility

The host carries `aria-hidden="true"` unconditionally. The indicator never participates in the accessibility tree: it is decoration. The surrounding interactive element communicates the state:

|Container|ARIA the container must carry|
|-|-|
|Option row in a single-select listbox|`role="option"` + `aria-selected`|
|Radio row|`role="radio"` + `aria-checked`|
|Menu item with radio semantics|`role="menuitemradio"` + `aria-checked`|
|Custom row|whatever role/state matches its semantics|

`disabled` is cosmetic only (opacity dim). The indicator never intercepts events, so the consumer must also disable the row's hit area and set `aria-disabled` on the container. There is no `indeterminate` - radios are exclusive by definition; the group enforces single-selection at the brain layer.

## States

|Input|Effect|Host class|
|-|-|-|
|`checked`|Centred dot rendered; border tracks the checked color|`cngx-radio-indicator--checked`|
|`disabled`|Opacity dim, no event blocking|`cngx-radio-indicator--disabled`|

## Sizes

`size` is `sm | md | lg` (default `md`). Each pins `--cngx-radio-indicator-size` to the matching token. Values are in `em`, so the indicator scales with the surrounding font - and matches `CngxCheckboxIndicator` at every step.

|Variant|Default|Token|
|-|-|-|
|`sm`|`0.875em`|`--cngx-radio-indicator-size-sm`|
|`md`|`1em`|`--cngx-radio-indicator-size-md`|
|`lg`|`1.25em`|`--cngx-radio-indicator-size-lg`|

For one-off overrides set `--cngx-radio-indicator-size` inline.

## Custom dot

`dotGlyph` accepts a `TemplateRef<void>` that replaces the built-in `<span class="cngx-radio-indicator__dot">` when `checked` is true. The replacement owns its own styling - the `__dot` class is not applied to consumer content. The circle frame stays the cngx default.

```html
<ng-template #brandDot>
  <cngx-icon><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="6"/></svg></cngx-icon>
</ng-template>

<cngx-radio-indicator [checked]="selected()" [dotGlyph]="brandDot" />
```

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and tokens.
- Stories: `examples/stories/common/display/radio-indicator/`.
- Sibling: `CngxCheckboxIndicator` for the boxed checkmark / indeterminate case.
