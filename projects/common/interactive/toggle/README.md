# Toggle

Binary on-off switch with `role="switch"` semantics and a Signal-Forms-ready contract. Reach for `CngxToggle` when the control represents the state of one thing (notifications on, dark mode on, feature flag on) and the change takes effect immediately; reach for `CngxCheckbox` when the control selects something for a later action (one item in a list, an option in a form to be submitted).

## Import

```ts
import { CngxToggle } from '@cngx/common/interactive';
```

## Quick start

Two-way bind a signal, get the switch skin and the keyboard contract for free:

```html
<cngx-toggle [(value)]="notifications">Receive e-mail notifications</cngx-toggle>
```

```ts
protected readonly notifications = signal(false);
```

Disabled with a reason that AT can announce:

```html
<div
  cngxToggle
  [(value)]="dark"
  [disabled]="systemPreferenceLocked()"
  disabledReason="Locked by your OS preference"
>Dark mode</div>
```

Inside a Signal-Forms field, drop the atom into `<cngx-form-field>` and bind the `Field`:

```html
<cngx-form-field [field]="form.acceptsMarketing">
  <cngx-toggle>Send me product updates</cngx-toggle>
</cngx-form-field>
```

`CngxToggle` provides `CNGX_FORM_FIELD_CONTROL` directly, so no `[cngxBindField]` and no CVA on the consumer side.

## Selector duality

Two selectors, same component:

- `<cngx-toggle>` as element: renders the track + thumb skin and projects label content via `<ng-content>`.
- `[cngxToggle]` as attribute: applies the contract to a host element that owns its own markup. Use this when the surrounding row already paints the switch chrome.

Both forms emit `role="switch"`. Do not put the directive on a native `<button>` - the browser's Space-as-click synthesis double-fires the toggle.

## Accessibility

- Host carries `role="switch"`, `aria-checked` is `"true"` / `"false"` (never absent, never `"mixed"`).
- `aria-disabled` and `tabindex="-1"` paint together when disabled; the host stays in the AT tree but is not in the tab sequence.
- Click, Space, and Enter all flip `value`. Space and Enter call `preventDefault()` so the page does not scroll and forms do not submit.
- `disabledReason` is rendered into a permanently-present SR-only span. The host's `aria-describedby` only points at it when the reason is non-empty, so AT never announces an empty description (Pillar 2).
- `aria-invalid` and `aria-errormessage` are wired to the field-host / aggregator cascade: inside `<cngx-form-field>` the presenter governs visibility, outside form-field but inside `<cngxErrorAggregator>` the aggregator wins, outside both the atom paints no error skin.
- Label association: wrap the text inside the element form, or pair the directive form with a sibling `<label [attr.for]="toggle.id()">` using the exposed `id` signal.
- Focus-out marks the field-host as touched, so blur-based reveal strategies work without extra wiring.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full input / output / token surface.
- Stories: `examples/stories/common/interactive/toggle/`.
- `CngxCheckbox` for selection semantics inside a list or form (tri-state capable, no `role="switch"`).
- `CngxButtonToggle` and `CngxButtonToggleGroup` for grouped exclusive (radio-like) or multi selection rendered as a button bar.
