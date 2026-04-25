# CngxSelect

Native-feeling single-select dropdown — the closest replacement for `<select>` with the cngx Signal-first toolkit, full ARIA combobox semantics, async-state support, and a pluggable commit lifecycle.

## When to use

- The value is a single primitive or object reference (not an array).
- The trigger should be a button-style summary, not an inline input.
- For inline-input single-value autocomplete, reach for [`CngxTypeahead`](../typeahead/README.md) instead.

For the eight-variant decision guide see [`ARCHITECTURE.md`](../../../ARCHITECTURE.md#pick-your-select-decision-guide).

## Quick start

```typescript
import { Component, signal } from '@angular/core';
import { CngxSelect, type CngxSelectOptionDef } from '@cngx/forms/select';

@Component({
  selector: 'app-color-picker',
  imports: [CngxSelect],
  template: `
    <cngx-select
      [label]="'Color'"
      [options]="colors"
      [(value)]="value"
      [clearable]="true"
      placeholder="Pick a color…"
    />
  `,
})
export class ColorPicker {
  protected readonly value = signal<string | undefined>(undefined);
  protected readonly colors: CngxSelectOptionDef<string>[] = [
    { value: 'red', label: 'Red' },
    { value: 'green', label: 'Green' },
    { value: 'blue', label: 'Blue' },
    { value: 'disabled', label: 'Unavailable', disabled: true },
  ];
}
```

## Inputs (cheat-sheet)

| Input                         | Type                                          | Purpose                                                       |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `[(value)]`                   | `model<T \| undefined>`                       | Two-way bound primary value                                   |
| `[label]`                     | `string`                                      | Field label (also feeds `aria-label` if `[aria-label]` unset) |
| `[options]`                   | `CngxSelectOptionsInput<T>`                   | Options or option-groups array                                |
| `[state]`                     | `CngxAsyncState<CngxSelectOptionsInput<T>>`   | Drives async panel views                                      |
| `[loading]`                   | `boolean`                                     | Force the loading view (without `[state]`)                    |
| `[disabled]`                  | `boolean`                                     | Disable trigger + clear button                                |
| `[required]`                  | `boolean`                                     | Adds `aria-required`                                          |
| `[clearable]`                 | `boolean`                                     | Show ✕ clear button when value is set                         |
| `[compareWith]`               | `(a, b) => boolean`                           | Custom equality (default: `Object.is`)                        |
| `[panelWidth]`                | `'trigger' \| number \| null`                 | Panel width strategy                                          |
| `[panelClass]`                | `string \| string[]`                          | Extra panel classes                                           |
| `[autofocus]`                 | `boolean`                                     | One-shot focus on mount                                       |
| `[commitAction]`              | `CngxSelectCommitAction<T>`                   | Async write before committing the value                       |
| `[commitMode]`                | `'optimistic' \| 'pessimistic'`               | Commit UX policy                                              |
| `[commitErrorDisplay]`        | `'banner' \| 'inline' \| 'none'`              | How to surface commit failures                                |
| `[selectionIndicatorVariant]` | `'auto' \| 'checkbox' \| 'checkmark' \| null` | Override per-instance                                         |

## Outputs

| Output              | Payload                  | Fires on                                        |
| ------------------- | ------------------------ | ----------------------------------------------- |
| `(selectionChange)` | `CngxSelectChange<T>`    | User-driven selection (not programmatic writes) |
| `(optionSelected)`  | `CngxSelectOptionDef<T>` | The picked option, with full meta               |
| `(openedChange)`    | `boolean`                | Every panel open/close                          |
| `(opened)`          | `void`                   | Panel opened                                    |
| `(closed)`          | `void`                   | Panel closed                                    |
| `(retry)`           | `void`                   | Consumer clicked the retry button               |
| `(commitError)`     | `unknown`                | `commitAction` rejected                         |

## Forms integration

### Signal Forms

```typescript
import { form, schema, required } from '@angular/forms/signals';
import { CngxFormField } from '@cngx/forms/field';

protected readonly model = signal<{ color: string }>({ color: '' });
protected readonly userForm = form(this.model, schema((root) => required(root.color)));
```

```html
<cngx-form-field [field]="userForm.color">
  <cngx-select [options]="colors" />
</cngx-form-field>
```

### Reactive Forms

```typescript
import { adaptFormControl } from '@cngx/forms/field';

protected readonly rfControl = new FormControl<string>('green', {
  validators: [Validators.required],
  nonNullable: true,
});
protected readonly rfField = adaptFormControl(this.rfControl, 'color', inject(DestroyRef));
```

```html
<cngx-form-field [field]="rfField">
  <cngx-select [options]="colors" />
</cngx-form-field>
```

## Common patterns

### Async options with `[state]`

```typescript
import { createManualState } from '@cngx/common/data';
protected readonly state = createManualState<CngxSelectOptionDef<string>[]>();

// In effect / on init: this.state.set('loading'); fetchOptions().subscribe(o => this.state.setSuccess(o));
```

```html
<cngx-select [options]="[]" [state]="state" [retryFn]="reload" [(value)]="value" />
```

The panel automatically renders `loading → success → empty / error → refreshing` views based on the manual-state machine. Override the visuals via the `loadingVariant` and `refreshingVariant` config keys (`'skeleton' | 'spinner' | 'bar' | 'text'`).

### Async write with `[commitAction]`

```typescript
import { type CngxSelectCommitAction } from '@cngx/forms/select';
import { delay, of } from 'rxjs';

protected readonly commitAction: CngxSelectCommitAction<string> = (intended) =>
  of(intended).pipe(delay(800)); // simulate server roundtrip
```

```html
<cngx-select
  [options]="colors"
  [(value)]="value"
  [commitAction]="commitAction"
  commitMode="optimistic"
  commitErrorDisplay="banner"
/>
```

Optimistic mode closes the panel and writes the value immediately; rolls back on error. Pessimistic mode keeps the panel open with a row spinner until success.

### Optgroups

```typescript
protected readonly priorities: CngxSelectOptionsInput<string> = [
  { label: 'Normal', children: [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
  ]},
  { label: 'Critical', children: [
    { value: 'high', label: 'High' },
    { value: 'urgent', label: 'Urgent' },
  ]},
];
```

```html
<cngx-select [label]="'Priority'" [options]="priorities" [(value)]="priority" />
```

## Template slots

Drop a `<ng-template>` with one of these directives inside `<cngx-select>` to override the default visual.

| Slot                       | Replaces                                                       |
| -------------------------- | -------------------------------------------------------------- |
| `*cngxSelectCheck`         | Selection indicator next to each option                        |
| `*cngxSelectCaret`         | Trigger caret glyph (▾)                                        |
| `*cngxSelectOptgroup`      | Group-header rows (use `CngxSelectOptgroupTemplate` directive) |
| `*cngxSelectPlaceholder`   | Trigger placeholder text                                       |
| `*cngxSelectEmpty`         | Panel "no options" body                                        |
| `*cngxSelectLoading`       | First-load indicator body                                      |
| `*cngxSelectRefreshing`    | Subsequent-load overlay                                        |
| `*cngxSelectError`         | First-load error banner                                        |
| `*cngxSelectCommitError`   | Commit-error surface                                           |
| `*cngxSelectRetryButton`   | Retry button across all 3 surfaces                             |
| `*cngxSelectLoadingGlyph`  | Inner glyph of spinner / bar / dots                            |
| `*cngxSelectClearButton`   | Clear-all (✕) button                                           |
| `*cngxSelectOptionLabel`   | Per-row label markup                                           |
| `*cngxSelectTriggerLabel`  | Trigger summary (single-select only)                           |
| `*cngxSelectOptionPending` | Per-row commit-pending glyph                                   |
| `*cngxSelectOptionError`   | Per-row commit-error glyph                                     |

Full list with context shapes: [`ARCHITECTURE.md` § Template slot system](../../../ARCHITECTURE.md#template-slot-system).

## Theming

CSS variables consumed by the trigger skin (set on the host or any ancestor). Every value falls back to a sensible default if unset.

| Variable                         | Default                                     |
| -------------------------------- | ------------------------------------------- |
| `--cngx-select-min-width`        | `16ch`                                      |
| `--cngx-select-trigger-bg`       | `var(--cngx-surface, #fff)`                 |
| `--cngx-select-trigger-border`   | `1px solid var(--cngx-border, #d0d7de)`     |
| `--cngx-select-trigger-radius`   | `var(--cngx-radius, 6px)`                   |
| `--cngx-select-trigger-padding`  | `0.5rem 0.75rem`                            |
| `--cngx-select-trigger-height`   | `2.25rem`                                   |
| `--cngx-select-focus-ring`       | `var(--cngx-focus-ring, 0 0 0 2px #1976d2)` |
| `--cngx-select-disabled-opacity` | `0.55`                                      |
| `--cngx-select-clear-color`      | `currentColor`                              |
| `--cngx-select-caret-color`      | `currentColor`                              |

Family-shared structural variables (panel, skeleton, shimmer, refresh-bar) live in `select-base.css` — see the source for the full list.

## Keyboard

| Key                                   | Behaviour                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| `Space` / `Enter` (trigger)           | Toggle panel open                                                              |
| `Arrow Up` / `Down` (trigger)         | Open + move highlight                                                          |
| `Page Up` / `Page Down` (trigger)     | Open + jump ±10 (clamped, disabled-aware)                                      |
| Printable key (trigger, panel closed) | Native-`<select>`-style typeahead pick — opt-in via `withTypeaheadWhileClosed` |
| `Escape`                              | Close panel                                                                    |

## Configuration

Override defaults app-wide:

```typescript
import { provideCngxSelect, withPanelWidth, withAriaLabels } from '@cngx/forms/select';

bootstrapApplication(App, {
  providers: [
    provideCngxSelect(
      withPanelWidth('trigger'),
      withAriaLabels({ clearButton: 'Clear selection' }),
    ),
  ],
});
```

See [`ARCHITECTURE.md` § Configuration cascade](../../../ARCHITECTURE.md#configuration-cascade) for the full feature catalog.
