# @cngx/forms/controls

Reactive-Forms helpers for cngx form atoms. Two directives, one purpose: keep
RF-driven and Signal-Forms-driven code paths feeling identical to the
consumer while the atoms in `@cngx/common/interactive` stay completely
Forms-agnostic.

## What ships here

| Symbol | Role |
|-|-|
| `CngxFormBridge` | One CVA bridge for every value-bearing atom. Auto-attaches when `[formControl]` / `[formControlName]` is bound. |
| `CngxTypedControl` | Structural helper that resolves a typed `FormControl<T>` from the parent `FormGroup` by name without `as`-casts. |

Import both from the same entry:

```ts
import { CngxFormBridge, CngxTypedControl } from '@cngx/forms/controls';
```

---

## CngxFormBridge

A single Reactive-Forms `ControlValueAccessor` that talks to every cngx
form atom through `CNGX_CONTROL_VALUE`. Atoms in
`@cngx/common/interactive` provide that token directly; this bridge is the
only place in cngx that implements `ControlValueAccessor`.

### Why one bridge instead of a CVA per atom

- Atoms stay layer-clean. None of them imports from `@angular/forms`.
- Only one place to harden against `untracked()` discipline, supersede
  semantics, and future Angular Forms internals migrating to signals.
- Adding a new value-bearing atom is a one-line selector entry in this
  directive. No new CVA boilerplate per shape.

### Supported atoms

| Atom | Selector form(s) | Value shape |
|-|-|-|
| `CngxToggle` | `cngx-toggle`, `[cngxToggle]` | `boolean` |
| `CngxCheckbox` | `cngx-checkbox`, `[cngxCheckbox]` | `boolean` |
| `CngxChipInteraction` | `[cngxChipInteraction]` | `boolean` (aliased `[(selected)]`) |
| `CngxRadioGroup` | `cngx-radio-group`, `[cngxRadioGroup]` | `T \| undefined` |
| `CngxButtonToggleGroup` | `cngx-button-toggle-group`, `[cngxButtonToggleGroup]` | `T \| undefined` |
| `CngxChipGroup` | `cngx-chip-group`, `[cngxChipGroup]` | `T \| undefined` |
| `CngxCheckboxGroup` | `cngx-checkbox-group`, `[cngxCheckboxGroup]` | `T[]` |
| `CngxButtonMultiToggleGroup` | `cngx-button-multi-toggle-group`, `[cngxButtonMultiToggleGroup]` | `T[]` |
| `CngxMultiChipGroup` | `cngx-multi-chip-group`, `[cngxMultiChipGroup]` | `T[]` |

`CngxChipInput` is intentionally **not** in this list. Its tokenizer
shape (emits `tokenCreated` events, no `value` model) needs a separate
bridge in `@cngx/forms/field` modelled on `CngxListboxFieldBridge`.

### Usage

```ts
import { Component } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CngxFormBridge } from '@cngx/forms/controls';
import {
  CngxToggle,
  CngxRadioGroup,
  CngxRadio,
  CngxMultiChipGroup,
  CngxChipInGroup,
} from '@cngx/common/interactive';
import { CngxChip } from '@cngx/common/display';

@Component({
  selector: 'app-settings',
  imports: [
    ReactiveFormsModule,
    CngxFormBridge,
    CngxToggle,
    CngxRadioGroup,
    CngxRadio,
    CngxMultiChipGroup,
    CngxChipInGroup,
    CngxChip,
  ],
  template: `
    <form [formGroup]="form">
      <cngx-toggle formControlName="notifications">Notifications</cngx-toggle>

      <cngx-radio-group formControlName="payment" name="payment">
        <cngx-radio value="card">Card</cngx-radio>
        <cngx-radio value="cash">Cash</cngx-radio>
      </cngx-radio-group>

      <cngx-multi-chip-group formControlName="tags">
        @for (t of pool; track t) {
          <cngx-chip cngxChipInGroup [value]="t">{{ t }}</cngx-chip>
        }
      </cngx-multi-chip-group>
    </form>
  `,
})
export class SettingsComponent {
  readonly pool = ['ng', 'rx', 'ts', 'cdk'];
  readonly form = new FormGroup({
    notifications: new FormControl(false, { nonNullable: true }),
    payment: new FormControl<string | null>(null, [Validators.required]),
    tags: new FormControl<string[]>([], { nonNullable: true }),
  });
}
```

You bind `[formControl]` or `[formControlName]` on the atom. The bridge
attaches automatically via element selector. There is no extra directive
to remember on the consumer side.

### CVA hooks at a glance

| Hook | Behaviour |
|-|-|
| `writeValue(v)` | Stamps `lastSeen`, then writes `control.value.set(v)`. The change-listener effect short-circuits via `Object.is(value, lastSeen)` so the round-trip never echoes back into `onChange`. |
| `registerOnChange(fn)` | Installs a single `effect()` over `control.value()`. The first observation is the post-mount baseline (CVA contract). Every subsequent change forwards through `untracked(() => fn(value))`. |
| `registerOnTouched(fn)` | Stored. Fired from the host's `(focusout)` listener. |
| `setDisabledState(b)` | `untracked(() => control.disabled.set(b))`. |

