# @cngx/forms

Reactive form utilities for Angular 21+. Provides typed controls, validators,
a Signal Forms-native form field system with built-in ARIA coordination, and
smart input directives with autocomplete/spellcheck inference.

## Entry Points

| Entry Point | Description | Material dep |
|-|-|-|
| `@cngx/forms` | VERSION constant | No |
| `@cngx/forms/controls` | `CngxTypedControl` | No |
| `@cngx/forms/validators` | `requiredTrue`, `patternMatch` | No |
| `@cngx/forms/field` | A11y coordination: form-field, label, hint, errors, bridges (`CngxBindField`, `CngxListboxFieldBridge`) | Optional (only `matInput`/`mat-select` demos) |
| `@cngx/forms/input` | Input directives: CngxInput, password toggle, char counter | No |

---

## `@cngx/forms/field` -- A11y Coordination

Invisible A11y coordination layer. Strong opinions about ARIA, zero opinions about styling.

### Philosophy

- `cngx-form-field` renders as `display: contents` -- zero visual footprint
- No floating labels, no appearance variants, no visual chrome
- All ARIA attributes projected automatically and deterministically
- Error messages gated behind `touched && invalid`
- CSS state classes on container, label, and input for easy styling
- i18n-ready constraint hints and error messages

### Quick Start

```typescript
// app.config.ts
import { provideFormField, withErrorMessages, withConstraintHints, withRequiredMarker } from '@cngx/forms/field';

provideFormField(
  withErrorMessages({
    required: () => 'This field is required.',
    email: () => 'Invalid email address.',
    minLength: (e) => `Minimum ${(e as unknown as { minLength: number }).minLength} characters.`,
  }),
  withConstraintHints(),   // auto-generates "8-64 characters" from validators
  withRequiredMarker(),    // auto-shows '*' on required labels
)
```

```html
<!-- Template -->
<cngx-form-field [field]="emailField">
  <label cngxLabel>E-Mail</label>
  <input cngxInput [formField]="emailField" placeholder="max@example.com" />
  <span cngxHint>Business address</span>
  <cngx-field-errors />
</cngx-form-field>
```

### Components and Directives

#### CngxFormField (`cngx-form-field`)

Invisible container. Hosts `CngxFormFieldPresenter` as `hostDirective`.
CSS state classes set by the presenter:

| Class | When |
|-|-|
| `cngx-field--error` | `touched && invalid` |
| `cngx-field--touched` | User blurred the field |
| `cngx-field--dirty` | User changed the value |
| `cngx-field--disabled` | Field disabled |
| `cngx-field--required` | Required validator active |
| `cngx-field--pending` | Async validation running |
| `cngx-field--readonly` | Field readonly |
| `cngx-field--hidden` | Field hidden |
| `cngx-field--valid` | No errors and no pending |

**Input:** `field` (required) -- `Field<T>` from `@angular/forms/signals` or `CngxFieldAccessor`

#### CngxLabel (`[cngxLabel]`)

Label with automatic `for`/`id` linkage. Auto-renders required marker when
`withRequiredMarker()` is configured.

**CSS classes:** `cngx-label--required`, `cngx-label--error`, `cngx-label--disabled`
**Inputs:** `showRequired` (opt-out per label)
**Signals:** `required`

```html
<!-- With global withRequiredMarker(): -->
<label cngxLabel>E-Mail</label>  <!-- auto-renders: E-Mail * -->

<!-- Manual marker: -->
<label cngxLabel>E-Mail <cngx-required /></label>

<!-- Opt-out: -->
<label cngxLabel [showRequired]="false">Optional</label>
```

#### CngxRequired (`cngx-required`)

Standalone required marker. Supports custom template.

```html
<cngx-required />                          <!-- renders '*' -->
<cngx-required marker="(required)" />      <!-- custom text -->
<cngx-required>                             <!-- custom template -->
  <ng-template><svg>...</svg></ng-template>
</cngx-required>
```

#### CngxHint (`[cngxHint]`)

Hint element. Sets `id` for `aria-describedby` linkage.

#### CngxError (`[cngxError]`)

Manual error container. `aria-hidden` and `role="alert"` managed automatically.

```html
<div cngxError>
  @for (err of field().errors(); track err.kind) {
    <span>{{ err.message }}</span>
  }
</div>
```

