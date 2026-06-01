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

The selector, the inputs, and the read-side public signals (`numericValue`,
`rawValue`, `displayValue`) stay where they were. Standalone usage with a
template-variable reference (`#num="cngxNumericInput"`) is unchanged.

What did change is the form-binding pattern. `[(ngModel)]` and `[formControl]`
no longer wire the input - the framework can't find a value accessor on
the directive anymore. Pick one of the two paths below.

## Path 1 - Signal Forms (recommended)

The model signal is what Signal Forms' `[control]` directive expects. Wrap
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
  <input cngxNumericInput cngxBindField [control]="amountForm.amount" />
  <cngx-field-errors />
</cngx-form-field>
```

`cngxBindField` carries the ARIA/state surface from the form-field down to the
input element. `[control]` carries the value channel - it binds two-way to the
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
import { FormControl } from '@angular/forms';
import { DestroyRef, inject, signal } from '@angular/core';

private readonly destroyRef = inject(DestroyRef);
readonly amountControl = new FormControl<number | null>(null);
readonly amountField = signal<CngxFieldAccessor>(
  adaptFormControl(this.amountControl, 'amount', this.destroyRef),
);
```

```html
<cngx-form-field [field]="amountField()">
  <label cngxLabel>Amount</label>
  <input cngxNumericInput cngxBindField [control]="amountField()" />
  <cngx-field-errors />
</cngx-form-field>
```

The RF `FormControl` stays the source of truth for value and validation; the
adapter forwards reads, validity, touched, dirty, and disabled state into the
form-field; the model on the directive handles the value channel via
`[control]`.

## Path 3 - Standalone usage (no form, no field)

Nothing to change. The template-variable accessor surface is intact:

```html
<input cngxNumericInput #num="cngxNumericInput" />
<span>Value: {{ num.numericValue() }}</span>
```

## Behavioural notes

- `CngxInputMask` with `includeLiterals=true`: the `valueChange`-equivalent
  output (the model's emission) now emits the raw string in all cases. The
  pre-migration code emitted the literals-included masked-core string when
  `includeLiterals` was set; that branch was tied to the CVA write-back path.
  Read `maskedValueCore()` if a consumer still needs the literals-included
  view of the current value.
- The `valueChange` *template binding* (`(valueChange)="onChange($event)"`)
  keeps working - Angular synthesises the output from `value = model<T>()`.
  Only the explicit `directive.valueChange.subscribe(...)` API surface is
  gone; use `directive.value.subscribe(...)` instead.
