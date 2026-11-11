# CngxActionSelect

Single-value variant of [`CngxTypeahead`](../typeahead/README.md) that hosts an inline action workflow inside the panel.
The `*cngxSelectAction` slot lets consumers render a quick-create form, a filter bar, or a "manage tags" pop-out without closing the panel - the slot context exposes `commit()` / `close()` / `isPending` / `dirty` / `retry()` / `error` so consumer markup orchestrates the inline workflow declaratively.

## When to use

- Pickers that need an inline "create a new option" affordance.
- Workflows where the user should be able to act on the option list without losing panel context (filter, manage, bulk-edit).
- Single-value selection - the multi-value sibling is [`CngxActionMultiSelect`](../action-multi-select/README.md).

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

## Forms integration

Identical to [`CngxTypeahead`](../typeahead/README.md#forms-integration). The bound `Field<T>` syncs with `(value)`.

## Input text

Unfocused, the input shows the committed value as text:

- a bound `displayWith` formats it;
- unbound, the input shows the label last resolved for the value. A refetch that renames the option updates the text, a result set that no longer contains the option keeps it;
- a value no option has matched yet shows `String(value)`.

Bind `displayWith` when the value is a server id or object the current options may not contain, for example a server-driven search that drops the selected entry.

## Action slot context

The `*cngxSelectAction` template receives a context object with:

| Field | Type | Purpose |
|-|-|-|
| `$implicit` / `searchTerm` | `string`     | Current input text                                                          |
| `commit()`                 | `() => void` | Invoke the bound `quickCreateAction`                                        |
| `close()`                  | `() => void` | Force-close the panel                                                       |
| `isPending`                | `boolean`    | `true` while `quickCreateAction` is in flight                               |
| `dirty`                    | `boolean`    | `true` after the template called `setDirty(true)`, see below                |
| `retry()`                  | `() => void` | Replay the last failed `commit()`                                           |
| `error`                    | `unknown`    | Last `commit()` error (or `null`)                                           |
| `hasError`                 | `boolean`    | Convenience flag                                                            |
| `value`                    | `T`          | Current `value()` (type-erased)                                             |
| `setDirty(dirty: boolean)` | `(dirty: boolean) => void` | Marks the action workflow dirty or clean |

`dirty` is `false` until the action template calls `setDirty(true)`; `cancel()` (Escape under the focus-trap policy) and a successful create reset it. Nothing else writes it, typing included.

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
    Couldn't create - {{ error?.message }}
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

For demos that just need a canonical button pair, drop in the demo fixture from `examples/src/app/_fixtures/demo-action-buttons.component.ts`:

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

Demo fixture only - not part of the published `@cngx/forms/select` API.

### Dismiss-guard during a dirty workflow

When the action slot is `dirty` (per the bridge - typically tracked automatically while `quickCreateAction` is mid-flight), Escape and click-outside are intercepted so the user can't accidentally dump unsaved input.
Configurable via:

```typescript
import { provideCngxSelect, withFocusTrapBehavior } from '@cngx/forms/select';

provideCngxSelect(
  withFocusTrapBehavior('dirty'), // 'never' | 'always' | 'dirty' (default)
);
```

### Persistent local-items buffer

Just-created items survive a server `[state]` refetch - useful when the consumer creates an option locally before the next list refresh sees it. The component owns the buffer and patches every quick-created item into it; there is no `[localItems]` input. Entries drop out once the server-side list contains the same value (deduped via `compareWith`). To change the buffer, override `CNGX_LOCAL_ITEMS_BUFFER_FACTORY`; `createLocalItemsBuffer` takes the component's `compareWith` as a `Signal<CngxSelectCompareFn<T>>`:

```typescript
import {
  CNGX_LOCAL_ITEMS_BUFFER_FACTORY,
  createLocalItemsBuffer,
  type CngxLocalItemsBufferFactory,
} from '@cngx/forms/select';

const persistedBuffer: CngxLocalItemsBufferFactory = (compareWith) => {
  const buffer = createLocalItemsBuffer(compareWith);
  return {
    items: buffer.items,
    patch(item) {
      buffer.patch(item);
      persist(buffer.items());
    },
    clear() {
      buffer.clear();
      persist([]);
    },
  };
};
```

```typescript
providers: [{ provide: CNGX_LOCAL_ITEMS_BUFFER_FACTORY, useValue: persistedBuffer }],
```

## Mobile sheet

On a touch screen narrower than 48rem the panel opens as a modal fullscreen panel with the search input in its header, named by the field label, with a close button, Done and a decorative handle. Focus moves into the sheet and back to the trigger on close. Force a presentation with `[presentation]` (`'anchored'`, `'sheet'`, `'fullscreen'`), set the title with `[sheetLabel]`, or turn the sheet off with `withMobileSheet('off')`. Details: [Mobile sheet](../README.md#mobile-sheet).

## Template slots

All [`CngxTypeahead` slots](../typeahead/README.md#template-slots) plus:

| Slot | Replaces |
|-|-|
| `*cngxSelectAction` | Inline action workflow inside the panel-shell stack |

## Keyboard

Same as `CngxTypeahead` plus:

| Key | Behaviour |
|-|-|
| `Enter` on the input | With an option highlighted it picks that option. With none highlighted, a bound `quickCreateAction` and a non-empty term it runs the create flow. While the typed term is still debouncing, the trigger settles it and defers the key to after the next render; the create check then runs once, only while the panel is still open. The Enter that confirms an IME composition never creates |
| `Enter` inside the action slot | Whatever the action template wires up, typically `commit()` |
| `Escape` (action workflow dirty)                    | Intercepted per `focusTrapBehavior` - the consumer's `close()` callback owns the cancel decision |

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

Per-instance inputs win over the config: `[closeOnCreate]` (`withCloseOnCreate`; `true` when neither is set), `[liveInputFallback]` (`withLiveInputFallback`), `[actionPosition]` (`withActionPosition`), `[popoverPlacement]` (`withActionPopoverPlacement`). `[clearOnBlur]` (default `true`) rewrites the input from the committed value when focus leaves and drops unfinished search text. `(created)` emits the created option after a successful quick-create.
