# Chip In Group

Glue directive that opts a `<cngx-chip>` into a surrounding `CngxChipGroup` / `CngxMultiChipGroup`. It injects `CNGX_CHIP_GROUP_HOST` as a required ancestor, applies `role="option"`, and defers every selection mutation to the parent. Selection is a `computed()` projection of `parent.isSelected(value)`, never local state. Without this directive the chip is decorative; for a standalone interactive chip use `CngxChipInteraction` instead.

## Import

```ts
import { CngxChipInGroup } from '@cngx/common/interactive';
```

## Quick start

```html
<cngx-chip-group label="Size" [(selected)]="size">
  <cngx-chip cngxChipInGroup [value]="'sm'">Small</cngx-chip>
  <cngx-chip cngxChipInGroup [value]="'md'">Medium</cngx-chip>
  <cngx-chip cngxChipInGroup [value]="'lg'">Large</cngx-chip>
</cngx-chip-group>

<cngx-multi-chip-group label="Tags" [(selectedValues)]="tags">
  @for (tag of allTags(); track tag) {
    <cngx-chip cngxChipInGroup [value]="tag" [removable]="true">{{ tag }}</cngx-chip>
  }
</cngx-multi-chip-group>
```

A `[cngxChipInGroup]` outside any chip-group throws `NullInjectorError` at construction. That is intentional.

## Accessibility

Host gets `role="option"`, `aria-selected` driven by the parent's selection controller, and `aria-disabled` reflecting the cascade. Composes `CngxRovingItem` so arrow-key navigation managed by the parent's `CngxRovingTabindex` skips disabled leaves. Click, Space, and Enter call `parent.toggle(value)`. Backspace and Delete call `parent.remove(value)`. Clicks bubbling from the chip's internal `.cngx-chip__remove` button are filtered so the chip's own `(remove)` output does not double-fire with the toggle.

Group-level disable short-circuits selection and removal but does not propagate into `CngxRovingItem.disabled` - a fully-disabled group still allows focus transit. Tracked as accepted debt; mirrors `CngxRadio` and `CngxButtonToggle`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and tokens.
- `CngxChipGroup`, `CngxMultiChipGroup` - the required parent hosts.
- `CngxChipInteraction` - standalone variant when no group is present.
