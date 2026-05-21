# CngxTypeahead

Single-value autocomplete with an inline `<input role="combobox">` and `displayWith` formatter — the inline-input twin of [`CngxSelect`](../single-select/README.md).
Type to filter, pick to commit; the input shows the formatted selection after the pick so it survives blur/refocus.

## When to use

- Single-value selection where typing-to-find beats a button summary.
- Server-driven autocomplete (subscribe to `(searchTermChange)` and push results via `[state]`).
- The input itself should display the chosen value as text (not a chip).

For multi-value autocomplete reach for [`CngxCombobox`](../combobox/README.md).
For a button trigger reach for [`CngxSelect`](../single-select/README.md).

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { CngxTypeahead, type CngxSelectOptionDef } from '@cngx/forms/select';

interface User {
  readonly id: string;
  readonly name: string;
}

@Component({
  selector: 'app-user-picker',
  imports: [CngxTypeahead],
  template: `
    <cngx-typeahead
      [label]="'User'"
      [options]="users"
      [compareWith]="compare"
      [displayWith]="display"
      [clearable]="true"
      placeholder="Search by name…"
      [(value)]="value"
    />
  `,
})
export class UserPicker {
  protected readonly value = signal<User | undefined>(undefined);
  protected readonly users: CngxSelectOptionDef<User>[] = [
    { value: { id: 'u1', name: 'Ada Lovelace' }, label: 'Ada Lovelace' },
    { value: { id: 'u2', name: 'Grace Hopper' }, label: 'Grace Hopper' },
  ];
  protected readonly compare = (a?: User, b?: User) => a?.id === b?.id;
  protected readonly display = (u?: User) => u?.name ?? '';
}
```

## Forms integration

Identical to [`CngxSelect`](../single-select/README.md#forms-integration). Bind `Field<T>` (Signal Forms) or use `adaptFormControl` for RF.

## Common patterns

### Server-driven autocomplete

```typescript
import { createManualState } from '@cngx/common/data';

protected readonly state = createManualState<CngxSelectOptionDef<User>[]>();
protected readonly value = signal<User | undefined>(undefined);

protected handleSearch(term: string): void {
  if (!term) {
    this.state.setSuccess([]);
    return;
  }
  this.state.set('loading');
  this.api.searchUsers(term).subscribe(
    (results) => this.state.setSuccess(results),
    (err) => this.state.setError(err),
  );
}
```

```html
<cngx-typeahead
  [options]="[]"
  [state]="state"
  [compareWith]="compare"
  [displayWith]="display"
  [searchMatchFn]="passThroughMatcher"
  [skipInitial]="true"
  [(value)]="value"
  (searchTermChange)="handleSearch($event)"
/>
```

### Async commit before persisting

```typescript
import { type CngxSelectCommitAction } from '@cngx/forms/select';

protected readonly commitAction: CngxSelectCommitAction<User> = (intended) =>
  this.api.assignUser(intended).pipe(map(() => intended));
```

```html
<cngx-typeahead
  [options]="users"
  [compareWith]="compare"
  [displayWith]="display"
  [(value)]="value"
  [commitAction]="commitAction"
  commitMode="optimistic"
/>
```

Optimistic mode closes the panel and writes immediately; rolls back on error and the input text snaps back to the previous value's `displayWith()` output.

### Avatar / two-line option rows

```html
<cngx-typeahead [options]="users" [displayWith]="display" [(value)]="value">
  <ng-template cngxSelectOptionLabel let-opt>
    <span style="display:flex;align-items:center;gap:0.5rem">
      <my-avatar [user]="opt.value" />
      <span>
        <strong>{{ opt.label }}</strong>
        <small>{{ opt.value.email }}</small>
      </span>
    </span>
  </ng-template>
</cngx-typeahead>
```

### Input adornments

```html
<cngx-typeahead [options]="users" [displayWith]="display" [(value)]="value">
  <ng-template cngxSelectInputPrefix>
    <span aria-hidden="true">🔍</span>
  </ng-template>
</cngx-typeahead>
```

Context: `{ disabled, focused, panelOpen }`.

## Template slots

All [`CngxSelect` slots](../single-select/README.md#template-slots) except `*cngxSelectTriggerLabel` (no chip strip — the input IS the trigger). Plus:

| Slot                     | Replaces                                          |
| ------------------------ | ------------------------------------------------- |
| `*cngxSelectInputPrefix` | Adornment before the `<input>`                    |
| `*cngxSelectInputSuffix` | Adornment after the `<input>`, before clear/caret |

## Keyboard

| Key                 | Behaviour                                                      |
| ------------------- | -------------------------------------------------------------- |
| Printable key       | Filter; auto-opens the panel                                   |
| `Arrow Down` / `Up` | Move highlight                                                 |
| `Enter`             | Pick highlighted option (closes panel — `closeOnSelect: true`) |
| `Escape`            | Close panel; clear pending input on second press               |
