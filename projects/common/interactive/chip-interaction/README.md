# Chip Interaction

Behavioural sibling of `CngxChip`. The display atom in `@cngx/common/display` paints the pill; `CngxChipInteraction` adds the `role="option"` selection semantics, keyboard handling, and remove dispatch on top of that same element. The two split cleanly: `<cngx-chip>` knows nothing about selection, `[cngxChipInteraction]` knows nothing about the visual. Stays standalone (does not need a chip-group ancestor); for chips inside a group use `[cngxChipInGroup]` instead.

## Import

```ts
import { CngxChipInteraction } from '@cngx/common/interactive';
import { CngxChip } from '@cngx/common/display';
```

## Quick start

```html
<cngx-chip
  cngxChipInteraction
  [value]="'red'"
  [(selected)]="redOn"
  [removable]="true"
  (removeRequest)="dropTag('red')"
>Red</cngx-chip>

<p>redOn: {{ redOn() }}</p>
```

Click, Space, or Enter toggles `selected`. Backspace or Delete fires `(removeRequest)`. Clicking the chip's own close button fires `(remove)` from `<cngx-chip>` and the interaction directive short-circuits its toggle, so the two events never collide.

## Keyboard interaction

| Key | Action |
|-|-|
| `Click` | Toggle `selected`. Suppressed when the click target is inside `.cngx-chip__remove` so the chip's own close button does not double-fire. |
| `Space` | Toggle `selected`. `preventDefault` to suppress page scroll. |
| `Enter` | Toggle `selected`. |
| `Backspace` | Emit `(removeRequest)`. |
| `Delete` | Emit `(removeRequest)`. |

All handlers no-op while `disabled()` is true.

## Accessibility

The host carries `role="option"` plus a reactive ARIA set computed from inputs:

| Input state | Host attributes |
|-|-|
| `selected()` true | `aria-selected="true"`, class `cngx-chip-interaction--selected` |
| `selected()` false | `aria-selected="false"` |
| `disabled()` true | `aria-disabled="true"`, `tabindex="-1"` |
| `invalid()` or aggregated error | `aria-invalid="true"` |
| `errorMessageId` set | `aria-errormessage="<id>"` |
| `disabledReason` set | `aria-describedby` points at an always-in-DOM sibling span carrying the reason |
| `cngxDescribedBy` set, no `disabledReason` | `aria-describedby="<consumer-id>"` |

The disabled-reason span is created via `Renderer2` in the constructor and removed in the `DestroyRef` hook, so the description id is stable across renders and never leaks across re-instantiations. Focus tracking is exposed via `focused()` (signal). On focus loss the directive calls `markAsTouched()` on the optional `CNGX_FORM_FIELD_HOST` so error reveal flows align with the rest of the forms stack.

Dev-mode guard: if `[cngxChipInteraction]` is mounted inside a `<cngx-chip-group>` or `<cngx-multi-chip-group>`, the constructor throws after the next render with a message pointing at `[cngxChipInGroup]`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full signal surface, tokens, and host bindings.
- Stories: `examples/stories/common/interactive/chip-interaction/`.
- `CngxChip` (`@cngx/common/display`) - the presentation atom this directive composes onto.
- `CngxChipInGroup` - the group-aware sibling; derives `selected` from the parent controller as a `computed()`.
- `CngxChipGroup`, `CngxMultiChipGroup` - single- and multi-selection group hosts.
