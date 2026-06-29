<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Forms & Inputs

<aside class="cc-tldr">

A CNGX form is three things kept apart: a **shell** (`<cngx-form-field>`) that paints the label, hint, errors, and all the ARIA wiring; a **control** you put inside it (a native `<input cngxInput>`, a select, a checkbox); and a **value binding** that connects that control to your data. You pick the value binding once - Signal Forms, Reactive Forms, or a plain `[(value)]` - and every CNGX control fits without rewriting it. Accessibility is not something you add afterwards; it is what the shell does.

</aside>

This page is the consumer's guide: what the pieces are, how they fit, and why they are shaped this way. For the DI-token contracts underneath, see [Forms Integration](forms-integration.md).

---

## The one idea to hold onto

Most form libraries fuse three jobs into one component: the visual frame, the input, and the data binding all live in the same widget. That fusion is why swapping form systems, or theming a field, or making it accessible, tends to mean fighting the widget.

CNGX splits those three jobs and never lets them overlap:

|Job|Who does it|What it owns|
|-|-|-|
|**Presentation + a11y**|`<cngx-form-field>` and its slots|label, hint, error list, `id`, `aria-invalid`, `aria-required`, `aria-describedby`, focus/blur plumbing|
|**The control**|whatever you place inside (`cngxInput`, a select, a checkbox)|the actual editable element and its value signal|
|**The value binding**|one directive on the control|moving data between the control and your model|

<aside class="cc-note">

**Why this matters to you.** Because the shell owns accessibility, every field you build is screen-reader-correct by default - the label is associated, errors are announced, the required state is exposed. You do not wire `aria-describedby` by hand and you cannot forget to. And because the value binding is a separate directive, the *same* CNGX control works whether your app is on Signal Forms, Reactive Forms, or no form at all. You learn the controls once.

</aside>

---

## Anatomy of a field

Everything visible and audible around a control is a **slot** you drop into `<cngx-form-field>`. You include only the slots you want; the shell positions them and wires the ARIA.

```html
<cngx-form-field [field]="form.email">
  <label cngxLabel>Email <cngx-required /></label>
  <input cngxInput [control]="form.email" autocomplete="email" />
  <span cngxHint>We never share it.</span>
  <cngx-field-errors />
</cngx-form-field>
```

|Slot|Selector|What it is|
|-|-|-|
|Shell|`<cngx-form-field>`|the wrapper; `[field]` hands it the field state|
|Label|`[cngxLabel]`|the field label, associated with the control automatically|
|Required marker|`<cngx-required />`|the visual "required" mark, driven by the field's validators|
|Control|`cngxInput` (and friends)|the editable element itself|
|Hint|`[cngxHint]`|helper text under the field|
|Error list|`<cngx-field-errors />`|renders the active validation messages, auto-wired|
|Single error|`[cngxError]`|one manual error message, when you want to control it yourself|

Two error slots exist on purpose. `<cngx-field-errors />` is the default: it reads the field's validators and renders whatever is currently failing, with the messages resolved from config. `[cngxError]` is the escape hatch for when you want to render one specific message in one specific place yourself. Most forms only ever need `<cngx-field-errors />`.

---

## Choosing how the value binds

This is the only real decision, and it is a one-way door: pick the form system your app already uses, and the rest follows.

|Your situation|Binding|What you write|
|-|-|-|
|New feature, signal-native|**Signal Forms** (the default)|`[field]` on the shell, `[control]` on the input|
|Reactive Forms already in place|**RF bridge**|`adaptFormControl(...)` once, then `[formControl]` on the input|
|A single control, no form|**Plain two-way**|`[(value)]` on the control|

### Signal Forms (the default)

You hold your data in a signal, describe its rules with a schema, and bind the leaf to both the shell and the control:

```ts
readonly model = signal({ email: '' });
readonly form = form(this.model, schema(root => {
  required(root.email, { message: 'Required.' });
  email(root.email, { message: 'Invalid email.' });
}));
```

```html
<cngx-form-field [field]="form.email">
  <label cngxLabel>Email</label>
  <input cngxInput [control]="form.email" />
  <cngx-field-errors />
</cngx-form-field>
```

`[field]` feeds the shell the validity, touched, and required state it needs to paint itself. `[control]` moves the value. They read the same field but do different jobs - that separation is the whole design.