#### CngxFieldErrors (`cngx-field-errors`)

Auto-renders errors from the `CNGX_ERROR_MESSAGES` registry.
Supports custom template per error item.

```html
<!-- Default: -->
<cngx-field-errors />

<!-- Custom template: -->
<cngx-field-errors>
  <ng-template let-message="message" let-kind="kind">
    <span class="my-error"><svg>...</svg> {{ message }}</span>
  </ng-template>
</cngx-field-errors>
```

**Template context:** `message`, `kind`, `error`, `index`, `first`, `last`

#### CngxFormErrors (`cngx-form-errors`)

Form-level error summary (WCAG 3.3.1). Each error is a clickable link that
focuses the invalid field.

```html
<cngx-form-errors [fields]="[emailField, pwField]" [show]="submitted()" />
```

**Inputs:** `fields` (required, `CngxFieldAccessor[]`), `show` (boolean)
**Template context:** `errors` (`FormErrorItem[]`), `count`

### Utilities

#### `focusFirstError(tree)`

Focuses the first invalid leaf field after a failed submit. Skips group-level validators.

```typescript
const success = await submit(form, async () => { ... });
if (!success) focusFirstError(form);
```

#### `adaptFormControl(control, name, destroyRef)`

Adapts a Reactive Forms `AbstractControl` for use without Signal Forms.
`destroyRef` is required — pass `inject(DestroyRef)` for automatic
subscription cleanup.

```typescript
readonly control = new FormControl('', [Validators.required, Validators.email]);
readonly field = adaptFormControl(this.control, 'email', inject(DestroyRef));
```

### Feature Functions

| Function | Description |
|-|-|
| `withErrorMessages(map)` | Register error-kind-to-message formatters |
| `withConstraintHints(formatters?)` | Auto-generate hints from validators (i18n via formatters) |
| `withRequiredMarker(text?)` | Auto-show required marker on labels |
| `withAutocompleteMappings(map)` | Extend/override autocomplete inference |
| `withNoSpellcheck(fields)` | Extend spellcheck-disabled field list |

```typescript
provideFormField(
  withErrorMessages({ required: () => 'Required.' }),
  withConstraintHints({
    lengthRange: (min, max) => `${min}-${max} Zeichen`,
    extra: (c) => c.patterns.length ? ['Must match format'] : [],
  }),
  withRequiredMarker('*'),
  withAutocompleteMappings({ iban: 'cc-number' }),
  withNoSpellcheck(['serialnumber']),
)
```

### Tokens

| Token | Description |
|-|-|
| `CNGX_FORM_FIELD_CONTROL` | Provided by `CngxInput`, `CngxBindField`, `CngxListboxFieldBridge` |
| `CNGX_ERROR_MESSAGES` | Error message registry |
| `CNGX_FORM_FIELD_CONFIG` | Application-wide config |

---

## `@cngx/forms/input` -- Input Directives

Smart input directives that project ARIA attributes and provide UX enhancements.

### CngxInput (`input[cngxInput]`, `textarea[cngxInput]`, `select[cngxInput]`)

ARIA projection machine. Works with or without `cngx-form-field`.

**Projected attributes:**
`id`, `aria-describedby`, `aria-labelledby`, `aria-invalid`, `aria-required`,
`aria-busy`, `aria-errormessage`, `aria-readonly`, `disabled`, `autocomplete`, `spellcheck`

**CSS classes:** `cngx-input--error`, `cngx-input--focused`
**Signals:** `focused`, `empty`, `errorState`, `disabled`
**Inputs:** `autocomplete` (explicit override), `spellcheck` (explicit override)

Smart autocomplete inference from field name:

| Field name | autocomplete |
|-|-|
| `email` | `email` |
| `password` | `current-password` |
| `newpassword` | `new-password` |
| `phone` / `tel` | `tel` |
| `name` | `name` |
| `firstname` | `given-name` |
| `lastname` | `family-name` |
| `address` | `street-address` |
| `zip` / `postalcode` | `postal-code` |
| `url` / `website` | `url` |

Auto-disables `spellcheck` for: email, password, username, url, phone, zip, code.

### CngxPasswordToggle (`input[cngxPasswordToggle]`)

