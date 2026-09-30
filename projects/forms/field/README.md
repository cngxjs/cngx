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
| `CngxFieldSkinHost` | `[cngxFieldSkin]` | Resolves the field skin and writes it to its host as `data-skin`. Composed by `CngxInput`, `CngxFieldBox` and the select-family triggers |
| `CngxFieldBox` | `[cngxFieldBox]` | The painted box around a control and its `CngxPrefix` / `CngxSuffix` affixes, in every skin. Resets its direct-child controls, paints the main control's state, forwards a click on its padding to the main control. `CngxAffixRow` / `[cngxAffixRow]` is the deprecated alias |

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
| `outline` | Hairline border on all four sides, full focus ring. The default; a lone control writes no attribute | Regular forms |
| `fill` | Tinted surface with a bottom underline: muted at rest, 2px in the focus colour on focus, 2px danger on error | Dense forms, Material-style layouts |
| `bare` | No surface and no border at rest; focus ring drawn inside the box; error as danger text plus a 1px inset danger ring; fills its parent inline | Table filter rows, inline cell editors, toolbars |

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

`CngxInput` and `CngxFieldBox` compose the directive and alias its input to
`skin`. The select-family triggers (`CngxSelect`, `CngxMultiSelect`,
`CngxCombobox`, `CngxTypeahead`, `CngxTreeSelect`, `CngxActionSelect`,
`CngxActionMultiSelect`, `CngxReorderableMultiSelect`, `CngxSelectShell`)
compose it too, so a field-level or app-wide skin reaches them without extra
wiring.

**One box.** The box is the outermost element that carries the skin: a lone
control is its own box, a `cngxFieldBox` is the box for its affixes and its
main control, and a select paints its trigger. Every skin uses the same box
model: height is the line box plus twice the block padding plus a 1px border
on both sides, and a skin that draws no border paints it transparent. That
makes a single-line box 42px at comfortable density, 34px compact and 50px
spacious, in every skin and for every composition; on a coarse pointer the
touch-target floor raises it to at least 44px. Density scales the padding only, and
`bare` has the metrics of `outline`, so switching skin never moves a layout.

**The box owns its direct children.** Everything that is a direct child of a
`cngxFieldBox` belongs to the box, and only those:

- a control that is a direct child resolves to `bare` on its own and drops its
  surface, border and padding, so a picker inside a box needs no skin wiring;
- the box reads its state from its main control, the first direct-child control
  that is not a `cngxPrefix` / `cngxSuffix`, and writes it as `data-invalid`,
  `data-disabled` and `data-readonly`. One main control per box; a second one
  is ignored, and an invalid or disabled affix picker never changes the box;
- a control behind a wrapper element is not a direct child and follows the
  normal cascade.

**Composites are their own box.** A component that renders its own controls,
such as `CngxPhoneInput`, is already a box. Place it directly in
`cngx-form-field`, never inside `cngxFieldBox`.

**Inner label.** A `<label cngxLabel>` placed as a direct child of a
`cngxFieldBox` renders inside the box, on its own line above the value. The
label line is the label font size plus `0.0625rem` (14px at the default
13px), the box grows by that line and nothing else: 56px comfortable, 48px
compact, 64px spacious, and 56px on a coarse pointer, where affix buttons span
the value line and keep their 44px inline floor. It is placement, not an
input: the same label outside the box sits above it. Use one placement per
form; a form that mixes inner and outer labels reads as two kinds of control.

```html
<cngx-form-field [field]="f.reference" skin="fill">
  <span cngxFieldBox>
    <label cngxLabel>Order reference</label>
    <input cngxInput [formField]="f.reference" />
  </span>
</cngx-form-field>
```

cngx does not ship a floating label. The label stays static, above the box or
inside it.

**App-wide and per region.** `provideFormField(withFieldSkin('fill'))` sets the
default. `provideFormFieldAt(withFieldSkin('bare'))` in a component's
`viewProviders` scopes it to one subtree, typically a table.

