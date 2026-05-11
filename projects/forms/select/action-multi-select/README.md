# CngxActionMultiSelect

Multi-value variant of [`CngxActionSelect`](../action-select/README.md) — the same inline `*cngxSelectAction` workflow, but with a chip strip + inline `<input>` like [`CngxCombobox`](../combobox/README.md).
Pick multiple values, create new ones inline, all without leaving the panel.

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
      [displayWith]="display"
      [quickCreateAction]="create"
      [(values)]="values"
      placeholder="Pick or create tags…"
    >
      <ng-template cngxSelectAction let-term let-commit="commit" let-pending="isPending">
        <button type="button" [disabled]="!term || pending" (click)="commit()">
          @if (pending) {
            ⏳ Creating…
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
  protected readonly display = (t: Tag) => t.name;
  protected readonly create = (term: string) =>
    of({ id: `t-${Date.now()}`, name: term }).pipe(delay(400));
}
```

## Inputs (cheat-sheet)

Most inputs mirror [`CngxCombobox`](../combobox/README.md#inputs-cheat-sheet) plus the action-host inputs from [`CngxActionSelect`](../action-select/README.md#inputs-cheat-sheet):

| Input                 | Type                                                 | Purpose                                                |
| --------------------- | ---------------------------------------------------- | ------------------------------------------------------ |
| `[(values)]`          | `model<T[]>`                                         | Two-way bound array value                              |
| `[quickCreateAction]` | `(term: string) => Observable<T> \| Promise<T> \| T` | Async "create + select" handler                        |
| `[actionPosition]`    | `'top' \| 'bottom' \| 'both' \| 'none'`              | Where in the panel-shell stack the action slot renders |
| `[localItems]`        | `Signal<readonly CngxSelectOptionDef<T>[]>`          | Persistent quick-create buffer                         |

## Outputs

All [`CngxCombobox` outputs](../combobox/README.md#outputs) plus:

| Output      | Payload | Fires on                                                                                            |
| ----------- | ------- | --------------------------------------------------------------------------------------------------- |
| `(created)` | `T`     | `quickCreateAction` resolved successfully — the new value is also automatically added to `values()` |

## Forms integration

Identical to [`CngxCombobox`](../combobox/README.md#forms-integration). The `Field<T[]>` syncs with `(values)`.

## Action slot context

Same shape as `CngxActionSelect` — see [`../action-select/README.md`](../action-select/README.md#action-slot-context). The bridge tracks `dirty` automatically while the `<input>` term is non-empty.

## Common patterns

### Create + auto-select

The default `(created)` flow:

1. User types a term that doesn't match any option.
2. Consumer's `*cngxSelectAction` button calls `commit()`.
3. `quickCreateAction(term)` resolves to a new `T`.
4. The new value is **added to `values()`** AND emitted via `(created)`.
5. The action input clears; the panel stays open (override via `withCloseOnCreate(true)`).
6. Subsequent option-list refetches (`[state]` updates) merge the `localItems` buffer into the panel so the just-created tag stays visible until the server-side list catches up.

### Persistent quick-create buffer

```typescript
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '@cngx/forms/select';

readonly localItems = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<Tag>({
  compareWith: (a, b) => a.id === b.id,
});
```

```html
<cngx-action-multi-select
  [options]="serverTags()"
  [state]="state"
  [localItems]="localItems.items"
  [(values)]="values"
  [quickCreateAction]="create"
/>
```

The buffer survives state refetches — items drop out silently once the server-side list contains them (deduped via `compareWith`).

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

## Template slots

All [`CngxCombobox` slots](../combobox/README.md#template-slots) plus the action slot from [`CngxActionSelect`](../action-select/README.md#template-slots):

| Slot                | Replaces                                            |
| ------------------- | --------------------------------------------------- |
| `*cngxSelectAction` | Inline action workflow inside the panel-shell stack |

## Theming

Reuses the chip-strip and trigger variables from [`CngxCombobox`](../combobox/README.md#theming) and the action-slot positioning from `select-base.css`.

## Keyboard

Same as [`CngxCombobox`](../combobox/README.md#keyboard) plus the action-slot interception per `focusTrapBehavior`.
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
