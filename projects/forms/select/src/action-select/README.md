# CngxActionSelect

Single-value variant of [`CngxTypeahead`](../typeahead/README.md) that hosts an inline action workflow inside the panel.
The `*cngxSelectAction` slot lets consumers render a quick-create form, a filter bar, or a "manage tags" pop-out without closing the panel — the slot context exposes `commit()` / `close()` / `isPending` / `dirty` / `retry()` / `error` so consumer markup orchestrates the inline workflow declaratively.

## When to use

- Pickers that need an inline "create a new option" affordance.
- Workflows where the user should be able to act on the option list without losing panel context (filter, manage, bulk-edit).
- Single-value selection — the multi-value sibling is [`CngxActionMultiSelect`](../action-multi-select/README.md).

For pure single-value autocomplete reach for [`CngxTypeahead`](../typeahead/README.md).

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { CngxActionSelect, CngxSelectAction, type CngxSelectOptionDef } from '@cngx/forms/select';
import { delay, of } from 'rxjs';

interface Tag {
  readonly id: string;
  readonly name: string;
}

@Component({
  selector: 'app-tag-picker',
  imports: [CngxActionSelect, CngxSelectAction],
  template: `
    <cngx-action-select
      [label]="'Tag'"
      [options]="tags"
      [compareWith]="compare"
      [displayWith]="display"
      [quickCreateAction]="create"
      [(value)]="value"
      placeholder="Pick or create a tag…"
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
    </cngx-action-select>
  `,
})
export class TagPicker {
  protected readonly value = signal<Tag | undefined>(undefined);
  protected readonly tags: CngxSelectOptionDef<Tag>[] = [
    { value: { id: 't1', name: 'Frontend' }, label: 'Frontend' },
    { value: { id: 't2', name: 'Backend' }, label: 'Backend' },
  ];
  protected readonly compare = (a?: Tag, b?: Tag) => a?.id === b?.id;
  protected readonly display = (t?: Tag) => t?.name ?? '';
  protected readonly create = (term: string) =>
    of({ id: `t-${Date.now()}`, name: term }).pipe(delay(400));
}
```

## Inputs (cheat-sheet)

Most inputs mirror [`CngxTypeahead`](../typeahead/README.md#inputs-cheat-sheet). Action-host-specific:

| Input                 | Type                                                 | Purpose                                                                                        |
| --------------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `[(value)]`           | `model<T \| undefined>`                              | Two-way bound scalar value                                                                     |
| `[quickCreateAction]` | `(term: string) => Observable<T> \| Promise<T> \| T` | Async "create and commit" handler invoked by `commit()`                                        |
| `[actionPosition]`    | `'top' \| 'bottom' \| 'both' \| 'none'`              | Where in the panel-shell stack the action slot renders                                         |
| `[localItems]`        | `Signal<readonly CngxSelectOptionDef<T>[]>`          | Persistent buffer of just-created items merged into the option list (survives state refetches) |

## Outputs

All [`CngxTypeahead` outputs](../typeahead/README.md#outputs) plus:

| Output      | Payload | Fires on                                  |
| ----------- | ------- | ----------------------------------------- |
| `(created)` | `T`     | `quickCreateAction` resolved successfully |

## Forms integration

Identical to [`CngxTypeahead`](../typeahead/README.md#forms-integration). The bound `Field<T>` syncs with `(value)`.

## Action slot context

The `*cngxSelectAction` template receives a context object with:

| Field                      | Type         | Purpose                                                                     |
| -------------------------- | ------------ | --------------------------------------------------------------------------- |
| `$implicit` / `searchTerm` | `string`     | Current input text                                                          |
| `commit()`                 | `() => void` | Invoke the bound `quickCreateAction`                                        |
| `close()`                  | `() => void` | Force-close the panel                                                       |
| `isPending`                | `boolean`    | `true` while `quickCreateAction` is in flight                               |
| `dirty`                    | `boolean`    | `true` after the user has typed at least once                               |
| `retry()`                  | `() => void` | Replay the last failed `commit()`                                           |
| `error`                    | `unknown`    | Last `commit()` error (or `null`)                                           |
| `hasError`                 | `boolean`    | Convenience flag                                                            |
| `value`                    | `T`          | Current `value()` (type-erased)                                             |
| `setDirty(dirty: boolean)` | `() => void` | Imperative dirty-flag write (rare — usually the bridge tracks this for you) |

## Common patterns

### Fail-and-retry

```html
<ng-template
  cngxSelectAction
  let-term
  let-commit="commit"
  let-error="error"
  let-retry="retry"
  let-pending="isPending"
