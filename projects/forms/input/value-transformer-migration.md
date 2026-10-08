# Migration - value-transformer directives stop being `ControlValueAccessor`s

`CngxInputFormat`, `CngxNumericInput`, and `CngxInputMask` used to self-register
as `ControlValueAccessor`s through `NG_VALUE_ACCESSOR`. They no longer do.

Each directive now:

- Exposes its primary value through `value: ModelSignal<T>` (the
  `FormValueControl<T>` shape Signal Forms binds against natively).
- Provides `CNGX_VALUE_TRANSFORMER` via `useFactory` so future bridges can route
  writes through the typed `format(raw)` / `parse(display)` pair.
- Calls `inject(CNGX_FORM_FIELD_HOST, { optional: true })?.markAsTouched()` on
  blur, in place of the dropped CVA `onTouched` callback.

The selector, the inputs, and each directive's read-side public signals stay
where they were. Each directive keeps its own accessor: `CngxNumericInput`
exposes `numericValue`, `CngxInputFormat` exposes `rawValue` and
`displayValue`, `CngxInputMask` exposes `rawValue`. These accessors now mirror
the new `value` model and stay one release as deprecated aliases. Standalone
usage with a template-variable reference (`#num="cngxNumericInput"`) is
unchanged.

What did change is the form-binding pattern. `[(ngModel)]` and `[formControl]`
no longer wire the input - the framework can't find a value accessor on
the directive anymore. Pick one of the two paths below.

## Path 1 - Signal Forms (recommended)

The model signal is what Signal Forms' `[formField]` directive expects. Wrap
the input in `<cngx-form-field>` for label and error chrome:

```ts
import { form, schema, required } from '@angular/forms/signals';
import { signal } from '@angular/core';

protected readonly model = signal({ amount: null as number | null });
protected readonly amountForm = form(this.model, schema(root => {
  required(root.amount, { message: 'Required.' });
}));
```

```html
<cngx-form-field [field]="amountForm.amount">
  <label cngxLabel>Amount</label>
  <input cngxInput cngxNumericInput [formField]="amountForm.amount" />
  <cngx-field-errors />
</cngx-form-field>
```

`cngxInput` carries the ARIA/state surface from the form-field down to the
input element. `[formField]` carries the value channel - it binds two-way to the
directive's `value` model, no `ControlValueAccessor` involved.

For a quick standalone two-way binding without Signal Forms involved, the bare
`[(value)]` syntax still works:

```html
<input cngxNumericInput [(value)]="amount" />
```

## Path 2 - Reactive Forms via `adaptFormControl`

Existing Reactive Forms code that already owns a `FormControl` can keep using
it. `adaptFormControl(control, name, destroyRef)` wraps the RF control into
the same `Field<T>` shape Signal Forms uses, so the form-field accepts it
unchanged:

```ts
import { adaptFormControl, type CngxFieldAccessor } from '@cngx/forms/field';
import { FormControl, Validators } from '@angular/forms';
import { DestroyRef, inject, signal } from '@angular/core';

private readonly destroyRef = inject(DestroyRef);
readonly startControl = new FormControl('', {
  nonNullable: true,
  validators: [Validators.required],
});
readonly startField = signal<CngxFieldAccessor>(
  adaptFormControl(this.startControl, 'start', this.destroyRef),
);
```

The value channel is `[formControl]` on the input itself; the adapter only
feeds the `cngx-form-field` chrome (validity, touched, dirty, disabled):

```html
<cngx-form-field [field]="startField()">
  <label cngxLabel>Start</label>
  <input cngxInput cngxInputMask="time:24" [formControl]="startControl" />
  <cngx-field-errors />
</cngx-form-field>
```

`CngxInputMask` needs `CngxFormBridge` from `@cngx/forms/controls` in the
component's `imports`. The bridge attaches by selector and keeps the raw value
(`1430`) in the control, the same value Signal Forms stores; `setValue` expects
the raw value. Without the bridge Angular falls back to its
`DefaultValueAccessor`, typed text never reaches the control, and the mask warns
in dev mode.

`CngxNumericInput` and `CngxInputFormat` still run on Angular's
`DefaultValueAccessor` under `[formControl]`, so the control receives the
display string the field shows, not the directive's `value` model.

## Path 3 - Standalone usage (no form, no field)

Nothing to change. The template-variable accessor surface is intact:

```html
<input cngxNumericInput #num="cngxNumericInput" />
<span>Value: {{ num.numericValue() }}</span>
```

## Behavioural notes

- `includeLiterals` is removed. It had no effect since the CVA removal; read
  `maskedValueCore()` for the literal-included value.
- The `valueChange` *template binding* (`(valueChange)="onChange($event)"`)
  keeps working - Angular synthesises the output from `value = model<T>()`.
  Only the explicit `directive.valueChange.subscribe(...)` API surface is
  gone; use `directive.value.subscribe(...)` instead.
- Under Reactive Forms, `CngxFormBridge` marks the control touched when focus
  leaves the atom's host, no longer on every move inside it. A radio, checkbox,
  button-toggle or chip group becomes touched when focus leaves the group, not
  when focus moves between its items.
