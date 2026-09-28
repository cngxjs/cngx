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
| `CngxFieldSkinHost` | `[cngxFieldSkin]` | Resolves the field skin and writes it to its host as `data-skin`. Composed by `CngxInput`, `CngxAffixRow` and the select-family triggers |

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
| `provideFormFieldAt(...features)` | Same config, scoped to a component subtree (`providers` / `viewProviders`) |
| `provideErrorMessages(map)` | Shorthand for error messages only |
| `withErrorMessages(map)` | Error-kind-to-message formatters |
| `withConstraintHints(formatters?)` | Auto-generate hints from validators (i18n via `ConstraintHintFormatters`) |
| `withRequiredMarker(text?)` | Auto-show required marker on labels |
| `withAutocompleteMappings(map)` | Extend/override autocomplete inference |
| `withNoSpellcheck(fields)` | Extend spellcheck-disabled field list |
| `withFieldSkin(skin)` | Default skin (`'outline'` / `'fill'` / `'bare'`) for every control that composes `CngxFieldSkinHost` |

### Types

`CngxFieldRef`, `CngxFieldAccessor`, `CngxFormFieldControl`, `ErrorMessageFn`, `ErrorMessageMap`,
`FormFieldConfig`, `FormFieldFeature`, `CngxFieldSkin`, `ConstraintHintFormatters`, `ConstraintMetadata`,
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

## Skins

Three looks, no extra DOM. The skin lands on the element that is actually the
box, never on the `display: contents` field shell.

| Skin | Look | Use it for |
|-|-|-|
| `outline` | Hairline border on all four sides. The default; writes no attribute | Regular forms |
| `fill` | Tinted surface, bottom border, focus underline | Dense forms, Material-style layouts |
| `bare` | No surface, no border, focus underline only; fills its parent inline | Table filter rows, inline cell editors, toolbars |

```html
<cngx-form-field [field]="f.name" skin="fill">
  <label cngxLabel>Name</label>
  <input cngxInput [formField]="f.name" />
</cngx-form-field>
```

**Cascade.** `CngxFieldSkinHost` resolves one value per control, first hit wins:

```text
own [cngxFieldSkin] / [skin]  ->  surrounding cngx-form-field [skin]  ->  withFieldSkin(...)  ->  'outline'
```

`CngxInput` and `CngxAffixRow` compose the directive and alias its input to
`skin`. With affixes, the `cngxAffixRow` is the box: prefix, value and suffix
share one surface and one underline, and the nested input drops its own. The
select-family triggers (`CngxSelect`, `CngxMultiSelect`, `CngxCombobox`,
`CngxTypeahead`, `CngxTreeSelect`, `CngxActionSelect`,
`CngxActionMultiSelect`, `CngxReorderableMultiSelect`, `CngxSelectShell`)
compose it too, so a field-level or app-wide skin reaches them without extra
wiring.

**App-wide and per region.** `provideFormField(withFieldSkin('fill'))` sets the
default. `provideFormFieldAt(withFieldSkin('bare'))` in a component's
`viewProviders` scopes it to one subtree, typically a table.

**Controls that do not host `cngxInput`** opt in with the explicit attribute:
`CngxNumericInput`, `CngxInputMask`, `CngxInputFormat`, `CngxOtpSlot`,
`input[cngxListboxSearch]`, `input[cngxSearch]`, `input[cngxDgaFilter]`. They
are not reached by `withFieldSkin(...)` until the attribute is present, because
the config is read by the skin directive itself.

```html
<input cngxNumericInput cngxFieldSkin="bare" />
```

**Label-less inputs.** A `bare` input in a table filter row has no
`cngx-form-field` and no visible label of its own. Put the explicit
`cngxFieldSkin` attribute on it and point `aria-labelledby` at the column
header, so the header text is the accessible name and nothing is translated
twice. Without a visible header, use `aria-label`. A placeholder is not a label.

```html
<th scope="col" id="col-name">Name</th>
...
<td><input cngxFieldSkin="bare" aria-labelledby="col-name" /></td>
```

**The container owns the boundary.** `bare` paints nothing at rest, so the
cell, toolbar or grid area around it has to draw the edge. To make the whole
table cell the input's hit area, drop the cell padding; the input keeps its own
padding and touch-target floor. The selector is a descendant match because
`cngx-form-field` sits between the cell and the input:

```css
td:has([data-skin='bare']) {
  padding: 0;
}
```

**States.** Error, disabled and readonly key on `aria-invalid`, `:disabled`,
`[readonly]` and `aria-readonly` first and on the presenter classes second, so
they render the same with or without a surrounding field.

**Focus.** `fill` and `bare` show focus as a 2px bottom underline. That meets
WCAG 2.4.7 and 2.4.11 but not 2.4.13 (Focus Appearance, AAA), which asks for a
full perimeter. `withFieldSkin('outline')` is the AAA path. Under
`forced-colors: active` the regular focus outline comes back.

**Theme tokens.**

| Token | Controls |
|-|-|
| `--cngx-field-fill-bg` | `fill` surface at rest |
| `--cngx-field-fill-bg-hover` | `fill` surface on hover |
| `--cngx-field-underline-color` | Resting bottom border of `fill` |
| `--cngx-field-underline-focus-color` | Focus underline of `fill` and `bare` |
| `--cngx-field-underline-size` | Focus underline thickness (default `2px`) |

The Material bridge (`@cngx/themes/material/field-theme`) sets the four colour
tokens from `--mat-sys-*`.

cngx does not ship a floating label. The label stays static above the control.

### Affix patterns

`CngxPrefix` and `CngxSuffix` inside a `cngxAffixRow` cover the four shapes
enterprise forms need. No extra directive is involved; the a11y rule is what
differs.

| Pattern | Markup | A11y rule |
|-|-|-|
| Decorative icon | `<span cngxPrefix><cngx-icon>...</cngx-icon></span>` | Decorative affixes are `aria-hidden` by default; the icon adds nothing to the accessible name |
| Icon button | `<button type="button" cngxSuffix cngxSuffixInteractive [cngxInputClear]="input">` | A real button with an accessible name, in the tab order, with its own focus ring and touch-target floor |
| Text button | `<button type="button" cngxSuffix cngxSuffixInteractive>Apply</button>` | When disabled, point `aria-describedby` at an always-present reason, and only while it applies |
| Select in field | `<cngx-select cngxPrefix cngxPrefixInteractive [label]="'Currency'">` | Detach the inner control from the field by providing `CngxFormFieldPresenter` as `null` on its element, so the field keeps exactly one control |

The select-in-field shield is a one-line directive in the consumer:

```ts
@Directive({
  selector: '[appAffixDetach]',
  providers: [{ provide: CngxFormFieldPresenter, useValue: null }],
})
export class AppAffixDetach {}
```

Without it the nested select registers a second `CNGX_FORM_FIELD_CONTROL`,
mirrors the field's error state and writes its value into the field.

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
