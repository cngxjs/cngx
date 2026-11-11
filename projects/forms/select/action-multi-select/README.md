# CngxActionMultiSelect

Multi-value variant of [`CngxActionSelect`](../action-select/README.md) - the same inline `*cngxSelectAction` workflow, but with a chip strip + inline `<input>` like [`CngxCombobox`](../combobox/README.md).

## When to use

- Multi-value selection that needs an inline create / filter / manage workflow alongside the option list.
- "Tag input with create" experiences (e.g. recipient pickers, tag managers).

For single-value action workflows reach for [`CngxActionSelect`](../action-select/README.md).
For pure multi-value typeahead without action workflow reach for [`CngxCombobox`](../combobox/README.md).

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import {
  CngxActionMultiSelect,
  CngxSelectAction,
  type CngxSelectOptionDef,
} from '@cngx/forms/select';
import { delay, of } from 'rxjs';

interface Tag {
  readonly id: string;
  readonly name: string;
}

@Component({
  selector: 'app-tag-multi-picker',
  imports: [CngxActionMultiSelect, CngxSelectAction],
  template: `
    <cngx-action-multi-select
      [label]="'Tags'"
      [options]="tags"
      [compareWith]="compare"
      [quickCreateAction]="create"
      [(values)]="values"
      placeholder="Pick or create tags…"
    >
      <ng-template cngxSelectAction let-term let-commit="commit" let-pending="isPending">
        <button type="button" [disabled]="!term || pending" (click)="commit()">
          @if (pending) {
            Creating…
          } @else {
            + Create tag "{{ term }}"
          }
        </button>
      </ng-template>
    </cngx-action-multi-select>
  `,
})
export class TagMultiPicker {
  protected readonly values = signal<Tag[]>([]);
  protected readonly tags: CngxSelectOptionDef<Tag>[] = [
    { value: { id: 't1', name: 'Frontend' }, label: 'Frontend' },
    { value: { id: 't2', name: 'Backend' }, label: 'Backend' },
  ];
  protected readonly compare = (a?: Tag, b?: Tag) => a?.id === b?.id;
  protected readonly create = (term: string) =>
    of({ id: `t-${Date.now()}`, name: term }).pipe(delay(400));
}
```

## Forms integration

Identical to [`CngxCombobox`](../combobox/README.md#forms-integration). The `Field<T[]>` syncs with `(values)`.

## Action slot context

Same shape as `CngxActionSelect` - see [`../action-select/README.md`](../action-select/README.md#action-slot-context). `dirty` is `false` until the action template calls `setDirty(true)`; `cancel()` (Escape under the focus-trap policy) and a successful create reset it. Nothing else writes it, typing included.

## Common patterns

### Create + auto-select

The default `(created)` flow:

1. User types a term that doesn't match any option.
2. Consumer's `*cngxSelectAction` button calls `commit()`.
3. `quickCreateAction(term)` resolves to a new `T`.
4. The new value is **added to `values()`** AND emitted via `(created)`.
5. The action input clears; the panel stays open (override via `withCloseOnCreate(true)`).
6. Subsequent option-list refetches (`[state]` updates) merge the component's local-items buffer into the panel so the just-created tag stays visible until the server-side list catches up.

### Persistent quick-create buffer

The component owns its local-items buffer: every quick-created item is patched into it, and the panel merges it over `[options]` until a server-side refetch contains the same value (deduped via `compareWith`). There is no `[localItems]` input. To change how the buffer behaves - audit logging, persistence, backend sync - override `CNGX_LOCAL_ITEMS_BUFFER_FACTORY`. The factory receives the component's `compareWith` as a `Signal<CngxSelectCompareFn<T>>`:

```typescript
import {
  CNGX_LOCAL_ITEMS_BUFFER_FACTORY,
  createLocalItemsBuffer,
  type CngxLocalItemsBufferFactory,
} from '@cngx/forms/select';

const auditedBuffer: CngxLocalItemsBufferFactory = (compareWith) => {
  const buffer = createLocalItemsBuffer(compareWith);
  return {
    items: buffer.items,
    patch(item) {
      auditLog('patch', item);
      buffer.patch(item);
    },
    clear() {
      buffer.clear();
    },
  };
};