Toggles password visibility. Auto-sets `spellcheck="false"` and `autocomplete`.

**Signals:** `visible`
**Methods:** `toggle()`, `show()`, `hide()`

```html
<input cngxInput cngxPasswordToggle #pwd="cngxPasswordToggle" type="password" />
<button (click)="pwd.toggle()"
  [attr.aria-label]="pwd.visible() ? 'Hide password' : 'Show password'">
  {{ pwd.visible() ? 'Hide' : 'Show' }}
</button>
```

### CngxCharCount (`cngx-char-count`)

Live character counter. Listens to DOM input events directly.
Supports custom template.

**Inputs:** `max`, `min`
**CSS class:** `cngx-char-count--over` (when exceeding max)
**CSS vars:** `--cngx-field-char-count-font-size`, `--cngx-field-char-count-color`, `--cngx-field-char-count-over-color`

```html
<!-- Default: "12/140" -->
<cngx-char-count [max]="140" />

<!-- Custom template: -->
<cngx-char-count [max]="140">
  <ng-template let-remaining="remaining" let-over="over">
    @if (over) { {{ -remaining! }} over limit }
    @else { {{ remaining }} remaining }
  </ng-template>
</cngx-char-count>
```

**Template context:** `current`, `max`, `min`, `over`, `remaining`, `$implicit` (= current)

---

## Bridges in `@cngx/forms/field`

### `[cngxBindField]` -- Universal Bridge

Adapts any Material / native HTML / custom control for use inside `cngx-form-field`.
All form-field state (`id`, `empty`, `focused`, `disabled`, `errorState`) is derived
purely from the bound field via the presenter -- no control-specific injection.
Value-flow runs through the control's own bindings.

```html
<cngx-form-field [field]="nameField">
  <label cngxLabel>Name</label>
  <mat-form-field appearance="outline">
    <input matInput cngxBindField [formField]="nameField" />
  </mat-form-field>
  <cngx-field-errors />
</cngx-form-field>

<cngx-form-field [field]="colorField">
  <label cngxLabel>Farbe</label>
  <mat-select cngxBindField [formControl]="colorControl">
    <mat-option value="red">Rot</mat-option>
  </mat-select>
  <cngx-field-errors />
</cngx-form-field>
```

### `CngxListboxFieldBridge`

Specialised bridge for `CngxListbox` that handles multi-select arrays and
`compareWith` value-sync beyond what `cngxBindField` covers.

### Optional Material Theme

```scss
@use '@cngx/forms/field/material-theme' as form-field;

html {
  @include mat.all-component-themes($theme);
  @include form-field.theme($theme);
}

[data-theme='dark'] {
  @include form-field.theme($dark-theme);
}
```

**CSS Custom Properties:**

| Variable | Default (M3) | Description |
|-|-|-|
| `--cngx-field-label-color` | `--mat-sys-on-surface` | Label text |
| `--cngx-field-label-font-size` | `0.875rem` | Label size |
| `--cngx-field-label-weight` | `500` | Label weight |
| `--cngx-field-label-required-color` | `--mat-sys-error` | Required marker |
| `--cngx-field-hint-color` | `--mat-sys-on-surface-variant` | Hint text |
| `--cngx-field-hint-font-size` | `0.75rem` | Hint size |
| `--cngx-field-error-color` | `--mat-sys-error` | Error text |
| `--cngx-field-error-font-size` | `0.75rem` | Error size |
| `--cngx-field-pending-color` | `--mat-sys-primary` | Pending indicator |
| `--cngx-field-disabled-opacity` | `0.38` | Disabled state |
| `--cngx-field-input-border-color` | `--mat-sys-outline` | Input border |
| `--cngx-field-input-error-border-color` | `--mat-sys-error` | Error border |
| `--cngx-field-input-focus-border-color` | `--mat-sys-primary` | Focus border |
| `--cngx-field-success-color` | `--mat-sys-primary` | Success border |
| `--cngx-field-char-count-font-size` | `0.75rem` | Char counter size |
| `--cngx-field-shake-duration` | `0.3s` | Error shake duration |

Theme includes:
- Label error/disabled color states
- Input border color transitions (focus/error/success)
- Character counter color (normal/over-limit)
- Disabled opacity
- Error shake animation (`prefers-reduced-motion` respected)