### Reactive Forms (still fully supported)

Existing `FormControl` code keeps working. One adapter call turns an `AbstractControl` into the shape the shell expects:

```ts
readonly emailControl = new FormControl('', [Validators.required, Validators.email]);
readonly emailField = signal(adaptFormControl(this.emailControl, 'email', inject(DestroyRef)));
```

```html
<cngx-form-field [field]="emailField()">
  <label cngxLabel>Email</label>
  <input cngxInput [formControl]="emailControl" />
  <cngx-field-errors />
</cngx-form-field>
```

The `FormControl` stays the source of truth; the adapter only mirrors its state into the shell.

To read a control back out of a `FormGroup` with its type intact instead of casting it, reach for `cngxTypedControl`.

### A control on its own

Every CNGX control with a value exposes a two-way `value`. Used outside a form, that is all you need:

```html
<cngx-multi-select [(value)]="selectedTags" [options]="allTags" />
```

---

## The inputs

`cngxInput` marks a native `<input>`, `<textarea>`, or `<select>` as the field's control. That alone gives you the full accessible field. Everything else is an **enhancer directive** you add to the same element when you want more behaviour - each one is a single, focused responsibility you opt into.

|Directive|Selector|Adds|
|-|-|-|
|Base control|`cngxInput`|marks the element as the field's control; the foundation for the rest|
|Password toggle|`cngxPasswordToggle`|a show/hide button on a password field|
|Character count|`<cngx-char-count />`|a live "n / max" counter|
|Mask|`cngxInputMask`|fixed-shape input (phone, IBAN, dates) with placeholder guides|
|Format / parse|`cngxInputFormat`|translate between a typed value and a display string|
|Numeric|`cngxNumericInput`|locale-aware number formatting|
|Autosize|`cngxAutosize`|a `<textarea>` that grows with its content|
|Clear|`cngxInputClear`|a clear-the-field button|
|Copy|`cngxCopyValue`|a copy-to-clipboard button|
|OTP|`cngxOtpInput` / `cngxOtpSlot`|a one-time-code entry with per-digit boxes|
|File drop|`cngxFileDrop`|a drag-and-drop file zone|

These compose. A masked, clearable phone field is just three directives on one input - no special "phone field" component is needed for the simple case:

```html
<input cngxInput cngxInputMask="phone" cngxInputClear [control]="form.phone" />
```

Mask patterns, numeric defaults, and similar knobs are set app-wide through `provideInputConfig(withPhonePatterns(...), withNumericDefaults(...), ...)` rather than repeated on every field.

### Mask presets are lazy

`cngxInputMask` ships built-in tables for `phone`, `date`, `iban`, and `zip` covering many regions (ISO 3166-1 / BCP-47 keyed). Those tables are **code-split and loaded on demand** - a date-only app never downloads the phone table. Until a table arrives, a generic fallback mask shows for a moment. For an **offline / PWA** app that must have every pattern cached before going offline, load them eagerly at startup:

```ts
bootstrapApplication(App, {
  providers: [provideEagerMaskPresets()],          // all tables
  // or provideEagerMaskPresets('phone', 'date')   // only these
});
```

### Composed controls: rating and intl phone

Two `@cngx/forms/input` controls are organisms rather than enhancer directives - they compose smaller pieces into one field control and drop into `cngx-form-field` like any other:

- **`<cngx-rating>`** - a star/heart value control. Arrow-key navigable (it reuses the roving-tabindex keyboard engine), `[(value)]` is a number, and the star glyph is a slot (`*cngxRatingItem`) so you bring your own icon.
- **`<cngx-phone-input>`** - an international phone field that pairs a country picker with the region-aware mask. Picking a country re-targets the mask and pre-fills the dial code; override the list with `[countries]`, or set an app-wide default region with `provideInputConfig(withPhoneDefaultRegion('AT'))`.

```html
<cngx-form-field [field]="form.score">
  <label cngxLabel>Rate us</label>
  <cngx-rating [max]="5" />
</cngx-form-field>

<cngx-form-field [field]="form.phone">
  <label cngxLabel>Phone</label>
  <cngx-phone-input />
</cngx-form-field>
```

---

## Beyond text: selects, choices, and chips