**Value directives compose with `cngxInput`.** `CngxInput` hosts the skin
directive, so `<input cngxInput cngxNumericInput>` follows `withFieldSkin(...)`
with no extra attribute. The same holds for `CngxInputMask` and
`CngxInputFormat`. Do not add the skin directive to a value directive's host:
a second skin host on one element throws NG0309.

```html
<input cngxInput cngxNumericInput [field]="f.amount" />
```

A lone value directive is not a field control, and an OTP slot or a listbox
search owns its own chrome, so these opt in with the explicit attribute:
`CngxNumericInput`, `CngxInputMask`, `CngxInputFormat`, `CngxOtpSlot`,
`input[cngxListboxSearch]`, `input[cngxSearch]`, `input[cngxDgaFilter]`. They
are not reached by `withFieldSkin(...)` until the attribute is present, because
the config is read by the skin directive itself. An empty `cngxFieldSkin`
attribute opts in and follows the cascade. Inside a `CngxFieldBox` none of
them needs the attribute: they are direct children, so the box strips their
paint.

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
table cell the input's hit area, drop the cell padding; the bare control
carries the box padding, so its text sits where the text of a read-only cell
with the same padding sits, and entering edit mode moves nothing. The
selector is a descendant match because `cngx-form-field` sits between the
cell and the input:

```css
td:has([data-skin='bare']) {
  padding: 0;
}
```

**States.** A lone control keys error, disabled and readonly on
`aria-invalid`, `:disabled`, `[readonly]` and `aria-readonly`, so it renders
the same with or without a surrounding field. A box keys them on the
`data-invalid` / `data-disabled` / `data-readonly` it derives from its main
control.

**Focus.** `outline` and `bare` draw the full focus ring; `bare` draws it inside
the box, so a cell or a toolbar does not clip it. `fill` shows focus as a 2px
bottom underline. That meets WCAG 2.4.7 and 2.4.11 but not 2.4.13 (Focus
Appearance, AAA), which asks for a full perimeter. `withFieldSkin('outline')`
is the AAA path. Under `forced-colors: active` the regular focus outline comes
back.

**Theme tokens.**

| Token | Controls |
|-|-|
| `--cngx-field-fill-bg` | `fill` surface at rest |
| `--cngx-field-fill-bg-hover` | `fill` surface on hover (unset: the surface with 5% text mixed in) |
| `--cngx-field-underline-color` | Resting underline of `fill` |
| `--cngx-field-underline-focus-color` | Focus underline of `fill` |
| `--cngx-field-underline-size` | Focus and error underline thickness (default `2px`) |
| `--cngx-field-outline-color` | Border of an `outline` field box |
| `--cngx-field-disabled-color` | Value text of a disabled `outline` field box (unset: 38% text colour) |
| `--cngx-field-border-width` | Box border width in every skin (default `1px`) |
| `--cngx-field-ring-width` | Focus ring width of `outline` and `bare` (default `2px`) |
| `--cngx-field-ring-offset` | Focus ring offset (default `3px`; `bare` draws it inside) |
| `--cngx-field-affix-color` | Text and icon colour of a non-interactive affix |
| `--cngx-field-affix-divider` | Width of the line between an affix and the value (default `0px`, set `1px` to draw it) |
| `--cngx-field-placeholder-color` | Placeholder colour of native field controls (select triggers read `--cngx-select-placeholder-color`) |
| `--cngx-field-label-font-size` | Label size (default `0.8125rem`) |
| `--cngx-field-label-weight` | Label weight (default `500`) |
| `--cngx-field-label-color` | Label colour |
| `--cngx-field-inner-label-line` | Line height of a label placed inside a field box (default: label font size + `0.0625rem`) |
| `--cngx-field-hint-font-size` | Hint and error text size (default `0.8125rem`) |
| `--cngx-field-hint-color` | Hint colour |
| `--cngx-field-error-color` | Error label, error list and `cngxError` text colour, and the `bare` error ring |

The Material bridge (`@cngx/themes/material/field-theme`) sets the surface,
underline, label, hint, affix and error colours from `--mat-sys-*`.

### Affix patterns

`CngxPrefix` and `CngxSuffix` inside a `cngxFieldBox` cover the four shapes
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
