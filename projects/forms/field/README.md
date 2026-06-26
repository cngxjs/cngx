# @cngx/forms/field

A11y coordination layer for form fields. Strong opinions about ARIA, zero opinions about styling.

## What it does

`cngx-form-field` is an invisible container (`display: contents`) that coordinates ARIA attributes,
deterministic IDs, error gating, and CSS state classes across its child directives. The developer
controls all layout and styling.

## Exports

### Components

| Export | Selector | Description |
|-|-|-|
| `CngxFormField` | `cngx-form-field` | Invisible container. Hosts `CngxFormFieldPresenter` as `hostDirective` |
| `CngxFieldErrors` | `cngx-field-errors` | Auto-renders errors from `CNGX_ERROR_MESSAGES` registry. Custom template support |
| `CngxFormErrors` | `cngx-form-errors` | Form-level error summary (WCAG 3.3.1) with focusable error links |
| `CngxRequired` | `cngx-required` | Required marker with custom template support |

### Directives

| Export | Selector | Description |
|-|-|-|
| `CngxFormFieldPresenter` | `[cngxFormFieldPresenter]` | Core coordination directive (used via `hostDirectives`) |
| `CngxLabel` | `[cngxLabel]` | Label with `for`/`id` linkage, auto-required marker, CSS state classes |
| `CngxHint` | `[cngxHint]` | Hint element with `aria-describedby` linkage |
| `CngxError` | `[cngxError]` | Manual error container with `aria-hidden`/`role="alert"` management |

### Utilities

| Export | Description |
|-|-|
| `focusFirstError(tree)` | Focuses first invalid leaf field after failed submit |
| `adaptFormControl(control, name, destroyRef)` | Adapts Reactive Forms `AbstractControl` to `CngxFieldAccessor` |

### Tokens

| Export | Description |
|-|-|
| `CNGX_FORM_FIELD_CONTROL` | Provided by input directives for parent discovery |
| `CNGX_ERROR_MESSAGES` | Error message registry (`Record<string, ErrorMessageFn>`) |
| `CNGX_FORM_FIELD_CONFIG` | Application-wide form field configuration |

### Feature Functions

| Export | Description |
|-|-|
| `provideFormField(...features)` | Registers app-wide config |
| `provideErrorMessages(map)` | Shorthand for error messages only |
| `withErrorMessages(map)` | Error-kind-to-message formatters |
| `withConstraintHints(formatters?)` | Auto-generate hints from validators (i18n via `ConstraintHintFormatters`) |
| `withRequiredMarker(text?)` | Auto-show required marker on labels |
| `withAutocompleteMappings(map)` | Extend/override autocomplete inference |
| `withNoSpellcheck(fields)` | Extend spellcheck-disabled field list |

### Types

`CngxFieldRef`, `CngxFieldAccessor`, `CngxFormFieldControl`, `ErrorMessageFn`, `ErrorMessageMap`,
`FormFieldConfig`, `FormFieldFeature`, `ConstraintHintFormatters`, `ConstraintMetadata`,
`CngxFieldErrorContext`, `CngxRequiredContext`, `FormErrorItem`, `CngxFormErrorsSummaryContext`

## CSS State Classes

### On `cngx-form-field` (via presenter)

`cngx-field--error`, `cngx-field--touched`, `cngx-field--dirty`, `cngx-field--disabled`,
`cngx-field--required`, `cngx-field--pending`, `cngx-field--readonly`, `cngx-field--hidden`,
`cngx-field--valid`

### On `[cngxLabel]`

`cngx-label--required`, `cngx-label--error`, `cngx-label--disabled`

## Style delivery

Style delivery in this folder follows the artifact's CSS substance, not its
decorator type:

- Token-bearing skins ship an external stylesheet via `styleUrl`. These carry
  `--cngx-*` custom properties, state-class rules, and layout: `CngxFormErrors`,
  `CngxRequired`, `CngxLabel`.
- Pure `:host { display: contents }` hosts inline their one rule via `styles:`.
  These render no box of their own and have nothing to theme: `CngxFieldErrors`,
  `CngxFormField`.

The split is intentional. A host that only declares `display: contents` does not
earn a sibling `.css` file; a skin that delegates tokens does. Keep new field
components on the same rule.

## Usage

```typescript
// app.config.ts
provideFormField(
  withErrorMessages({
    required: () => 'This field is required.',
    email: () => 'Invalid email address.',
  }),
  withConstraintHints(),
  withRequiredMarker(),
)
```

```html
<cngx-form-field [field]="emailField">
  <label cngxLabel>E-Mail</label>
  <input cngxInput [formField]="emailField" placeholder="max@example.com" />
  <span cngxHint>Business address</span>
  <cngx-field-errors />
</cngx-form-field>
```

## Presenter Signals

All derived from Signal Forms `FieldState` via `computed()`:

`name`, `inputId`, `labelId`, `hintId`, `errorId`, `describedBy`,
`required`, `disabled`, `invalid`, `valid`, `touched`, `dirty`, `pending`,
`hidden`, `readonly`, `submitting`, `errors`, `errorSummary`, `disabledReasons`,
`showError`, `minLength`, `maxLength`, `min`, `max`, `pattern`, `constraintHints`

## Bridging Controls to a Field

- `[cngxBindField]` - universal bridge; place on any Material, native, or custom
  control. Derives all form-field state from the bound field. Value-flow runs
  through the control's own bindings (`[control]` or `[formControl]`).
- `CngxListboxFieldBridge` - specialised bridge for `CngxListbox` that handles
  multi-select and `compareWith` value-sync.

## Optional Material Theme

`@cngx/themes/material/field-theme.scss` maps Material M3/M2 design tokens to
cngx-form-field CSS custom properties:

```scss
@use '@cngx/themes/material/field-theme' as form-field;

html {
  @include mat.all-component-themes($theme);
  @include form-field.theme($theme);
}
```
