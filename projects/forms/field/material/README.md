# CngxMatInputBridge — Angular Material Input Bridge

Bridge directive that integrates Angular Material's `matInput` with `cngx-form-field` for unified ARIA coordination and error management.

## Import

```typescript
import {
  CngxMatInputBridge,
} from '@cngx/forms/field/material';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms/signals';
import { Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { CngxFormField, CngxLabel, CngxFieldErrors } from '@cngx/forms/field';
import { CngxMatInputBridge } from '@cngx/forms/field/material';

@Component({
  selector: 'app-form',
  template: `
    <form [formGroup]="form">
      <cngx-form-field [field]="form.controls.email">
        <label cngxLabel>Email</label>
        <input matInput
               cngxFieldBridge
               [formControl]="form.controls.email"
               placeholder="name@example.com" />
        <cngx-field-errors />
      </cngx-form-field>
    </form>
  `,
  imports: [
    CngxFormField,
    CngxLabel,
    CngxFieldErrors,
    CngxMatInputBridge,
    MatInputModule,
  ],
})
export class FormComponent {
  readonly form = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
  });
}
```

## API

### CngxMatInputBridge

Directive that projects ARIA attributes from `cngx-form-field` onto a `matInput` element. Implements `CngxFormFieldControl` interface for parent discovery.

#### Selector

`[cngxFieldBridge]` — Apply to the same element as `matInput`.

#### Implementation Details

- Discovers parent `CngxFormFieldPresenter` via dependency injection (optional).
- Discovers `MatInput` directive on the same element.
- Projects ARIA attributes from the presenter when available.
- Falls back to `MatInput` defaults when presenter is not present.
- Tracks focus and empty state for presenter signals.

#### Host Bindings

| Binding | Source | Description |
|-|-|-|
| `[id]` | `presenter.inputId()` or `matInput.id` | Unique element ID. |
| `[attr.aria-describedby]` | `presenter.describedBy()` | Links to hint and error IDs. |
| `[attr.aria-labelledby]` | `presenter.labelId()` | Links to label element. |
| `[attr.aria-invalid]` | `presenter.showError()` | `true` when errors visible. |
| `[attr.aria-required]` | `presenter.required()` | `true` when field required. |
| `[attr.aria-busy]` | `presenter.pending()` | `true` during async validation. |
| `[attr.aria-errormessage]` | `presenter.errorId()` | Links to error element. |
| `[attr.aria-readonly]` | `presenter.readonly()` | `true` when read-only. |
| `[attr.disabled]` | `presenter.disabled()` | `true` when disabled. |

#### Signals (CngxFormFieldControl implementation)

| Signal | Type | Description |
|-|-|-|
| `id` | `Signal<string>` | Element ID from presenter or `matInput.id`. |
| `focused` | `Signal<boolean>` | Whether element has DOM focus. |
| `empty` | `Signal<boolean>` | Whether element value is empty. |
| `disabled` | `Signal<boolean>` | Disabled state from presenter or `matInput.disabled`. |
| `errorState` | `Signal<boolean>` | Error visibility from presenter or `matInput.errorState`. |

#### Methods

- `focus(options?: FocusOptions): void` — Programmatically focus the input.

#### Exports

`exportAs: 'cngxFieldBridge'` for template reference.

---

## Behavior

### With cngx-form-field Parent

All ARIA attributes come from the parent presenter:

```html
<cngx-form-field [field]="emailField">
  <label cngxLabel>Email</label>
  <input matInput cngxFieldBridge placeholder="..." />
  <cngx-field-errors />
</cngx-form-field>
```

- `id` set from field name: `cngx-email-input`
- `aria-describedby` includes both hint and error IDs
- `aria-invalid` gated by touched-AND-invalid logic
- Error display only shows when field is touched

### Standalone Mode (no parent)

Falls back to `MatInput` defaults:

```html
<input matInput cngxFieldBridge />
```

- `id` from `matInput.id` or auto-generated
- `aria-invalid` from `matInput.errorState`
- No automatic ARIA coordination
- No error gating

---

## Example: Complete Form

```typescript
import { Component } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms/signals';
import { Validators, emailValidator } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CngxFormField, CngxLabel, CngxFieldErrors, provideFormField, withErrorMessages } from '@cngx/forms/field';
import { CngxMatInputBridge } from '@cngx/forms/field/material';

@Component({
  selector: 'app-login',
  template: `
    <form [formGroup]="form">
      <cngx-form-field [field]="form.controls.email">
        <label cngxLabel>Email</label>
        <input matInput
               cngxFieldBridge
               type="email"
               [formControl]="form.controls.email"
               placeholder="name@example.com" />
        <cngx-field-errors />
      </cngx-form-field>

      <cngx-form-field [field]="form.controls.password">
        <label cngxLabel>Password</label>
        <input matInput
               cngxFieldBridge
               type="password"
               [formControl]="form.controls.password"
               placeholder="••••••••" />
        <cngx-field-errors />
      </cngx-form-field>

      <button type="submit" [disabled]="form.invalid()">Sign In</button>
    </form>
  `,
  imports: [
    CngxFormField,
    CngxLabel,
    CngxFieldErrors,
    CngxMatInputBridge,
    MatInputModule,
    MatFormFieldModule,
  ],
  providers: [
    provideFormField(
      withErrorMessages({
        required: () => 'This field is required.',
        email: () => 'Please enter a valid email address.',
      }),
    ),
  ],
})
export class LoginComponent {
  readonly form = new FormGroup({
    email: new FormControl('', {
      validators: [Validators.required, Validators.email],
      nonNullable: true,
    }),
    password: new FormControl('', {
      validators: [Validators.required, Validators.minLength(8)],
      nonNullable: true,
    }),
  });

  handleSubmit() {
    if (this.form.valid()) {
      console.log('Form data:', this.form.value);
    }
  }
}
```

---

## Material Form Field Integration

The bridge works with Material's `<mat-form-field>` but does not depend on it. Use Material's form field wrapper if you need Material styling:

```html
<mat-form-field>
  <mat-label>Email</mat-label>
  <input matInput cngxFieldBridge [formControl]="emailControl" />
  <mat-error>{{ error }}</mat-error>
</mat-form-field>
```

However, `cngx-form-field` + `cngxFieldBridge` provides more control over layout and error messaging:

```html
<cngx-form-field [field]="emailField">
  <label cngxLabel>Email</label>
  <input matInput cngxFieldBridge [formControl]="emailControl" />
  <cngx-field-errors />
</cngx-form-field>
```

---

## Accessibility

The bridge ensures:

- **ARIA IDs:** Deterministic IDs from field name (e.g., `cngx-email-input`).
- **Error Visibility:** Errors only shown when field is touched AND invalid.
- **Focus Management:** Errors announced via `aria-live` regions.
- **Disabled State:** Communicates via `aria-disabled` and native `disabled` attribute.
- **Required State:** Communicates via `aria-required`.

---

## See Also

- [CngxFormField documentation](/projects/forms/field/README.md)
- [CngxInput documentation](/projects/forms/input/README.md)
- [Angular Material Input](https://material.angular.io/components/input/overview)
- Tests: `/projects/forms/field/material/src/*.spec.ts`
