# Checkbox

Behavioural atom that owns the click target, keyboard, and ARIA wiring for a single boolean choice with WAI-ARIA tristate semantics. The visual glyph is delegated to `CngxCheckboxIndicator` from `@cngx/common/display` per Pillar 3 (Komposition statt Konfiguration); this atom never re-draws what the indicator already paints. Drop it inside a `CngxCheckboxGroup` for multi-value selection, or hand it a Signal Forms `Field<boolean>` via `<cngx-form-field [field]="f.x">` for validation.

## Import

```ts
import { CngxCheckbox } from '@cngx/common/interactive';
```

## Quick start

Standalone, two-way bound:

```html
<cngx-checkbox [(value)]="acceptTerms">I accept the terms</cngx-checkbox>
```

Inside a `CngxCheckboxGroup` (projected leaves; the group owns membership):

```html
<cngx-checkbox-group label="Notifications" [allValues]="options" [(selectedValues)]="picked">
  @for (opt of options; track opt) {
    <cngx-checkbox [value]="picked().includes(opt)" (valueChange)="toggle(opt, $event)">
      {{ opt }}
    </cngx-checkbox>
  }
</cngx-checkbox-group>
```

With a Signal Forms field (the atom provides `CNGX_FORM_FIELD_CONTROL`, so `<cngx-form-field>` wires it without a CVA):

```html
<cngx-form-field [field]="form.acceptTerms">
  <cngx-checkbox>I accept the terms</cngx-checkbox>
</cngx-form-field>
```

Tristate select-all driver (one click advances `mixed` to `true`, never back to `mixed`):

```html
<cngx-checkbox
  [value]="allChecked()"
  [indeterminate]="someChecked() && !allChecked()"
  (valueChange)="toggleAll($event)"
>Select all</cngx-checkbox>
```

## Accessibility

Host carries `role="checkbox"` and `tabindex="0"` (or `-1` when disabled). `aria-checked` is a `computed()`: `indeterminate ? 'mixed' : value ? 'true' : 'false'`. Click, Space, and Enter all advance state; `keydown.space` and `keydown.enter` call `preventDefault()` so the page does not scroll or submit.

`aria-disabled`, `aria-invalid`, `aria-errormessage`, and `aria-describedby` are reactive attributes that toggle on/off as their predicates resolve. The `disabledReason` span is always in the DOM and flips `aria-hidden` based on whether a reason is present, so the description-id never dangles.

Labels are projected via `<ng-content>` and sit inside `.cngx-checkbox__label`. There is no native `<input>` underneath, so consumers do not need a `<label for="...">` wrapper. If you place the checkbox next to external text, point that text at the host with `aria-labelledby` instead.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full signal surface.
- Stories: `examples/stories/common/interactive/checkbox/`.
- `CngxCheckboxGroup` for multi-value selection, `allValues` / `toggleAll`, and the select-all master pattern.
- `CngxCheckboxIndicator` (`@cngx/common/display`) for the visual atom this component composes.
