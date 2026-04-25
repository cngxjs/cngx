# CngxReorderableMultiSelect

Multi-value select where the chip strip is reorderable.
Same surface as [`CngxMultiSelect`](../multi-select/README.md) plus pointer-drag and keyboard reorder (modifier + arrow keys).
Reorder commits flow through the same `[commitAction]` machinery — useful for ranked lists that persist their order to the server.

## When to use

- Ordered selection lists (priorities, route stops, recipient sequences, playlist tracks).
- Need both selection AND ordering in one widget without dropping into a custom drag-and-drop component.

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { CngxReorderableMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';

@Component({
  selector: 'app-rank-picker',
  imports: [CngxReorderableMultiSelect],
  template: `
    <cngx-reorderable-multi-select
      [label]="'Recipients'"
      [options]="people"
      [(values)]="values"
      placeholder="Pick recipients…"
    />
  `,
})
export class RankPicker {
  protected readonly values = signal<string[]>(['ada', 'grace']);
  protected readonly people: CngxSelectOptionDef<string>[] = [
    { value: 'ada', label: 'Ada Lovelace' },
    { value: 'grace', label: 'Grace Hopper' },
    { value: 'margaret', label: 'Margaret Hamilton' },
  ];
}
```

## Inputs (cheat-sheet)

Most inputs mirror [`CngxMultiSelect`](../multi-select/README.md#inputs-cheat-sheet). Reorder-specific:

| Input                       | Type                        | Purpose                                                         |
| --------------------------- | --------------------------- | --------------------------------------------------------------- |
| `[reorderKeyboardModifier]` | `'ctrl' \| 'alt' \| 'meta'` | Modifier required for keyboard reorder (default `'ctrl'`)       |
| `[reorderAriaLabel]`        | `string`                    | ARIA label on the chip-strip group (default DE / EN per config) |
| `[chipDragHandle]`          | `TemplateRef<void> \| null` | Override the default ⋮⋮ grip glyph                              |

`[(values)]` IS the order signal — array index = chip position.

## Outputs

All [`CngxMultiSelect` outputs](../multi-select/README.md#outputs) plus:

| Output        | Payload                               | Fires on                                                                                             |
| ------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `(reordered)` | `CngxReorderableMultiSelectChange<T>` | Position-only change (membership preserved) — fires after `selectionChange` with `action: 'reorder'` |

`CngxReorderableMultiSelectChange<T>` extends the multi-select shape with `action: 'toggle' \| 'clear' \| 'reorder'` and adds `fromIndex` / `toIndex` on reorder events.

## Forms integration

Identical to [`CngxMultiSelect`](../multi-select/README.md#forms-integration). The `Field<T[]>` syncs both membership AND order — your form model is the source of truth for sequence.

## Common patterns

### Reorder commits to the server

```typescript
import { type CngxSelectCommitAction } from '@cngx/forms/select';

protected readonly commitAction: CngxSelectCommitAction<string[]> = (intended) =>
  this.api.savePriorities(intended).pipe(map(() => intended));
```

```html
<cngx-reorderable-multi-select
  [options]="people"
  [(values)]="values"
  [commitAction]="commitAction"
  commitMode="optimistic"
/>
```

Reorder paths bypass `ArrayCommitHandler.beginToggle` (whose `sameArrayContents` guard would skip same-membership changes) and talk to the commit controller directly.
The chip strip freezes during a commit in flight (`reorderDisabled = disabled() || isCommitting()`) to prevent racing moves.

### Chip drag-handle override

Three-stage cascade — directive wins over Input, Input wins over the default `CNGX_SELECT_GLYPHS.dragHandle` (`⋮⋮`):

```html
<cngx-reorderable-multi-select [options]="people" [(values)]="values">
  <ng-template cngxMultiSelectChipHandle>
    <svg viewBox="0 0 8 12" width="8" height="12" aria-hidden="true">
      <!-- six dots -->
    </svg>
  </ng-template>
</cngx-reorderable-multi-select>
```

The handle wrapper stays `aria-hidden="true"` — drag affordance is exposed to AT via `[reorderAriaLabel]`.

### Custom chip rendering with positional labels

```html
<cngx-reorderable-multi-select [options]="people" [(values)]="values">
  <ng-template cngxMultiSelectChip let-opt let-i="index" let-remove="remove">
    <span class="rank-pill">
      <span class="rank-pill__num">#{{ i + 1 }}</span>
      <span class="rank-pill__name">{{ opt.label }}</span>
      <button type="button" (click)="remove()">×</button>
    </span>
  </ng-template>
</cngx-reorderable-multi-select>
```

Context includes `index` so consumer markup can render position-aware UI.

## Template slots

All [`CngxMultiSelect` slots](../multi-select/README.md#template-slots) plus:

| Slot                         | Replaces                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `*cngxMultiSelectChipHandle` | Drag-handle glyph inside each chip (highest precedence in the three-stage cascade) |

## Theming

| Variable                                        | Default                                 |
| ----------------------------------------------- | --------------------------------------- |
| `--cngx-reorderable-multi-select-min-width`     | `var(--cngx-multi-select-min-width)`    |
| `--cngx-reorderable-multi-select-gap`           | `0.25rem`                               |
| `--cngx-reorderable-multi-select-padding`       | `0.5rem 0.75rem`                        |
| `--cngx-reorderable-multi-select-min-height`    | `2.25rem`                               |
| `--cngx-reorderable-multi-select-bg`            | `var(--cngx-surface, #fff)`             |
| `--cngx-reorderable-multi-select-border`        | `1px solid var(--cngx-border, #d0d7de)` |
| `--cngx-reorderable-multi-select-radius`        | `var(--cngx-radius, 6px)`               |
| `--cngx-reorderable-multi-select-focus-outline` | `var(--cngx-focus-ring)`                |

Family-shared drag/drop variables in `select-base.css`:

| Variable                          | Default                                   |
| --------------------------------- | ----------------------------------------- |
| `--cngx-select-chip-handle-color` | `currentColor`                            |
| `--cngx-select-chip-handle-size`  | `1rem`                                    |
| `--cngx-select-chip-drag-opacity` | `0.55`                                    |
| `--cngx-select-chip-drag-shadow`  | `0 4px 8px rgba(0,0,0,0.15)`              |
| `--cngx-select-chip-drop-outline` | `2px dashed var(--cngx-primary, #1976d2)` |

## Keyboard

| Key                               | Behaviour                              |
| --------------------------------- | -------------------------------------- |
| Modifier + `Arrow Left` / `Up`    | Move focused chip backward by 1        |
| Modifier + `Arrow Right` / `Down` | Move focused chip forward by 1         |
| Modifier + `Home`                 | Move focused chip to position 0        |
| Modifier + `End`                  | Move focused chip to last position     |
| Plain `Arrow Left` / `Right`      | Roving focus across chips (no reorder) |
| Backspace on chip                 | Remove (commit-aware, single deselect) |

Modifier defaults to `Ctrl`; configurable via
`provideReorderableSelectConfig(withReorderKeyboardModifier('alt'))`.

Pointer drag works regardless of keyboard modifier — drag a chip's
handle (`⋮⋮` or your custom slot template) to reorder. Escape during a
drag cancels without commit; pointer release commits.

## Configuration

```typescript
import {
  provideCngxSelect,
  withReorderKeyboardModifier,
  withReorderStripFreeze,
  withDefaultDragHandle,
} from '@cngx/forms/select';

bootstrapApplication(App, {
  providers: [
    provideCngxSelect(
      withReorderKeyboardModifier('meta'),
      withReorderStripFreeze(true),
      withDefaultDragHandle(myDragHandleTemplate),
    ),
  ],
});
```
