# CngxMultiSelect

Multi-value select with the same button-style trigger as [`CngxSelect`](../single-select/README.md), plus a chip strip showing the selected options. Same async-state, slot, and commit machinery - the value is `T[]` instead of `T | undefined`.

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

## Mobile sheet

On a touch screen narrower than 48rem the panel opens as a modal bottom sheet, named by the field label, with a close button, Done and a decorative handle. Focus moves into the sheet and back to the trigger on close. Force a presentation with `[presentation]` (`'anchored'`, `'sheet'`, `'fullscreen'`), set the title with `[sheetLabel]`, or turn the sheet off with `withMobileSheet('off')`. Details: [Mobile sheet](../README.md#mobile-sheet).

## Touch

Under the touch floor the chip strip becomes a one-line summary: the placeholder with no value, the label with one value, and the first label plus a `+N` badge with two or more. The row keeps its 44px height. Full behaviour and opt-out: [Summary trigger under the touch floor](../README.md#summary-trigger-under-the-touch-floor).

- `*cngxMultiSelectTriggerLabel` replaces the summary once a value is selected. With no value the placeholder still shows first.
- `*cngxSelectChipOverflow` replaces the summary's `+N` badge as well as the chip-strip badge.
- `*cngxMultiSelectChip`, `chipOverflow` and `maxVisibleChips` apply on a fine pointer only. `[cngxTouchTarget]="'off'"` (or `data-touch="off"`) brings the chips back on a touch screen.

## Template slots

All [`CngxSelect` slots](../single-select/README.md#template-slots) except `*cngxSelectTriggerLabel` (single only), plus:

| Slot | Replaces |
|-|-|
| `*cngxMultiSelectChip`         | Per-chip rendering                       |
| `*cngxMultiSelectTriggerLabel` | Whole chip strip with text/badge summary |
| `*cngxSelectChipOverflow` | `+N` badge after the visible chips under `chipOverflow: 'truncate'`; gets `count`, `label`, `hidden` (the hidden selected options) |

The selected-option label inside the default `<cngx-chip>` is also overridable via `*cngxSelectOptionLabel` - that template renders both in the panel rows AND in the default chip body.

## Keyboard

Same as `CngxSelect` plus:

| Key | Behaviour |
|-|-|
| Printable key (panel closed, `typeaheadWhileClosed: true`) | Toggle first matching option (add or remove); buffer auto-clears so repeat keys re-toggle |
