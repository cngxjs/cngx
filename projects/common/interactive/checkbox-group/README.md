# Checkbox Group

Multi-value container that coordinates projected `CngxCheckbox` leaves. Owns the `selectedValues` model, derives the membership flags (`allSelected`, `someSelected`, `noneSelected`, `selectedCount`) consumers need to wire a "select all" master, and provides `CNGX_FORM_FIELD_CONTROL` / `CNGX_CONTROL_VALUE` so it drops into `<cngx-form-field>` and any forms bridge unchanged. Composes `CngxRovingTabindex` as a host directive for arrow-key navigation. No implicit identity injection: leaves are projected, the consumer binds each leaf's `[value]` and `(valueChange)` against `selectedValues`.

## Import

```ts
import { CngxCheckboxGroup, CngxCheckbox } from '@cngx/common/interactive';
```

## Quick start

### Plain group with projected leaves

```html
<cngx-checkbox-group
  label="Notification channels"
  [allValues]="options"
  [(selectedValues)]="picked"
>
  @for (opt of options; track opt) {
    <cngx-checkbox
      [value]="picked().includes(opt)"
      (valueChange)="toggle(opt, $event)"
    >{{ opt }}</cngx-checkbox>
  }
</cngx-checkbox-group>
```

### Select-all master with tri-state

The master binds the group's derived flags. `aria-checked` flips between `true`, `false`, and `"mixed"` as the picked array changes.

```html
<cngx-checkbox
  [value]="group.allSelected()"
  [indeterminate]="group.someSelected()"
  (valueChange)="group.toggleAll()"
>Select all</cngx-checkbox>

<cngx-checkbox-group
  #group="cngxCheckboxGroup"
  label="Notification channels"
  [allValues]="options"
  [(selectedValues)]="picked"
>
  @for (opt of options; track opt) {
    <cngx-checkbox
      [value]="picked().includes(opt)"
      (valueChange)="toggle(opt, $event)"
    >{{ opt }}</cngx-checkbox>
  }
</cngx-checkbox-group>
```

`[allValues]` is the full option pool. Without it, `allSelected` collapses to the vacuous "selectedCount > 0" and `toggleAll()` can only clear, not refill.

### Signal Forms

The group satisfies `CngxFormFieldControl`, so a `Field<T[]>` binds directly.

```html
<cngx-form-field [field]="form.channels" label="Channels">
  <cngx-checkbox-group [allValues]="options">
    @for (opt of options; track opt) {
      <cngx-checkbox [value]="form.channels().value.includes(opt)">
        {{ opt }}
      </cngx-checkbox>
    }
  </cngx-checkbox-group>
</cngx-form-field>
```

### Object-typed values

Pass `keyFn` so membership stays stable across re-emissions that produce new array references with the same logical id.

```html
<cngx-checkbox-group
  [allValues]="users"
  [(selectedValues)]="picked"
  [keyFn]="userKey"
>
  ...
</cngx-checkbox-group>
```

```ts
protected readonly userKey = (u: User) => u.id;
```

## Accessibility

The host carries `role="group"`. Use `label` to name the group, or wrap with `<cngx-form-field label="...">` and let the field own the label.

Computed ARIA:

| Attribute | Source |
|-|-|
| `role` | static `"group"` |
| `aria-label` | `label()` |
| `aria-disabled` | `disabled()` |
| `aria-required` | `required()` |
| `aria-invalid` | `invalid() \|\| errorState()` |
| `aria-errormessage` | `errorMessageId()` |
| `aria-busy` | `state()?.status() === 'loading'` |

`aria-errormessage` is ignored by AT unless `aria-invalid` is also present, so the id is safe to emit unconditionally.

### Roving tabindex

`CngxRovingTabindex` is composed as a host directive. The group exposes one tab stop; arrow keys move focus between projected leaves. `orientation="horizontal"` switches the active axis from up/down to left/right.

### Tri-state master

A master checkbox wired to `[value]="group.allSelected()"` and `[indeterminate]="group.someSelected()"` flips its own `aria-checked` between `true`, `false`, and `"mixed"`. Clicking it calls `group.toggleAll()`, which advances the WAI-ARIA tristate cycle in one step (mixed becomes selected, not back to mixed).

### Disabled cascade

`[disabled]` on the group emits `aria-disabled="true"` and blocks the imperative API. Projected leaves do not inherit it implicitly: bind `[disabled]="group.disabled()"` on each leaf so the visual and interactive state stays in lockstep.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full input/output surface and DI tokens.
- Stories: `examples/stories/common/interactive/checkbox-group/`.
- Leaf atom: `CngxCheckbox`.