>
  @if (error) {
  <div role="alert">
    Couldn't create — {{ error?.message }}
    <button type="button" (click)="retry()">Try again</button>
  </div>
  } @else {
  <button type="button" [disabled]="!term || pending" (click)="commit()">
    @if (pending) { ⏳ } @else { + Create "{{ term }}" }
  </button>
  }
</ng-template>
```

The retry replays with the same term that failed, no need to re-type.

### Use the shared OK/Cancel fixture

For demos that just need a canonical button pair, drop in the shared fixture from `dev-app/.../_fixtures/`:

```html
<ng-template
  cngxSelectAction
  let-commit="commit"
  let-close="close"
  let-pending="isPending"
  let-dirty="dirty"
>
  <demo-action-buttons
    [commitLabel]="'Create'"
    [requireDirty]="true"
    [context]="{ commit, close, isPending: pending, dirty }"
  />
</ng-template>
```

Demo fixture only — not part of the published `@cngx/forms/select` API.

### Dismiss-guard during a dirty workflow

When the action slot is `dirty` (per the bridge — typically tracked automatically while `quickCreateAction` is mid-flight), Escape and click-outside are intercepted so the user can't accidentally dump unsaved input.
Configurable via:

```typescript
import { provideCngxSelect, withFocusTrapBehavior } from '@cngx/forms/select';

provideCngxSelect(
  withFocusTrapBehavior('dirty'), // 'never' | 'always' | 'dirty' (default)
);
```

### Persistent local-items buffer

Just-created items survive a server `[state]` refetch — useful when the consumer creates an option locally before the next list refresh sees it.

```typescript
import { CNGX_LOCAL_ITEMS_BUFFER_FACTORY } from '@cngx/forms/select';

readonly localItems = inject(CNGX_LOCAL_ITEMS_BUFFER_FACTORY)<Tag>({
  compareWith: (a, b) => a.id === b.id,
});
```

```html
<cngx-action-select
  [options]="serverTags()"
  [state]="state"
  [localItems]="localItems.items"
  [(value)]="value"
  [quickCreateAction]="create"
/>
```

## Template slots

All [`CngxTypeahead` slots](../typeahead/README.md#template-slots) plus:

| Slot                | Replaces                                            |
| ------------------- | --------------------------------------------------- |
| `*cngxSelectAction` | Inline action workflow inside the panel-shell stack |

## Theming

Same trigger surface as [`CngxTypeahead`](../typeahead/README.md#theming) (`--cngx-typeahead-*`). Action-slot positioning sits in the panel-shell's own variables — see `select-base.css`.

## Keyboard

Same as `CngxTypeahead` plus:

| Key                                                 | Behaviour                                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Enter` (in action slot when no option highlighted) | Whatever the action template wires up — typically `commit()`                                     |
| `Escape` (action workflow dirty)                    | Intercepted per `focusTrapBehavior` — the consumer's `close()` callback owns the cancel decision |

## Configuration

```typescript
import {
  provideCngxSelect,
  withActionPosition,
  withCloseOnCreate,
  withFocusTrapBehavior,
} from '@cngx/forms/select';

provideCngxSelect(
  withActionPosition('bottom'), // 'top' | 'bottom' | 'both' | 'none'
  withCloseOnCreate(true), // close panel after successful create
  withFocusTrapBehavior('dirty'), // intercept Escape only when dirty
);
```
