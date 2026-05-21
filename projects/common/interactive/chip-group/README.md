# Chip Group

Single-select chip group molecule. Owns `selected = model<T | undefined>()` as the canonical source, exposes the parent contract through `CNGX_CHIP_GROUP_HOST`, and renders a `role="listbox"` with roving tabindex. Projected `<cngx-chip cngxChipInGroup>` leaves derive `aria-selected` from the group; they never hold their own selection state. For multi-pick semantics use the sibling `CngxMultiChipGroup` instead. The split is static per `feedback_select_family_split`: pick the right group at template time, not a `[selectionMode]` flag.

## Import

```ts
import { CngxChipGroup, CngxChipInGroup } from '@cngx/common/interactive';
import { CngxChip } from '@cngx/common/display';
```

## Quick start

```html
<cngx-chip-group label="T-shirt size" [(selected)]="size">
  <cngx-chip cngxChipInGroup [value]="'sm'">Small</cngx-chip>
  <cngx-chip cngxChipInGroup [value]="'md'">Medium</cngx-chip>
  <cngx-chip cngxChipInGroup [value]="'lg'">Large</cngx-chip>
</cngx-chip-group>
```

Re-clicking the active chip clears the selection (single-mode toggle off). `value` is a structural alias of `selected`, so binding either works.

## Accessibility

The host carries the listbox semantics; the leaves carry the options.

| Surface | Attributes |
|-|-|
| `<cngx-chip-group>` | `role="listbox"`, `aria-label`, `aria-disabled`, `aria-required`, `aria-invalid`, `aria-errormessage`, `aria-busy` |
| `<cngx-chip cngxChipInGroup>` | `role="option"`, `aria-selected`, `aria-disabled`, `aria-describedby` |

Keyboard contract (composed `CngxRovingTabindex` + `CngxRovingItem`):

| Key | Action |
|-|-|
| Arrow keys | Move roving focus across chips. Per-chip `[disabled]` leaves are skipped. |
| Space / Enter | `parent.toggle(value())` on the focused chip. |
| Delete / Backspace | `parent.remove(value())` on the focused chip. |
| Tab | Enters at the active chip; subsequent Tab leaves the group. |

A fully-disabled group still lets roving focus transit through its chips, but every selection and remove pathway short-circuits silently. Tracked in `form-primitives-accepted-debt §4`; the gate is `CngxRovingItem.disabled` becoming a writable surface in `@cngx/common/a11y`.

`aria-busy` is a `computed()` off `state()?.status()`. Skeleton, empty, and error template slots are deferred to the cross-family harmonization pass; until then the group ships only the `aria-busy` projection of `[state]`.

## DI contract: `CNGX_CHIP_GROUP_HOST`

The leaf injects this token (required, not optional) to talk to its parent group. Concrete-class injection is forbidden so the leaf stays decompose-ready and the single + multi groups share one leaf implementation.

```ts
export interface CngxChipGroupHost<T = unknown> {
  isSelected(value: T): boolean;
  toggle(value: T): void;
  remove(value: T): void;
  readonly isDisabled: Signal<boolean>;
}

export const CNGX_CHIP_GROUP_HOST: InjectionToken<CngxChipGroupHost>;
```

Mode (single vs multi) is deliberately absent from the contract. The leaf does not branch on mode; either side of the split satisfies the same shape. A `[cngxChipInGroup]` outside a group throws `NullInjectorError` at construction. Standalone interactive chips with no group use `[cngxChipInteraction]`, which provides `CNGX_CONTROL_VALUE` directly and never touches this token.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for full inputs, outputs, and tokens.
- Stories: `examples/stories/common/interactive/chip-group/`.
- `CngxMultiChipGroup` for multi-pick semantics (sibling of this group).
- `CngxChipInGroup` for the chip-side `role="option"` integration.
- `CngxChipInteraction` for standalone chips outside any group.
