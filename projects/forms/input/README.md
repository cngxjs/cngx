# @cngx/forms/input

Smart input directives for Angular form fields. ARIA projection, autocomplete/spellcheck
inference, password visibility toggle, and live character counter.

## What it does

These directives enhance native `<input>`, `<textarea>`, and `<select>` elements with:
- Automatic ARIA attribute projection from `CngxFormFieldPresenter`
- Smart `autocomplete` inference from field names (14 built-in mappings)
- Smart `spellcheck="false"` for email, password, URL, phone, code fields
- Password show/hide toggle with correct ARIA labelling
- Live character counter with custom template support

## Exports

### Directives

| Export | Selector | Description |
|-|-|-|
| `CngxInput` | `input[cngxInput]`, `textarea[cngxInput]`, `select[cngxInput]` | ARIA projection, focus/empty tracking, smart attributes |
| `CngxPasswordToggle` | `input[cngxPasswordToggle]` | Toggles `type="password"` / `type="text"` |

### Components

| Export | Selector | Description |
|-|-|-|
| `CngxCharCount` | `cngx-char-count` | Live character counter with custom template support |

### Types

`CngxCharCountContext`

## CngxInput

Projects these attributes automatically when inside a `cngx-form-field`:

`id`, `aria-describedby`, `aria-labelledby`, `aria-invalid`, `aria-required`,
`aria-busy`, `aria-errormessage`, `aria-readonly`, `disabled`, `autocomplete`, `spellcheck`

### CSS Classes

| Class | When |
|-|-|
| `cngx-input--error` | `touched && invalid` |
| `cngx-input--focused` | Input has DOM focus |

### Inputs

| Input | Description |
|-|-|
| `autocomplete` | Explicit override (default: auto-inferred from field name) |
| `spellcheck` | Explicit override (default: auto-disabled for email/password/url/phone/code) |

### Smart Autocomplete Mappings

| Field name | autocomplete value |
|-|-|
| `email` | `email` |
| `username` | `username` |
| `password` | `current-password` |
| `newpassword` / `confirmpassword` | `new-password` |
| `name` | `name` |
| `firstname` | `given-name` |
| `lastname` | `family-name` |
| `phone` / `tel` | `tel` |
| `address` | `street-address` |
| `city` | `address-level2` |
| `zip` / `postalcode` | `postal-code` |
| `country` | `country-name` |
| `organization` | `organization` |
| `url` / `website` | `url` |

Extend via `withAutocompleteMappings()` from `@cngx/forms/field`.

### Standalone Mode

Works without `cngx-form-field` as a no-op -- no crash, no ARIA projection, just focus/empty tracking.

## CngxPasswordToggle

```html
<input cngxInput cngxPasswordToggle #pwd="cngxPasswordToggle" type="password" />
<button (click)="pwd.toggle()"
  [attr.aria-label]="pwd.visible() ? 'Hide password' : 'Show password'">
  {{ pwd.visible() ? 'Hide' : 'Show' }}
</button>
```

**Signals:** `visible`
**Methods:** `toggle()`, `show()`, `hide()`

Auto-sets `spellcheck="false"` and `autocomplete="current-password"`.

## CngxCharCount

Listens to DOM `input` events on the sibling input for reliable value tracking.

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

**Inputs:** `max`, `min`
**CSS class:** `cngx-char-count--over`
**CSS vars:** `--cngx-field-char-count-font-size`, `--cngx-field-char-count-color`, `--cngx-field-char-count-over-color`

### Template Context (`CngxCharCountContext`)

| Property | Type | Description |
|-|-|-|
| `$implicit` | `number` | Current length (use as `let-count`) |
| `current` | `number` | Current length |
| `max` | `number \| undefined` | Max constraint |
| `min` | `number \| undefined` | Min constraint |
| `over` | `boolean` | Whether value exceeds max |
| `remaining` | `number \| undefined` | Characters until max |

## Dependency

Imports `CngxFormFieldPresenter`, `CNGX_FORM_FIELD_CONFIG`, `CNGX_FORM_FIELD_CONTROL` from `@cngx/forms/field`.
Must be used alongside `@cngx/forms/field` for full functionality.
