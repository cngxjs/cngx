# CngxTypedControl — Typed Form Control Helper

Structural helper directive that exposes a typed FormControl from the parent FormGroup without explicit casts.

## Import

```typescript
import {
  CngxTypedControl,
} from '@cngx/forms/controls';
```

## API

### CngxTypedControl<T>

Resolves a typed FormControl from the parent FormGroup by name. Eliminates the need for `as FormControl<T>` casts in templates.

#### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `cngxTypedControl` | `string` | Required | Name of the control to look up in the parent FormGroup. |

#### Signals

| Signal | Type | Description |
|-|-|-|
| `control` | `Signal<AbstractControl<T> \| null>` | The resolved control, or `null` if not found. |

#### Example

```typescript
import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { CngxTypedControl } from '@cngx/forms/controls';
import { CngxFormField } from '@cngx/forms/field';
import { CngxInput } from '@cngx/forms/input';

@Component({
  selector: 'app-form',
  template: `
    <form [formGroup]="form">
      <cngx-form-field [formGroup]="form"
                       [cngxTypedControl]="'email'"
                       #emailField="cngxTypedControl">
        <label cngxLabel>Email</label>
        <input cngxInput [formControl]="emailField.control()!" />
      </cngx-form-field>
    </form>
  `,
  imports: [CngxTypedControl, CngxFormField, CngxInput],
})
export class FormComponent {
  readonly form = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });
}
```

#### Without CngxTypedControl (requires cast)

```typescript
template: `
  <form [formGroup]="form">
    <input [formControl]="(form.get('email') as FormControl<string>)" />
  </form>
`;
```

#### With CngxTypedControl (no cast)

```typescript
template: `
  <form [formGroup]="form">
    <input [formGroup]="form"
           [cngxTypedControl]="'email'"
           #emailField="cngxTypedControl"
           [formControl]="emailField.control()!" />
  </form>
`;
```

---

## Error Handling

The directive throws an error at construction if the named control is not found in the parent FormGroup:

```
[cngxTypedControl] No control found with name "invalidName" in the parent FormGroup.
```

This prevents runtime TypeErrors from accessing undefined controls.

---

## Exports

`exportAs: 'cngxTypedControl'` for template reference.

---

## See Also

- [CngxFormField documentation](/projects/forms/field/README.md)
- Angular Forms [FormGroup](https://angular.io/api/forms/FormGroup)
- Tests: `/projects/forms/controls/src/*.spec.ts`