@Component({
  providers: [{ provide: CNGX_LOCAL_ITEMS_BUFFER_FACTORY, useValue: auditedBuffer }],
  // ...
})
export class TagMultiPicker {}
```

### Custom chip rendering

Same shape as `CngxMultiSelect` / `CngxCombobox`:

```html
<cngx-action-multi-select [options]="tags" [(values)]="values" [quickCreateAction]="create">
  <ng-template cngxMultiSelectChip let-opt let-remove="remove">
    <my-tag (close)="remove()">{{ opt.label }}</my-tag>
  </ng-template>
  <ng-template cngxSelectAction ...> ... </ng-template>
</cngx-action-multi-select>
```

## Mobile sheet

On a touch screen narrower than 48rem the panel opens as a modal fullscreen panel with the search input in its header, named by the field label, with a close button, Done and a decorative handle. Focus moves into the sheet and back to the trigger on close. Force a presentation with `[presentation]` (`'anchored'`, `'sheet'`, `'fullscreen'`), set the title with `[sheetLabel]`, or turn the sheet off with `withMobileSheet('off')`. Details: [Mobile sheet](../README.md#mobile-sheet).

## Chip overflow

`chipOverflow` takes the same four modes as `CngxMultiSelect`: `'wrap'` (default), `'scroll-x'`, `'truncate'` and `'fit'`. Under `'fit'` the trigger stays one row, the chips that fit next to the input show and the rest fold into the `+N` badge; the hidden chips are out of the tab order and the whole selection reaches assistive technology as the input description. The badge reserve and its trade-off: [Chip overflow](../multi-select/README.md#chip-overflow).

## Touch

Under the touch floor the chips give way to the one-line summary in front of the search input: the label with one value, the label plus a `+N` badge with two or more, and the input's placeholder with no value. The search input keeps the search term. The whole selection reaches assistive technology through `aria-describedby` on the input; the reference is set only while there is a selection to describe. Full behaviour and opt-out: [Summary trigger under the touch floor](../README.md#summary-trigger-under-the-touch-floor).

- `*cngxComboboxTriggerLabel` replaces the summary and the chips whenever it is projected, with or without a selection. The search input stays.
- `*cngxSelectChipOverflow` replaces the summary's `+N` badge as well as the chip-strip badge.
- `*cngxMultiSelectChip`, `chipOverflow` and `maxVisibleChips` apply on a fine pointer only. `[cngxTouchTarget]="'off'"` (or `data-touch="off"`) brings the chips back on a touch screen.

## Template slots

All [`CngxCombobox` slots](../combobox/README.md#template-slots) except `*cngxComboboxChip`, which this variant does not query (it renders `*cngxMultiSelectChip` with the same context), plus the action slot from [`CngxActionSelect`](../action-select/README.md#template-slots):

| Slot | Replaces |
|-|-|
| `*cngxSelectAction` | Inline action workflow inside the panel-shell stack |

## Keyboard

Same as [`CngxCombobox`](../combobox/README.md#keyboard) plus the action-slot interception per `focusTrapBehavior`, and Enter as on [`CngxActionSelect`](../action-select/README.md#keyboard): with no option highlighted, a bound `quickCreateAction` and a non-empty term it runs the create flow, after a still-debouncing term has settled and only while the panel is still open.
The bridge intercepts Escape while the action workflow is `dirty`, so users don't accidentally dump unsaved input.

## Configuration

Action-host configuration applies identically to `CngxActionSelect`:

```typescript
import {
  provideCngxSelect,
  withActionPosition,
  withCloseOnCreate,
  withFocusTrapBehavior,
} from '@cngx/forms/select';

provideCngxSelect(
  withActionPosition('bottom'),
  withCloseOnCreate(false), // multi-select usually keeps the panel open after create
  withFocusTrapBehavior('dirty'),
);
```

Per-instance inputs win over the config: `[closeOnCreate]` (`withCloseOnCreate`; `false` when neither is set), `[liveInputFallback]` (`withLiveInputFallback`), `[actionPosition]` (`withActionPosition`), `[popoverPlacement]` (`withActionPopoverPlacement`), `[inputMode]` (`withInputMode`), `[enterKeyHint]` (`withEnterKeyHint`). `(created)` emits the created option after a successful quick-create.
