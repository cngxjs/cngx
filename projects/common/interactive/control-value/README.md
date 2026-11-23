# Control Value

DI contract for cngx interactive atoms that route their primary value through a Signal. `CngxFormBridge` (`@cngx/forms/controls`, the Reactive Forms `ControlValueAccessor`), `CngxFormField` (`@cngx/forms/field`) and any custom forms adapter pull this token off the host element to reach the atom's value and disabled flag without importing the concrete directive class. Structural counterpart to `CNGX_FORM_FIELD_CONTROL` from `@cngx/forms/field`: this one is the raw value shape, that one is the full form-field control surface.

## Import

```ts
import { CNGX_CONTROL_VALUE, type CngxControlValue } from '@cngx/common/interactive';
```

## Contract

| Member | Type | Why |
|-|-|-|
| `value` | `ModelSignal<T>` | Two-way binding flows through `[(value)]`. `model<T>()` is required: bridges call `value()` to read and `value.set(v)` to write, and the latter must emit the change-event Angular wires for `model`. |
| `disabled` | `WritableSignal<boolean>` | Consumers typically derive disabled externally (`computed(() => parentDisabled() \|\| fieldDisabled())`) and forward it in. A plain `WritableSignal` keeps the implementer free to choose. |

No `providedIn`, no factory. Providing the token is the atom's responsibility. The token has no default because "what is the value of an unbound control?" has no library-level answer.

## Quick start

Implementing the contract from a custom control:

```ts
import { Component, model, signal } from '@angular/core';
import { CNGX_CONTROL_VALUE, type CngxControlValue } from '@cngx/common/interactive';

@Component({
  selector: 'my-rating',
  template: `...`,
  providers: [{ provide: CNGX_CONTROL_VALUE, useExisting: MyRating }],
})
export class MyRating implements CngxControlValue<number> {
  readonly value = model<number>(0);
  readonly disabled = signal(false);
}
```

Provide `CNGX_FORM_FIELD_CONTROL` on the same instance as well and `<cngx-form-field [field]="form.rating">` syncs the value: it seeds the model value, writes back on change and dirties the field (see [Binding an atom](../../../forms/field/README.md#binding-an-atom)). `CngxBindField` never touches the value.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/control-value/) for the full token surface.
- `CNGX_FORM_FIELD_CONTROL` (`@cngx/forms/field`) for the full form-field control contract on top of this value shape.
- `CngxFormField` (`@cngx/forms/field`) for the field that syncs a control providing both tokens.
