# Button Toggle

A pair of segmented-control groups built from a single leaf directive. Two parent components own opposite contracts: `CngxButtonToggleGroup` is single-select with W3C `radiogroup` semantics, `CngxButtonMultiToggleGroup` is multi-select with W3C `toolbar` semantics. The shared `CngxButtonToggle` leaf binds to native `<button>`, injects exactly one parent token, and picks its ARIA pattern at injection time. Mode is static per atom instance, never a runtime flag.

## Import

```ts
import {
  CngxButtonToggleGroup,
  CngxButtonMultiToggleGroup,
  CngxButtonToggle,
} from '@cngx/common/interactive';
```

## Quick start

Single-select (radiogroup, auto-select on arrow):

```html
<cngx-button-toggle-group label="Layout" [(value)]="view">
  <button cngxButtonToggle value="grid">Grid</button>
  <button cngxButtonToggle value="list">List</button>
  <button cngxButtonToggle value="table">Table</button>
</cngx-button-toggle-group>
```

Multi-select (toolbar, arrow moves focus only):

```html
<cngx-button-multi-toggle-group label="Filters" [(selectedValues)]="filters">
  <button cngxButtonToggle value="open">Open</button>
  <button cngxButtonToggle value="closed">Closed</button>
  <button cngxButtonToggle value="archived">Archived</button>
</cngx-button-multi-toggle-group>
```

The leaf is the same directive in both cases. The parent it resolves at injection determines its semantics.

## The two group contracts

The leaf injects `CNGX_BUTTON_TOGGLE_GROUP` and `CNGX_BUTTON_MULTI_TOGGLE_GROUP` both with `{ optional: true }`. Exactly one must be present; both or neither throws.

| Aspect | `CNGX_BUTTON_TOGGLE_GROUP` | `CNGX_BUTTON_MULTI_TOGGLE_GROUP` |
|-|-|-|
| Component | `CngxButtonToggleGroup` | `CngxButtonMultiToggleGroup` |
| Selection | single | multi |
| Canonical model | `value = model<T \| undefined>` | `selectedValues = model<T[]>` |
| Two-way alias | `[(value)]` | `[(selectedValues)]` (also `[(value)]`) |
| Host role | `radiogroup` | `toolbar` |
| Leaf ARIA | `aria-checked` | `aria-selected` |
| Arrow keys | move focus AND select | move focus only |
| Activation | `group.value.set(v)` | `group.toggle(v)` |
| Empty | `value() === undefined` | `selectedValues().length === 0` |

Both contracts share `disabled`, `required`, `invalid`, `errorMessageId`, `orientation`, `label`, and `state` inputs, expose `focused`, `empty`, and `errorState` signals, and provide themselves as `CNGX_CONTROL_VALUE` plus `CNGX_FORM_FIELD_CONTROL` so they drop into `<cngx-form-field [field]>` without a wrapper.

## Accessibility

Both groups compose `CngxRovingTabindex` as a host directive with `orientation` forwarded, so exactly one leaf is in the tab sequence; the rest carry `tabindex="-1"`. `CngxRovingItem` on the leaf wires arrow navigation and skips per-toggle-disabled leaves.

| Key | Single (`radiogroup`) | Multi (`toolbar`) |
|-|-|-|
| Arrow keys | move focus + select focused leaf | move focus only |
| Home / End | move focus + select first / last | move focus to first / last |
| Space, Enter | select focused leaf | toggle focused leaf |
| Tab | enter / leave group | enter / leave group |

Single-select auto-select-on-arrow follows the radiogroup pattern via a transient `pendingArrowSelect` flag raised on host `(keydown)` and consumed in the leaf's `(focus)` handler. The signal write happens inside the DOM event handler, never inside an `effect()`.

Group state is communicated structurally: `aria-disabled`, `aria-required`, `aria-invalid`, `aria-orientation`, `aria-busy`, and `aria-errormessage` are all `computed()` from inputs and the optional field-host / error-aggregator wiring. `aria-busy` is true while the optional `state` input reports `loading`.

Per-toggle `disabled` describes its reason via `[cngxDescribedBy]` (alias of the leaf's `describedBy` input). Consumers render the description element themselves and pass its id; native `<button aria-describedby>` semantics apply.

Accepted debt: a fully-disabled group lets arrow focus transit through its toggles because Angular forbids re-binding the host-directive's read-only `disabled` input. Every selection pathway short-circuits silently. Mirrors `CngxRadio` behaviour; tracked in `form-primitives-accepted-debt.md §4`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, outputs, and the full token surface.
- Stories: `examples/stories/common/interactive/button-toggle-group/`, `examples/stories/common/interactive/button-multi-toggle-group/`.
- `CngxToggle` (`@cngx/common/interactive`) for the standalone on/off switch (no group context).
