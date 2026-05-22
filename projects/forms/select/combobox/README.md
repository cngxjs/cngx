# CngxCombobox

Multi-value tag picker with an inline `<input role="combobox">` -type to filter, pick to commit.
Same chip strip as [`CngxMultiSelect`](../multi-select/README.md), but the trigger lets users narrow the option list with live search.

## When to use

- Selecting multiple values from a long list where typeahead matters.
- Server-driven autocomplete that returns a candidate list per keystroke.
- A "tag input" experience: chips on the left, free-text input on the right.

For single-value autocomplete reach for [`CngxTypeahead`](../typeahead/README.md).
For a button trigger reach for [`CngxMultiSelect`](../multi-select/README.md).

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { CngxCombobox, type CngxSelectOptionDef } from '@cngx/forms/select';

@Component({
  selector: 'app-tag-combo',
  imports: [CngxCombobox],
  template: `
    <cngx-combobox
      [label]="'Tags'"
      [options]="tags"
      [(values)]="values"
      [clearable]="true"
      placeholder="Type to filter…"
    />
  `,
})
export class TagCombo {
  protected readonly values = signal<string[]>([]);
  protected readonly tags: CngxSelectOptionDef<string>[] = [
    { value: 'angular', label: 'Angular' },
    { value: 'signals', label: 'Signals' },
    { value: 'rxjs', label: 'RxJS' },
    { value: 'a11y', label: 'A11y' },
  ];
}
```

## Forms integration

Identical to [`CngxMultiSelect`](../multi-select/README.md#forms-integration). The bound `Field<T[]>` syncs bidirectionally with `(values)`.

## Common patterns

### Server-driven autocomplete

```typescript
import { createManualState } from '@cngx/common/data';

protected readonly state = createManualState<CngxSelectOptionDef<string>[]>();
protected readonly values = signal<string[]>([]);

protected handleSearch(term: string): void {
  this.state.set('loading');
  this.api.searchTags(term).subscribe(
    (results) => this.state.setSuccess(results),
    (err) => this.state.setError(err),
  );
}
```

```html
<cngx-combobox
  [options]="[]"
  [state]="state"
  [(values)]="values"
  [searchMatchFn]="passThroughMatcher"
  [skipInitial]="true"
  (searchTermChange)="handleSearch($event)"
/>
```

`passThroughMatcher` (return `true` for every option) disables the client-side filter, so the panel renders whatever the server returned.

### Custom chip rendering

Same as `CngxMultiSelect` but the directive is `*cngxComboboxChip`:

```html
<cngx-combobox [options]="tags" [(values)]="values">
  <ng-template cngxComboboxChip let-opt let-remove="remove" let-i="index">
    <my-tag [data-index]="i" (close)="remove()">{{ opt.label }}</my-tag>
  </ng-template>
</cngx-combobox>
```

The context shape is identical to `*cngxMultiSelectChip` so the same template can be reused across both variants.

### Text-summary trigger

```html
<cngx-combobox [options]="tags" [(values)]="values">
  <ng-template cngxComboboxTriggerLabel let-count="count">
    @if (count > 0) { {{ count }} tags · }
  </ng-template>
</cngx-combobox>
```

The chip strip is suppressed; the search input stays visible next to the summary. Mutually exclusive with `*cngxComboboxChip`.

### Backspace-on-empty removes the trailing chip

Wired natively - pressing Backspace in an empty input triggers the same commit-aware path as the chip ✕ button.

### Input adornments

```html
<cngx-combobox [options]="tags" [(values)]="values">
  <ng-template cngxSelectInputPrefix>
    <span aria-hidden="true">🔍</span>
  </ng-template>
  <ng-template cngxSelectInputSuffix let-pending="panelOpen">
    @if (pending) { <span aria-hidden="true">▾</span> }
  </ng-template>
</cngx-combobox>
```

Both slot directives accept the same context: `{ disabled, focused, panelOpen }`.

## Template slots

All [`CngxMultiSelect` slots](../multi-select/README.md#template-slots) plus:

| Slot                        | Replaces                                                                       |
| --------------------------- | ------------------------------------------------------------------------------ |
| `*cngxComboboxChip`         | Per-chip rendering (combobox-specific; same context as `*cngxMultiSelectChip`) |
| `*cngxComboboxTriggerLabel` | Chip strip → text summary (search input stays visible)                         |
| `*cngxSelectInputPrefix`    | Adornment before the `<input>`                                                 |
| `*cngxSelectInputSuffix`    | Adornment after the `<input>`, before clear/caret                              |

## Keyboard

| Key                       | Behaviour                                                           |
| ------------------------- | ------------------------------------------------------------------- |
| Printable key             | Filter the panel options                                            |
| `Arrow Down` / `Up`       | Move highlight                                                      |
| `Enter`                   | Toggle highlighted option (no panel close - `closeOnSelect: false`) |
| `Backspace` (empty input) | Remove the trailing chip (commit-aware)                             |
| `Escape`                  | Close panel                                                         |
