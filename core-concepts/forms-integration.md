<aside role="note" aria-label="Page metadata" class="cdx-ai-generated-note">
    <span class="cdx-badge cdx-badge--ai-generated">AI-assisted</span>
    <span>Drafted with Claude, reviewed by the maintainers.</span>
</aside>

# Forms Integration

<aside class="cc-tldr">

CNGX is Signal-Forms-first. Every control exposes `value = model<T>()`; every form-field reads a `Field<T>`. Reactive Forms still work through a one-shot `adaptFormControl(...)` bridge. `ControlValueAccessor` is allowed only at the consumer boundary - no new CNGX atom implements it.

</aside>

Angular ships three form systems today:

- **`ControlValueAccessor`** (CVA) - the contract behind `[(ngModel)]` and Reactive Forms.
- **Reactive Forms** - `FormControl`, `FormGroup`, `Validators`.
- **Signal Forms** (`@angular/forms/signals`) - `form()`, `schema()`, `Field<T>`, `[control]`.

CNGX commits to the third, integrates with the second through one explicit adapter, and tolerates the first only at the consumer boundary (Material, native `<input>`, third-party widgets that pre-date signals). No new CNGX atom implements CVA.

This page lays out the contracts, how CNGX bridges between them, and which path a given consumer should pick.

<aside class="cc-note">

**The mental model: two channels that never overlap.** A *field token* carries the ARIA surface - `id`, `aria-invalid`, `aria-required`, focus/blur plumbing. A *binding directive* carries the value - `[control]` for Signal Forms, `[formControl]` for Reactive Forms. Keeping them separate is what lets one CNGX control serve all three form systems.

</aside>

---

## The three contracts

The integration rests on three small, orthogonal DI tokens. A control declares only the ones it needs - being the focusable element does not oblige it to declare a value channel, and declaring a value translation does not oblige it to read the field host.

### At a glance

|Token|Carries|Provided by|
|-|-|-|
|`CNGX_FORM_FIELD_CONTROL`|Control metadata: `inputId`, `focused`, `empty`, `disabled`, `errorState`. No value channel.|Every focusable control.|
|`CNGX_FORM_FIELD_HOST`|Field-level gating read back from the form-field: `showError`, `markAsTouched()`. Optional.|`<cngx-form-field>`.|
|`CNGX_VALUE_TRANSFORMER`|Value translation: `format(raw: T)`, `parse(display: string): T`.|The three `@cngx/forms/input` directives.|

### `CngxFormFieldControl` (`@cngx/core/tokens`)

The atom-side contract every focusable control provides. Pure metadata, no value channel. `<cngx-form-field>` injects it through `CNGX_FORM_FIELD_CONTROL` to paint labels, hints, and `aria-*` attributes.

### `CngxFormFieldHostContract` (`@cngx/core/tokens`)

The presenter-side contract a control reads back from the surrounding form-field. A control rendered outside a form-field injects with `{ optional: true }` and treats the absence as "no field-level gating".

### `CngxValueTransformer<T>` (`@cngx/forms/field`)

The value-channel contract a control provides when it translates between a typed raw value (`T`) and a display string. Today the three value-transformer directives in `@cngx/forms/input` - `CngxInputFormat`, `CngxNumericInput`, `CngxInputMask` - provide it. A directive may provide it, the field control, both, or neither; composition decides which apply.

---

## Bridges

The contracts above describe what a control *is*. A bridge is the wiring that lets a control - or a whole form system - that doesn't natively speak CNGX participate anyway. They live in `@cngx/forms/field` and fall into four kinds along two axes: *which boundary they cross*, and *which channel they carry*.

