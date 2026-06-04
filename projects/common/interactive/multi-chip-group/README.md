# Multi Chip Group

Multi-select chip group. Owns `selectedValues = model<T[]>([])` as the canonical multi-value source, renders `role="listbox" aria-multiselectable="true"`, and exposes the parent contract via `CNGX_CHIP_GROUP_HOST` so projected `<cngx-chip cngxChipInGroup>` leaves connect without ancestor injection. Mode is static: pick this molecule when chips toggle independently, pick the single-select sibling `CngxChipGroup` when exactly one value wins. No runtime `[selectionMode]` flag.

## Import

```ts
import { CngxMultiChipGroup, CngxChipInGroup } from '@cngx/common/interactive';
import { CngxChip } from '@cngx/common/display';
```

## Quick start

```html
<cngx-multi-chip-group label="Tags" [(selectedValues)]="tags">
  @for (tag of options(); track tag) {
    <cngx-chip cngxChipInGroup [value]="tag">{{ tag }}</cngx-chip>
  }
</cngx-multi-chip-group>
```

```ts
protected readonly options = signal(['urgent', 'review', 'blocker', 'follow-up']);
protected readonly tags = signal<string[]>(['urgent']);
```

For object-valued options where array references are unstable, pass `[keyFn]`:

```html
<cngx-multi-chip-group [(selectedValues)]="picked" [keyFn]="byId">
  @for (user of users(); track user.id) {
    <cngx-chip cngxChipInGroup [value]="user">{{ user.name }}</cngx-chip>
  }
</cngx-multi-chip-group>
```

```ts
protected readonly byId = (u: User) => u.id;
```

Membership is then tracked by stable key, not identity.

## Forms integration

The group provides `CNGX_CONTROL_VALUE` and `CNGX_FORM_FIELD_CONTROL` directly, so it drops into `<cngx-form-field [field]="f.tags">` without a CVA. Reactive Forms bind via `adaptFormControl`.

## Accessibility

- Host emits `role="listbox"` plus `aria-multiselectable="true"`. Chips emit `role="option"` and derive `aria-selected` from `parent.isSelected(value)` via `CngxChipInGroup`, never from local state.
- Keyboard navigation comes from `CngxRovingTabindex` composed as a host directive. Arrow keys move focus across chips. Only the focused chip carries `tabindex="0"`; the rest are `-1`.
- Activation: Space and Enter call `parent.toggle(value)`. Independent toggle, no group-wide reset, no radio semantics.
- Removal: Delete and Backspace call `parent.remove(value)` on the focused chip. Close-button clicks bubbling out of `<cngx-chip>` are filtered by `CngxChipInGroup` so the chip's own `(remove)` output does not double-fire alongside the leaf's toggle handler.
- `aria-busy` is a `computed()` from `state.status() === 'loading'`. AT announces the busy moment without consumer wiring.
- `aria-disabled`, `aria-required`, `aria-invalid`, `aria-errormessage` track their inputs reactively. `errorMessageId` may be emitted unconditionally; AT ignores it when `aria-invalid` is absent or `"false"`.
- Accepted debt: a fully group-disabled multi-chip-group still lets visual focus transit through its chips via Arrow keys. Every toggle and remove pathway short-circuits silently. Tracked in `form-primitives-accepted-debt §4`; gated on `CngxRovingItem.disabled` becoming writable.
- Accepted debt: focus resets to index 0 after mid-strip removal instead of clamping to the next valid sibling. The strip-roving controller solves this but its tabindex contract is incompatible with content-projected leaves. Tracked in `form-primitives-accepted-debt §5`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, outputs, and host bindings.
- Stories: `examples/stories/common/interactive/multi-chip-group/`.
- `CngxChipGroup`: single-select sibling. Same `CNGX_CHIP_GROUP_HOST` contract, `selected = model<T | undefined>`.
- `CngxChipInGroup`: leaf directive that wires `role="option"`, defers selection mutations to the group, and composes `CngxRovingItem` for roving tabindex.
- `CngxChipInteraction`: standalone interactive chip for chips that are not inside a group.