### `untracked()` partition — why all four hooks wrap

The load-bearing case is `registerOnChange`: the effect's body reads
`control.value()` (tracked) and invokes the consumer-supplied `fn(value)`
inside `untracked(() => fn(value))`. Without that wrap, any signal `fn`
touches would feed back into the bridge effect's dependency set —
producing an infinite loop the moment Angular Forms migrates an
internal `_pendingValue` / dirty-state field to a signal.

The other three hooks (`writeValue`, `registerOnTouched` callback fire,
`setDisabledState`) wrap defensively. Angular Forms calls them
imperatively today, so the wrap is a no-op — but it future-proofs
against the Forms internals migrating to a signal-effect-based control
update path. Same defensive pattern Phase 6b uses for the
`errorScope.showErrors` / strategy callback in
`CngxFormFieldPresenter`.

### Initial-fire skip

`registerOnChange(fn)` registers a listener for *future* changes. The
initial value is delivered via `writeValue`. The bridge's effect skips
its first observation — `fn(initialValue)` is never called, matching
Angular Forms' `DefaultValueAccessor` semantics.

### Selector list does not include `[ngModel]`

Template-driven forms are not in scope. Bind `[formControl]` (or
`[formControlName]` inside a `[formGroup]`) explicitly. The negative
case is documented inline on the directive's selector — `<cngx-toggle
[(ngModel)]>` does **not** activate the bridge.

### exportAs

`exportAs: 'cngxFormBridge'` is available if you need to template-ref
the bridge for testing or instrumentation. Most consumers never touch
it directly.

---

## CngxTypedControl

Structural helper that exposes a typed `FormControl` from the parent
`FormGroup` by name. Eliminates the need for `as FormControl<T>` casts
in templates.

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxTypedControl` | `string` | Required | Name of the control to look up in the parent `FormGroup`. |

### Signals

| Signal | Type | Description |
|-|-|-|
| `control` | `Signal<AbstractControl<T> \| null>` | The resolved control, or `null` if not found. |

### Usage

```ts
import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { CngxTypedControl } from '@cngx/forms/controls';
import { CngxFormField } from '@cngx/forms/field';
import { CngxInput } from '@cngx/forms/input';

@Component({
  selector: 'app-form',
  imports: [CngxTypedControl, CngxFormField, CngxInput],
  template: `
    <form [formGroup]="form">
      <cngx-form-field
        [formGroup]="form"
        [cngxTypedControl]="'email'"
        #emailField="cngxTypedControl"
      >
        <label cngxLabel>Email</label>
        <input cngxInput [formControl]="emailField.control()!" />
      </cngx-form-field>
    </form>
  `,
})
export class FormComponent {
  readonly form = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });
}
```

### Error handling

Throws at construction if the named control is not found:

```
[cngxTypedControl] No control found with name "invalidName" in the parent FormGroup.
```

Catches typos at first render rather than later as undefined-access
runtime errors.

### exportAs

`exportAs: 'cngxTypedControl'`.

---

## How the two directives relate

Different concerns, no overlap.

`CngxFormBridge` is the **value-flow** bridge between Reactive Forms
and a cngx atom. It owns the CVA contract and the `untracked()`
discipline.

`CngxTypedControl` is a **template-typing** helper. It does not flow
values. It only re-types `form.get(name)` so consumers can write
`emailField.control()!` instead of `(form.get('email') as
FormControl<string>)`.

You can use both on the same form. They are independent.

---

## Layer note

Both directives live in `@cngx/forms` (Level 3). They consume:

- `CNGX_CONTROL_VALUE` from `@cngx/common/interactive` (Level 2) — the
  value-shape contract atoms expose.
- `CNGX_FORM_FIELD_CONTROL` and `CNGX_FORM_FIELD_HOST` from
  `@cngx/core/tokens` (Level 1) — the atom-side and host-side
  form-field contracts hoisted there in Phase 7 commit 2a so atoms in
  `@cngx/common/interactive` can provide / inject them without
  crossing the Sheriff layer boundary.

If you are adding a new value-bearing atom in `@cngx/common/interactive`,
make it provide both `CNGX_CONTROL_VALUE` and `CNGX_FORM_FIELD_CONTROL`,
add its selector to `CngxFormBridge`, and the rest of the integration
falls out for free.

---

## See also

- `@cngx/forms/field` README — `CngxFormField`, `CngxBindField`,
  `CngxListboxFieldBridge`, `adaptFormControl`, error scope, error
  strategy.
- `@cngx/common/interactive` — the nine value-bearing atoms the bridge
  attaches to.
- Tests: `projects/forms/controls/src/*.spec.ts` (bridge unit + integration).
- Demo: `dev-app/src/app/demos/forms/form-primitives-demo/` — runs both
  Signal Forms and Reactive Forms paths side by side.
