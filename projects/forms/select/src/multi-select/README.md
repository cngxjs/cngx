# CngxMultiSelect

Multi-value select with the same button-style trigger as [`CngxSelect`](../single-select/README.md), plus a chip strip showing the selected options. Same async-state, slot, and commit machinery — the value is `T[]` instead of `T | undefined`.

## When to use

- Selecting multiple primitives or object refs from a flat list.
- Trigger should look like the single-select (button + chip summary).
- For a typeahead-filtered chip picker reach for [`CngxCombobox`](../combobox/README.md).
- For drag-reorderable chips reach for [`CngxReorderableMultiSelect`](../reorderable-multi-select/README.md).
- For a hierarchical option tree reach for [`CngxTreeSelect`](../tree-select/README.md).

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { CngxMultiSelect, type CngxSelectOptionDef } from '@cngx/forms/select';

@Component({
  selector: 'app-tag-picker',
  imports: [CngxMultiSelect],
  template: `
    <cngx-multi-select
      [label]="'Tags'"
      [options]="tags"
      [(values)]="values"
      [clearable]="true"
      placeholder="Pick tags…"
    />
  `,
})
export class TagPicker {
  protected readonly values = signal<string[]>(['angular', 'signals']);
  protected readonly tags: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'A11y' },
  ];
}
```

## Inputs (cheat-sheet)

Most inputs mirror [`CngxSelect`](../single-select/README.md#inputs-cheat-sheet). Multi-specific:

| Input                      | Type                                 | Purpose                            |
| -------------------------- | ------------------------------------ | ---------------------------------- |
| `[(values)]`               | `model<T[]>`                         | Two-way bound primary array        |
| `[chipRemoveAriaLabel]`    | `string`                             | Per-chip remove-button ARIA prefix |
| `[chipOverflow]`           | `'wrap' \| 'scroll-x' \| 'truncate'` | Chip-strip overflow strategy       |
| `[maxVisibleChips]`        | `number`                             | Truncate after N with "+M" badge   |
| `[hideSelectionIndicator]` | `boolean`                            | Suppress the per-row checkbox      |

## Outputs

| Output                                     | Payload                    | Fires on                      |
| ------------------------------------------ | -------------------------- | ----------------------------- |
| `(selectionChange)`                        | `CngxMultiSelectChange<T>` | Any user-driven values change |
| `(optionToggled)`                          | `{ option, added }`        | Single option flipped on/off  |
| `(cleared)`                                | `void`                     | Clear-all clicked             |
| `(openedChange)` / `(opened)` / `(closed)` | as `CngxSelect`            | Panel lifecycle               |
| `(retry)`                                  | `void`                     | Consumer retry                |
| `(commitError)`                            | `unknown`                  | `commitAction` rejected       |

`CngxMultiSelectChange<T>` carries `{ source, values, previousValues, added, removed, option, action: 'toggle' \| 'clear' \| 'select-all' }`.

## Forms integration

Identical to [`CngxSelect`](../single-select/README.md#forms-integration) but the field's `Field<T>` should be typed as `Field<T[]>` for Signal Forms and `FormControl<T[]>` for RF.

## Common patterns

### Per-toggle commit

```typescript
import { type CngxSelectCommitAction } from '@cngx/forms/select';

protected readonly commitAction: CngxSelectCommitAction<string[]> = (intended) =>
  this.api.saveTags(intended).pipe(map(() => intended));
```

```html
<cngx-multi-select
  [options]="tags"
  [(values)]="values"
  [commitAction]="commitAction"
  commitMode="optimistic"
/>
```

Each chip add/remove and the clear-all triggers one commit. `optionToggled` fires once per individual flip; `selectionChange` fires once per server-acknowledged values write.

### Custom chip rendering

```html
<cngx-multi-select [options]="tags" [(values)]="values">
  <ng-template cngxMultiSelectChip let-opt let-remove="remove">
    <my-tag [color]="opt.meta?.color" (close)="remove()"> {{ opt.label }} </my-tag>
  </ng-template>
</cngx-multi-select>
```

### Text-summary trigger (no chips)

```html
<cngx-multi-select [options]="tags" [(values)]="values">
  <ng-template cngxMultiSelectTriggerLabel let-count="count">
    @if (count === 0) {
    <!-- placeholder takes over -->
    } @else if (count === 1) { 1 tag selected } @else { {{ count }} tags selected }
  </ng-template>
</cngx-multi-select>
```

The chip strip is suppressed when this slot is projected.
Mutually exclusive with `*cngxMultiSelectChip`.

### Typeahead-while-closed (toggle on keystroke)

Every printable key while the panel is closed toggles the first matching option (add/remove). Configurable via:

```typescript
provideCngxSelect(withTypeaheadWhileClosed(true));
```

## Template slots

All [`CngxSelect` slots](../single-select/README.md#template-slots) plus:

| Slot                           | Replaces                                 |
| ------------------------------ | ---------------------------------------- |
| `*cngxMultiSelectChip`         | Per-chip rendering                       |
| `*cngxMultiSelectTriggerLabel` | Whole chip strip with text/badge summary |

The selected-option label inside the default `<cngx-chip>` is also overridable via `*cngxSelectOptionLabel` — that template renders both in the panel rows AND in the default chip body.

## Theming

CSS variables on top of the [`CngxSelect` set](../single-select/README.md#theming):

| Variable                                 | Default                          |
| ---------------------------------------- | -------------------------------- |
| `--cngx-multi-select-min-width`          | `var(--cngx-select-min-width)`   |
| `--cngx-multi-select-chip-gap`           | `0.25rem`                        |
| `--cngx-multi-select-chip-padding-block` | `0.15rem`                        |
| `--cngx-select-chip-overflow-badge-bg`   | `var(--cngx-surface-2, #f3f4f6)` |

Family-shared chip-strip layout variables (`--cngx-select-chip-list`, `--cngx-select-chip-radius`, …) come from `select-base.css`.

## Keyboard

Same as `CngxSelect` plus:

| Key                                                        | Behaviour                                                                                 |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Printable key (panel closed, `typeaheadWhileClosed: true`) | Toggle first matching option (add or remove); buffer auto-clears so repeat keys re-toggle |