|Bridge|Kind|Carries|Crosses the boundary of|
|-|-|-|-|
|`adaptFormControl`|Form-system adapter|Field shape only: wraps a Reactive-Forms `AbstractControl` into the `Field<T>` shape `[field]` expects (value, errors, touched, dirty, required, validity).|A Reactive-Forms source that predates Signal Forms.|
|`cngxBindField`|Host ARIA bridge|ARIA only: the form-field's `id`, `aria-*`, and `focus`/`blur` plumbing, projected onto a foreign host. Value stays with the host's own CVA.|A foreign host with its own value channel - native `<input>`, Material, third-party CVA widget.|
|`CngxListboxFieldBridge`, `CngxSliderFieldBridge`, ...|Control bridge|ARIA *and* value: provides `CNGX_FORM_FIELD_CONTROL` and two-way-syncs the bound `Field<T>` with the control's own `value` model.|A CNGX composite that exposes a `value` model but no CVA.|
|`CngxErrorScopeFieldBridge`|Scope bridge|Error-gate visibility: maps an ambient `CngxErrorScope` onto the form-field's reveal contract. Auto-wired as a `hostDirective`, no consumer markup.|An ambient error scope from `@cngx/common/interactive`.|

Two things to read off this:

- **Whether a bridge owns the value channel is the key distinction.** `cngxBindField` deliberately does *not* - the foreign host already has a CVA, so `[control]`/`[formControl]` drives the value and the bridge carries only ARIA. The control bridges *do* own it: a `CngxListbox` or `CngxSlider` exposes a `value = model<T>()` but no CVA, so the bridge two-way-syncs that model with the field. That value sync is the whole reason these are dedicated directives rather than another `cngxBindField`.
- **The atom stays Forms-agnostic.** A control bridge is the *only* file that imports from `@cngx/forms/field` / `@angular/forms`; the slider and listbox atoms in `@cngx/common/interactive` never learn that forms exist. New composite controls get their own bridge as they need one - the slider bridge is the most recent, and the list is open.

Bridges are the cost of meeting a consumer (or an atom) where it already is, not a tax on the default path: a control that provides `CNGX_FORM_FIELD_CONTROL` directly needs none for ARIA, and a feature on Signal Forms needs none for field shape.

---

## Signal Forms (the default)

`@angular/forms/signals` ships a signal-native form model:

- A plain signal holds the data: `const model = signal({ name: '' });`
- `form(model, schema)` returns a `FieldTree<T>` whose leaves are callable `Field<T>` accessors.
- `<input [control]="myField">` is the binding directive. It writes the field's value into the directive's `value = model<T>()` signal on user input, and writes back into the model on every field update.

CNGX wraps the form-field UI around it with `[field]`.

### Setup

```ts
import { signal } from '@angular/core';
import { form, schema, required, email } from '@angular/forms/signals';

readonly model = signal({ email: '' });
readonly emailForm = form(this.model, schema(root => {
  required(root.email, { message: 'Required.' });
  email(root.email, { message: 'Invalid email.' });
}));
```

### Template

```html
<cngx-form-field [field]="emailForm.email">
  <label cngxLabel>Email</label>
  <input cngxInput [control]="emailForm.email" />
  <cngx-field-errors />
</cngx-form-field>
```

`CngxInput` provides `CNGX_FORM_FIELD_CONTROL` directly, so the form-field can paint `aria-invalid`, `aria-required`, and the error list without a bridge. The value channel runs through `[control]`.

### With a value transformer

For atoms whose value flow needs translating (locale-formatted numbers, masked phone strings, currency display on blur), the same binding shape applies - the directive's `value = model<T>()` is what `[control]` writes against:

```html
<cngx-form-field [field]="amountForm.amount">
  <label cngxLabel>Amount</label>
  <input cngxNumericInput cngxBindField [control]="amountForm.amount" />
  <cngx-field-errors />
</cngx-form-field>
```

`cngxBindField` is the universal bridge for inputs that don't provide `CNGX_FORM_FIELD_CONTROL` themselves. It projects the form-field's `id`, `aria-*`, and `focus`/`blur` plumbing onto the host element. It does not touch the value channel - `[control]` owns that, talking to the directive's `value` model directly.

---

## Reactive Forms (the bridge)

Existing Reactive Forms code keeps working. `adaptFormControl(control, name, destroyRef)` wraps an `AbstractControl` into the same `CngxFieldAccessor` shape Signal Forms produces.

