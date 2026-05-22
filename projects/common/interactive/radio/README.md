# Radio

Single-select radio group plus its leaves. `CngxRadioGroup` owns the canonical `value` and provides the parent contract through `CNGX_RADIO_GROUP`; `CngxRadio` injects that token, never the concrete group class. The pair is a coordinated molecule: the group hosts `CngxRovingTabindex` for arrow-key focus movement, the leaves render through `CngxRadioIndicator` from `@cngx/common/display`, and checked-ness is derived per leaf from `group.value() === radio.value()` rather than stored.

## Import

```ts
import { CngxRadioGroup, CngxRadio } from '@cngx/common/interactive';
```

## Quick start

```html
<!-- Basic two-way binding -->
<cngx-radio-group [(value)]="payment" name="payment-method">
  <cngx-radio value="card">Credit card</cngx-radio>
  <cngx-radio value="cash">Cash on delivery</cngx-radio>
  <cngx-radio value="invoice">Invoice</cngx-radio>
</cngx-radio-group>
```

```ts
protected readonly payment = signal<'card' | 'cash' | 'invoice' | undefined>(undefined);
```

Drop the same atom into a Signal Forms field; no extra binding, the group provides `CNGX_FORM_FIELD_CONTROL` itself:

```html
<cngx-form-field [field]="form.payment">
  <cngx-radio-group>
    <cngx-radio value="card">Credit card</cngx-radio>
    <cngx-radio value="cash">Cash on delivery</cngx-radio>
    <cngx-radio value="invoice">Invoice</cngx-radio>
  </cngx-radio-group>
</cngx-form-field>
```

## `CngxRadioGroup` API

Selector: `cngx-radio-group, [cngxRadioGroup]`. `exportAs: 'cngxRadioGroup'`. Generic over `T`.

| Input | Type | Default | Notes |
|-|-|-|-|
| `value` | `T \| undefined` | `undefined` | `model()`, two-way bindable. Canonical source of truth. |
| `disabled` | `boolean` | `false` | `model()`. Cascades to every leaf. |
| `required` | `boolean` | `false` | `model()`. Sets `aria-required="true"`. |
| `invalid` | `boolean` | `false` | `model()`. Bridge-writable; sets `aria-invalid="true"`. |
| `errorMessageId` | `string \| null` | `null` | Forwarded to `aria-errormessage` when set. |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | Forwarded to host `CngxRovingTabindex` and `aria-orientation`. |
| `label` | `string \| undefined` | `undefined` | Forwarded to `aria-label`. |
| `state` | `CngxAsyncState<unknown> \| undefined` | `undefined` | Drives `aria-busy` when status is `'loading'`. |
| `name` (`nameInput`) | `string \| undefined` | auto `nextUid('cngx-radio-group')` | HTML-style `name` applied per radio. |

Read-only signals: `name`, `id`, `focused`, `empty`, `errorState`.

Group provides itself for three tokens: `CNGX_RADIO_GROUP`, `CNGX_CONTROL_VALUE`, `CNGX_FORM_FIELD_CONTROL`.

## `CngxRadio` API

Selector: `cngx-radio, [cngxRadio]`. `exportAs: 'cngxRadio'`. Generic over `T`. Composes `CngxRovingItem` as a host directive with `cngxRovingItemDisabled: disabled` forwarded.

| Input | Type | Default | Notes |
|-|-|-|-|
| `value` | `T` | required | The leaf's identity. Checked when it equals `group.value()`. |
| `disabled` | `boolean` | `false` | `model()`. ORed with the group's `disabled()`. |
| `disabledReason` | `string` | `''` | Rendered into an SR-only span and wired through `aria-describedby` when non-empty. |
| `dotGlyph` | `TemplateRef<void> \| null` | `null` | Forwarded to `<cngx-radio-indicator>` to replace the default dot. |

The radio is not a self-owned input. It writes through the group on click, Space, Enter, or auto-select-on-arrow; checked state is recomputed, never stored.

## `CNGX_RADIO_GROUP` DI contract

The leaf injects `CNGX_RADIO_GROUP` and gets a `CngxRadioGroupContract<T>`. Decompose-ready: replace the group with any implementation of this contract and the leaf keeps working.

```ts
export interface CngxRadioGroupContract<T = unknown> {
  readonly value: ModelSignal<T | undefined>;
  readonly disabled: Signal<boolean>;
  readonly name: Signal<string>;
  register(radio: CngxRadioRegistration<T>): void;
  unregister(id: string): void;
  consumePendingArrowSelect(value: T): boolean;
}

export interface CngxRadioRegistration<T = unknown> {
  readonly id: string;
  readonly value: () => T | undefined;
  readonly disabled: () => boolean;
}
```

`value` is a `ModelSignal` because the leaf has to write to it on selection. `register` / `unregister` are called from the leaf's constructor and `DestroyRef` cleanup; the registry is a `Map` in declaration order so arrow navigation has DOM-stable resolution without a `ContentChildren` re-query. `consumePendingArrowSelect` implements the W3C auto-select-on-arrow variant: the group raises a transient flag in its `keydown` handler, the newly-focused leaf consumes it from its `(focus)` handler, the flag is cleared so Tab-into-group does not double-select.

## Accessibility

| Concern | How it is wired |
|-|-|
| Role | Host renders `role="radiogroup"` on the group and `role="radio"` on each leaf. |
| Orientation | `[orientation]` is forwarded to host `CngxRovingTabindex` and emitted as `aria-orientation`. |
| Focus traversal | `Tab` enters the group; `CngxRovingTabindex` puts `tabindex="0"` on the active radio and `-1` on the rest. |
| Arrow keys | `ArrowDown` / `ArrowRight` advance focus, `ArrowUp` / `ArrowLeft` retreat, `Home` / `End` jump to first / last. Movement also selects (W3C auto-select variant). |
| Space / Enter | Select the focused leaf. Idempotent on the active one. |
| Per-leaf disabled | Forwarded to `CngxRovingItem` so disabled leaves are skipped by arrow navigation. |
| Group disabled | Cascades through `radioDisabled = computed(() => group.disabled() \|\| disabled())`. Blocks click, Space, Enter, and auto-select; focus may still transit visually so consumers can read the options. |
| Labelling | `[label]` -> `aria-label` on the group. Each leaf projects its label via `<ng-content>`; click anywhere on the leaf selects it. |
| `aria-checked` | Emitted as `"true"` / `"false"` on every leaf (never absent). |
| `aria-required`, `aria-invalid`, `aria-busy` | Derived from `required()`, `invalid() \|\| errorState()`, and `state()?.status() === 'loading'`. |
| `aria-errormessage` | Emitted when `errorMessageId` is set. Consumers render the matching element. |
| `aria-describedby` | Emitted on a leaf only when `disabledReason` is non-empty; the reason is rendered into an SR-only span on the same leaf. |
| Touched | The group calls `fieldHost?.markAsTouched()` on `focusout`, so Signal Forms / RF bridges see the field as touched once the user leaves the group. |

The `[attr.name]` on each leaf mirrors the group's `name()` for parity with `<input type="radio" name="...">` markup expectations. The `<div role="radio">` host does not participate in HTML form submission, so the attribute is cosmetic.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for full input/output reference.
- Stories: `examples/stories/common/interactive/radio/`.
- `CngxRadioIndicator` (`@cngx/common/display`) is the visual glyph the leaf renders; swap its dot with `[dotGlyph]`.