Not every control is a native input. CNGX ships two families that plug into the same shell and the same bindings.

### The select family

Nine controls, one per job, instead of one component with a pile of flags. Pick by what the user is doing:

|Control|For|
|-|-|
|`CngxSelect`|pick one option|
|`CngxMultiSelect`|pick several (chip strip)|
|`CngxCombobox`|filter-as-you-type, tag-style input|
|`CngxTypeahead`|async autocomplete to a single value|
|`CngxTreeSelect`|pick from a hierarchy|
|`CngxReorderableMultiSelect`|pick several and order them|
|`CngxActionSelect` / `CngxActionMultiSelect`|a selection that triggers an action|
|`CngxSelectShell`|build your own from `<cngx-option>` / `<cngx-optgroup>`|

They all expose `value = model<T>()`, so they bind exactly like an input: `[control]` under Signal Forms, `[formControl]` under Reactive Forms, `[(value)]` standalone.

### Checkboxes, radios, toggles, chips

These atoms live in `@cngx/common/interactive` (`CngxCheckbox`, `CngxRadioGroup`, `CngxToggle`, `CngxChipGroup`, and so on). Under Reactive Forms they bind through `formControlName` with **no extra directive** - a shared bridge attaches itself by selector the moment you add `formControlName`:

```html
<form [formGroup]="form">
  <cngx-toggle formControlName="notifications" />
  <cngx-checkbox-group formControlName="topics">...</cngx-checkbox-group>
</form>
```

You never reference the bridge; it is the single place in CNGX that speaks the old `ControlValueAccessor` protocol, so the atoms themselves stay clean.

### Bringing your own control

Have a Material control, a native element, or a third-party widget that already implements `ControlValueAccessor`? `cngxBindField` wraps it in the shell. It carries the label and ARIA onto your element while `[formControl]` drives the value:

```html
<cngx-form-field [field]="colorField()">
  <label cngxLabel>Color</label>
  <mat-select cngxBindField [formControl]="colorControl">
    <mat-option value="red">Red</mat-option>
  </mat-select>
  <cngx-field-errors />
</cngx-form-field>
```

---

## Validation and telling the user about it

A failing field is useless if the user cannot tell. CNGX treats the message, not just the rule, as part of the field:

- **`<cngx-field-errors />`** renders whatever is currently invalid, reading messages from configuration so they stay consistent and translatable. Configure them with `provideFormField(withErrorMessages({ required: 'This field is required.' }))`.
- **`withConstraintHints(...)`** can turn a validator (min length, pattern) into an automatic hint, so the rule is visible *before* the user trips it, not only after.
- **`<cngx-required />`** marks required fields from their validators, so the mark cannot drift out of sync with the rule.
- **`<cngx-form-errors />`** renders a form-level summary - one accessible list of every failing field, the pattern screen-reader users rely on to navigate a long form.
- **`focusFirstError(...)`** moves focus to the first invalid control on submit.

All of it is driven by the field's actual validity. You define the rule once; the messaging derives from it. Nothing is announced by hand, and nothing can silently fail to be announced.

---

## Why it is built this way

The three [Pillars](three-pillars.md) are visible in every choice above:

- **Derivation over management.** The required mark, the error list, the `aria-invalid` state, the hint - none of them are flags you set. They are computed from one source: the field's validity. You cannot get them out of sync because there is nothing to sync.
- **Communication is architecture.** Accessibility is not a checklist applied to a finished field. The shell *is* the communication layer - label association, error announcement, required exposure, focus management are its entire job. A field that renders is a field that is accessible.
- **Composition over configuration.** There is no mega `<cngx-field>` with thirty inputs. There is a shell, a set of slots, a set of enhancer directives, and a family of controls. A complex field is a handful of small pieces placed together, each of which you can read and reason about on its own.

That is also why the value binding is separable: a control that derives its state from one `value` signal, and communicates through a shell it does not own, is a control that does not care which form system you bound it to.

---

## Where to go next

- [Forms Integration](forms-integration.md) - the DI-token contracts, the adapter internals, and the full decision matrix.
- [The Three Pillars](three-pillars.md) - the principles this design comes from.
- [The CNGX Way](the-cngx-way.md) - how these ideas show up across the whole library, not just forms.