### Setup

```ts
import { FormControl, Validators } from '@angular/forms';
import { adaptFormControl, type CngxFieldAccessor } from '@cngx/forms/field';
import { DestroyRef, inject, signal } from '@angular/core';

private readonly destroyRef = inject(DestroyRef);
readonly emailControl = new FormControl('', [Validators.required, Validators.email]);
readonly emailField = signal<CngxFieldAccessor>(
  adaptFormControl(this.emailControl, 'email', this.destroyRef),
);
```

### Template

```html
<cngx-form-field [field]="emailField()">
  <label cngxLabel>Email</label>
  <input cngxInput [formControl]="emailControl" />
  <cngx-field-errors />
</cngx-form-field>
```

`[formControl]` continues to drive the value channel (CVA on `CngxInput`'s host element). `adaptFormControl` only synthesises the *field shape* - value, errors, touched, dirty, required, validity - into the `Field<T>` interface the form-field expects. The RF control remains the source of truth.

The adapter is a one-shot factory: call it once, store the result, pass it to `[field]`. Subsequent RF changes propagate through the adapter's internal `effect()`s.

### Material / third-party CVA controls

For Material or third-party controls that already implement CVA, the same shape works - bind `[formControl]` on the host element and let `cngxBindField` carry the ARIA surface:

```html
<cngx-form-field [field]="colorField()">
  <label cngxLabel>Color</label>
  <mat-select cngxBindField [formControl]="colorControl">
    <mat-option value="red">Red</mat-option>
    <mat-option value="green">Green</mat-option>
  </mat-select>
  <cngx-field-errors />
</cngx-form-field>
```

---

## `ControlValueAccessor` (consumer boundary only)

CVA is no longer a CNGX authoring pattern. A new atom in `@cngx/common/*` or `@cngx/forms/*` does one of two things instead:

- **Provides `CNGX_FORM_FIELD_CONTROL` directly** - most controls. See `CngxInput`, `CngxSelect`, `CngxMultiSelect`, `CngxCombobox`, `CngxTypeahead`, `CngxTreeSelect`, `CngxReorderableMultiSelect`, `CngxActionSelect`, `CngxActionMultiSelect`.
- **Provides `CNGX_VALUE_TRANSFORMER`** - when its job is to translate between a typed raw value and a display string: `CngxInputFormat`, `CngxNumericInput`, `CngxInputMask`.

Both paths expose `value = model<T>()`, the same shape Signal Forms' `[control]` directive binds against.

CVA is allowed at the consumer boundary, attached to a host element the consumer brings - a Material control, a native `<input>`, a third-party widget. CNGX never authors it.

### Why CVA was dropped

The architectural reason is documented in `projects/forms/select/ARCHITECTURE.md`. CVA's `writeValue` -> `registerOnChange` lifecycle is fundamentally imperative: it does not participate in the signal graph, and it forces every control to duplicate the `onChange` / `onTouched` plumbing instead of deriving from one source. The model signal - paired with optional `CNGX_VALUE_TRANSFORMER` and optional `CNGX_FORM_FIELD_HOST` - covers the same surface with one signal as the canonical state.

---

## Decision matrix

|Consumer has|Use|Notes|
|-|-|-|
|Signal-native code, fresh feature|Signal Forms + `[control]`|The default. Smallest binding, full signal-graph integration.|
|Reactive Forms control already in place|`adaptFormControl` + `[formControl]`|One-line bridge; RF stays the source of truth.|
|Material / native / third-party CVA control|`cngxBindField` + `[formControl]`|`[formControl]` drives the value via the host's existing CVA; `cngxBindField` carries the form-field ARIA.|
|Standalone usage, no form involved|`[(value)]` or template-variable read|Works on every CNGX control with a `value` model.|

The decision is one-way. Start on Signal Forms and every CNGX control fits without an adapter. Start on Reactive Forms and every CNGX control still fits - through one `adaptFormControl` call per control.
