# Button Toggle

Segmented controls on native `<button>` elements. `CngxButtonToggleGroup` selects one value,
`CngxButtonMultiToggleGroup` selects any number. Both take the same `cngxButtonToggle` leaf, which
reads its mode from the group it sits in. There is no `[multiple]` flag: the group you write in the
template is the mode.

Which control? A toggle group fits two to five options that stay visible. For longer lists use a
select, for commands use a menu or a `cngxButtonGroup` of plain buttons. The full decision table is
in [Choosing a Trigger](../../../../core-concepts/choosing-a-trigger.md).

## Import

```ts
import {
  CngxButtonToggleGroup,
  CngxButtonMultiToggleGroup,
  CngxButtonToggle,
} from '@cngx/common/interactive';
```

## Quick start

Single selection:

```html
<cngx-button-toggle-group label="Layout" [(value)]="view">
  <button cngxButtonToggle value="grid">Grid</button>
  <button cngxButtonToggle value="list">List</button>
  <button cngxButtonToggle value="table">Table</button>
</cngx-button-toggle-group>
```

Multi selection:

```html
<cngx-button-multi-toggle-group label="Filters" [(selectedValues)]="filters">
  <button cngxButtonToggle value="open">Open</button>
  <button cngxButtonToggle value="closed">Closed</button>
  <button cngxButtonToggle value="archived">Archived</button>
</cngx-button-multi-toggle-group>
```

## Single vs multi

| | `CngxButtonToggleGroup` | `CngxButtonMultiToggleGroup` |
|-|-|-|
| Binding | `[(value)]`, `T \| undefined` | `[(selectedValues)]`, `T[]` |
| Group role | `radiogroup` | `toolbar` |
| Toggle semantics | `role="radio"`, `aria-checked` | native button, `aria-pressed` |
| Arrow keys, Home, End | move focus and select | move focus only |
| Click, Space, Enter | select | add or remove |
| Value match | `===` | key from `keyFn` |

The multi group also has a `value` property. It is the same model under a second name, for code
that reads the group through `CNGX_CONTROL_VALUE`. It is not an input: bind `[(selectedValues)]`.

For object values, pass `[keyFn]="byId"` (for example `(v) => v.id`) to the multi group, so a
re-fetched object with the same id still counts as selected.

A `cngxButtonToggle` needs exactly one of the two groups above it. Outside both it throws
[`CNGX1053`](../../../../core-concepts/error-codes/cngx1053.md), under both
[`CNGX1052`](../../../../core-concepts/error-codes/cngx1052.md).

## Keyboard

Both groups carry `CngxRovingTabindex`, so the group is one tab stop. `orientation` sets the arrow
axis and `aria-orientation`. Navigation wraps at the ends, skips disabled toggles and follows the
writing direction for Left and Right.

Arrow selection in the single group comes from the roving directive: it flags a navigation key
before it moves focus, and the newly focused toggle asks the group to select it. Focus from Tab, a
click or `focus()` does not select.

Space and Enter select on keydown. Read changes from the group's model, not from `(click)` on a
toggle.

## Accessibility

- Name the group with `label` or `labelledBy`. Inside a `cngx-form-field` with neither set, the
  field label names it.
- `disabled`, `required`, `invalid` and `errorMessageId` land on the host as `aria-disabled`,
  `aria-required`, `aria-invalid` and `aria-errormessage`. `aria-invalid` also turns on while the
  surrounding field or `CngxErrorAggregator` shows an error.
- `aria-busy` is set while `state` reports `loading`. With `state` unbound, the nearest
  `CNGX_STATEFUL` producer counts.
- `required` only sets `aria-required`. Validation belongs to the form.
- A disabled toggle explains why through `[cngxDescribedBy]`: render the reason yourself and pass
  its id. The group's `disabled` disables every toggle, natively and with `aria-disabled`.

## Forms

Both groups provide `CNGX_FORM_FIELD_CONTROL`, so `<cngx-form-field [field]="f.view">` takes them
without a wrapper. With Reactive Forms, put `formControlName` on the group and import
`CngxFormBridge` from `@cngx/forms/controls` ([README](../../../forms/controls/README.md)).

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/button-toggle/) for inputs, outputs and the token contracts.
- Stories: `examples/stories/common/interactive/button-toggle/group/` and
  `examples/stories/common/interactive/button-toggle/multi-group/`.
- `CngxToggle` for a single on/off switch without a group.
