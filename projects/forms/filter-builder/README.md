# @cngx/forms/filter-builder

Recursive query-builder (`<cngx-filter-builder>`) for cngx - composable `FilterGroup` / `FilterExpression` discriminated-union tree, pluggable value editors, three logic operators (`and` / `or` / `xor`) plus orthogonal `negated: boolean`, and a `predicate` signal on the
presenter that bridges into `CngxFilter` or any consumer-side filtered list.

## When to reach for which surface

| Surface | Use when |
|-|-|
| `<cngx-filter-builder>` | The user assembles a multi-expression query with `and` / `or` / `xor` nesting - saved-filter presets, advanced search panels, report builders. Output is a serialisable `FilterGroup`. |
| `<cngx-filter-row>` | One ad-hoc expression. Top-of-table quick filter, side-panel filter, anywhere a full builder tree is overkill but the user still picks the field. |
| `toFilterPredicate(tree, fields)` | Library-free conversion of any `FilterGroup` into an item predicate. Use when you hold the tree in your own signal (preset preview, server-trip serialisation) and never mount the builder. |
| `presenter.predicate()` | The same predicate when the builder _is_ mounted. Already null-on-empty + NG0950-defensive; prefer over re-deriving via `toFilterPredicate`. |

## Basic usage

```typescript
import { Component, signal } from '@angular/core';
import {
  CngxFilterBuilder,
  createEmptyFilterRoot,
  type FilterFieldDef,
  type FilterGroup,
} from '@cngx/forms/filter-builder';

@Component({
  selector: 'app-people-filter',
  template: `<cngx-filter-builder [fields]="fields()" [(value)]="tree" />`,
  imports: [CngxFilterBuilder],
})
export class PeopleFilter {
  readonly fields = signal<readonly FilterFieldDef[]>([
    { key: 'name', label: 'Name', editorType: 'string' },
    { key: 'age', label: 'Age', editorType: 'number' },
    { key: 'active', label: 'Active', editorType: 'boolean' },
    { key: 'birthday', label: 'Birthday', editorType: 'date' },
  ]);
  readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
}
```

Thin shell; brain lives in `CngxFilterBuilderPresenter` (host directive). `[(value)]` writes through `model<FilterGroup>` mutators -
every change emits a new frozen tree.

## Controlled usage

Drive the tree from a parent signal (no two-way binding):

```typescript
@Component({
  template: `<cngx-filter-builder
    [fields]="fields()"
    [value]="tree()"
    (valueChange)="handleChange($event)"
  />`,
  imports: [CngxFilterBuilder],
})
export class ControlledFilter {
  readonly fields = signal<readonly FilterFieldDef[]>(/* ... */);
  readonly tree = signal<FilterGroup>(createEmptyFilterRoot());

  handleChange(next: FilterGroup): void {
    // log, persist, transform; then mirror back if you want
    this.tree.set(next);
  }
}
```

## State-driven UI

`<cngx-filter-builder>` no longer renders loading / error branches in the shell. Wrap with `<cngx-async-container [state]>` for state-driven UI; one container drives every transition (loading skeleton, error fallback, refreshing overlay, success body):

```typescript
import { injectAsyncState } from '@cngx/common/data';
import { CngxAsyncContainer } from '@cngx/ui/feedback';

@Component({
  template: `
    <cngx-async-container [state]="fieldsState">
      <cngx-filter-builder [fields]="fields()" [(value)]="tree" />
    </cngx-async-container>
  `,
  imports: [CngxFilterBuilder, CngxAsyncContainer],
})
export class AsyncFilter {
  readonly fieldsState = injectAsyncState(() => this.http.get<FilterFieldDef[]>('/api/fields'));
  readonly fields = computed(() => this.fieldsState.data() ?? []);
  readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
}
```

`CngxAsyncContainer` handles every `AsyncStatus` (`idle` / `loading` / `pending` / `refreshing` / `success` / `error`) with consistent skeleton / overlay / error semantics and reactive ARIA, so the builder stays a pure decorative tree renderer. 
Producers: 
* `injectAsyncState`,
* `fromHttpResource`, 
* `createManualState`, 
* `buildAsyncStateView`. 

The same wrap idiom covers refreshing (e.g. while re-fetching the field catalogue) and error recovery without re-implementing the state machine inside the builder.

## Custom editors

The library ships native editors for `string` / `number` / `date` / `boolean`. 
Custom editor components implement `CngxFilterEditorComponent<TValue>` (FormValueControl-shaped, `value = model<TValue>()` required, optional `fieldDef` / `expression` / `disabled` inputs) and Register against `CNGX_FILTER_EDITORS`:

```typescript
import { Component, model } from '@angular/core';
import {
  CNGX_FILTER_EDITORS,
  type CngxFilterEditor,
  type CngxFilterEditorComponent,
} from '@cngx/forms/filter-builder';

@Component({
  selector: 'app-country-picker',
  template: `
    <select [value]="value() ?? ''" (change)="value.set($any($event.target).value)">
      <option value="">-</option>
      <option *ngFor="let c of countries" [value]="c">{{ c }}</option>
    </select>
  `,
})
export class CountryPickerEditor implements CngxFilterEditorComponent<string> {
  readonly value = model<string | null>(null);
  protected readonly countries = ['AT', 'DE', 'CH'];
}

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: CNGX_FILTER_EDITORS,
      useValue: new Map<string, CngxFilterEditor>([['country', CountryPickerEditor]]),
    },
  ],
});
```

Declare a field with `editorType: 'country'`. The row mounts the component via `*ngComponentOutlet` and reads / writes through `value`.

For one-off overrides without a registry entry, use the `cngxFilterBuilderValueEditor` template slot - see [Template slots](#template-slots).

## CngxFilter bridge

The presenter exposes `predicate: Signal<((item: T) => boolean) | null>` as a pure derivation of `tree()` and `fields()`. Read it directly - no manual `toFilterPredicate()` call, no per-mutation bridge wiring:

```typescript
import { effect, untracked, viewChild } from '@angular/core';
import { CngxFilter } from '@cngx/common/data';
import { CngxFilterBuilder, CngxFilterBuilderPresenter } from '@cngx/forms/filter-builder';

@Component({
  template: `
    <cngx-filter-builder [fields]="fields()" [(value)]="tree" />
    <table [cngxFilter]="null">
      ...
    </table>
  `,
  imports: [CngxFilter, CngxFilterBuilder],
})
export class People {
  readonly fields = signal<readonly FilterFieldDef[]>(/* ... */);
  readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  readonly filterRef = viewChild.required(CngxFilter<Person>);
  readonly presenterRef = viewChild.required(CngxFilterBuilder, {
    read: CngxFilterBuilderPresenter,
  });

  constructor() {
    effect(() => {
      const filter = this.filterRef();
      const fn = this.presenterRef().predicate();
      // untracked: setPredicate reads CngxFilter's own predicates signal
      // before writing it; without untracked the effect loops.
      untracked(() => filter.setPredicate(fn));
    });
  }
}
```

`predicate()` returns `null` when the tree is empty (root clear), so `setPredicate(null)` cascades to `activeCount = 0` instead of latching a vacuous-true predicate that still counts as active.

Mount `[cngxFilter]` directly on the data element (the `<table>`, `<ul>`, etc.) - no separate host `<div>` needed.

## Pure-function variant

When you do not mount the builder (you hold the tree in your own signal) or do not need `CngxFilter`'s named-predicate stack, fall back to `toFilterPredicate(tree, fields)`:

```typescript
readonly predicate = computed(() => toFilterPredicate(this.tree(), this.fields()));

readonly filtered = computed(() => {
  const fn = this.predicate();
  return fn ? this.items().filter(fn) : this.items();
});
```

When the builder _is_ mounted, prefer `presenter.predicate()` - it already encodes the empty-tree → `null` semantic and shields against the early-read NG0950 race when an effect resolves the presenter
before the host-directive `fields` input has propagated.

## Form-field bridge

Wrap `<cngx-filter-builder>` in `<cngx-form-field>` and apply the opt-in `cngxFilterBuilderFormFieldControl` directive. 
The presenter then implements the `CngxFormFieldControl` contract: `disabled` mirrors the
field, `focused` toggles on host `(focusin)`/`(focusout)`, `errorState` is `touched && incompleteCount > 0`, and `presenter.focus()` lands on the first incomplete expression's first focusable element.

```typescript
import { CngxFormField } from '@cngx/forms/field';
import { CngxFilterBuilder, CngxFilterBuilderFormFieldControl } from '@cngx/forms/filter-builder';

@Component({
  template: `
    <cngx-form-field [field]="filterField">
      <cngx-filter-builder cngxFilterBuilderFormFieldControl [fields]="fields()" [(value)]="tree" />
    </cngx-form-field>
  `,
  imports: [CngxFormField, CngxFilterBuilder, CngxFilterBuilderFormFieldControl],
})
export class FormFieldDriven {
  /* filterField: Field<FilterGroup> */
}
```

Listeners stay on the directive, not on the presenter - consumers without the form-field bridge pay no event-listener cost. 
For Reactive Forms, wrap the `FormControl` with `adaptFormControl()` from `@cngx/forms/field` and pass the returned accessor as `[field]`.

## Operator semantics

| Operator | Semantic |
|-|-|
| `and` | Every direct child evaluates to `true`. Empty group → `true`. |
| `or` | At least one direct child evaluates to `true`. Empty group → `false`. |
| `xor` | Exactly one direct child evaluates to `true` (n ≥ 2 required). |

`negated: boolean` on a group flips the result of the logic combinator - `negated: true` over `and` denotes the rejected `nand`; over `or` denotes `nor`.

`xor` is not associative across nested groups; nest a sub-group of the desired arity to express XOR over more children.

## Configuration

`provideFilterBuilderConfig(...)` (root) or `provideFilterBuilderConfigAt(...)` (scoped) compose the config from `with*` features:

| Feature | Purpose |
|-|-|
| `withNegation(boolean)` | Show the per-group "Negate" toggle (default: `false`). |
| `withLogicOptions(readonly[])` | Constrain logic toggle options (default: `['and', 'or']`). |
| `withMaxNestingDepth(number)` | Cap nested-group depth (`Infinity` by default). |
| `withDefaultOperators(...)` | Override per-`editorType` default operator list. |
| `withFilterBuilderI18n(partial)` | Override labels, operator names, announcement formatters. |
| `withTemplates(partial)` | Provide default slot templates as a fallback below `contentChild`. |

Resolution priority: per-instance input → `provideFilterBuilderConfigAt` → `provideFilterBuilderConfig` → library defaults (English).

## Template slots

Every visible region is overrideable. Each slot directive comes with a typed context interface:

| Directive | Context type |
|-|-|
| `cngxFilterBuilderEmpty` | `{ addFilter, addGroup }` |
| `cngxFilterBuilderAddFilterButton` | `{ add, label, disabled }` |
| `cngxFilterBuilderAddGroupButton` | `{ add, label, disabled }` |
| `cngxFilterBuilderRemoveButton` | `{ remove, label }` |
| `cngxFilterBuilderLogicToggle` | `{ logic, options, setLogic }` |
| `cngxFilterBuilderNegationToggle` | `{ negated, toggle, label }` |
| `cngxFilterBuilderGroupTemplate` | `{ group, logic, isRoot, setLogic, toggleNegated, addFilter, addGroup, remove }` |
| `cngxFilterBuilderExpressionTemplate` | `{ expression, fieldDef, availableOperators, value, setField, setOperator, setValue, remove }` |
| `cngxFilterBuilderValueEditor` | `{ value, fieldDef, setValue, expression }` |

Three-stage cascade: `contentChild` directive → `CNGX_FILTER_BUILDER_CONFIG.templates.<key>` → null (renders the default).

## ARIA model

| Element | Role / Attributes |
|-|-|
| `<cngx-filter-builder>` (host) | `[attr.aria-disabled]="disabled"` |
| `.cngx-filter-builder__group` (every group) | `role="group"`, `aria-label="Group: <logic> (<n> filters)"` |
| `.cngx-filter-builder__expression` (each) | `role="group"`, `aria-label="Filter: <field-label> <operator>"` |
| Decorative glyphs in default buttons | `aria-hidden="true"` (decorative) |
| Live region (always in DOM) | `aria-live="polite"`; mutation announcements via `CngxFilterBuilderAnnouncer` |

Loading / refreshing / error ARIA (`aria-busy`, `role="alert"`, skeleton placeholders) lives on the consumer's `<cngx-async-container>` wrap - see [State-driven UI](#state-driven-ui).

Dev-mode guards (`isDevMode()`) warn when `fields()` is empty or when `value()` references unknown field keys - see `CngxFilterBuilderPresenter` constructor.

## CSS variables

All values are routed through `var(--cngx-*, fallback)`. Material variants default to `--mat-sys-*`.

| Variable | Default |
|-|-|
| `--cngx-filter-builder-padding` | `0.5rem` |
| `--cngx-filter-builder-bg` | `transparent` |
| `--cngx-filter-builder-fg` | `inherit` |
| `--cngx-filter-builder-gap` | `0.5rem` |
| `--cngx-filter-builder-group-padding` | `0.5rem` |
| `--cngx-filter-builder-group-border` | `1px solid var(--mat-sys-outline-variant, #ddd)` |
| `--cngx-filter-builder-radius` | `0.375rem` |
| `--cngx-filter-builder-negated-border-style` | `dashed` |
| `--cngx-filter-builder-indent` | `1.25rem` |
| `--cngx-filter-builder-rail` | `2px solid var(--mat-sys-outline-variant, #ddd)` |
| `--cngx-filter-builder-empty-padding` | `0.75rem` |
| `--cngx-filter-builder-empty-fg` | `var(--mat-sys-on-surface-variant, #666)` |
| `--cngx-filter-builder-error-fg` | `var(--mat-sys-error, #b3261e)` (remove-action fallback) |

Each nested group also exposes a depth host style, `--cngx-filter-builder-depth`, set to the group's path length. Consumers can read it from CSS (e.g. `[style*="--cngx-filter-builder-depth: 2"]`) to drive depth-aware decoration without re-implementing the path math.

## Standalone filter rows

`CngxFilterRow` is a single-row surface for ad-hoc filter contexts: a top-of-table quick filter, a side-panel filter, or any place where a full builder tree is overkill but the user still needs to pick the field. Owns one `FilterExpression | null` via `[(value)]` directly - no
presenter, no host token.

Pass `[fields]` and a writable `[(value)]` binding. With more than one field and an empty value the row renders only the field-picker; with a single field it auto-seeds and skips the picker (one Option = no choice). The Remove button writes `null`.

```typescript
import { Component, computed, signal } from '@angular/core';
import {
  CngxFilterRow,
  createFilterGroup,
  toFilterPredicate,
  type FilterExpression,
  type FilterFieldDef,
} from '@cngx/forms/filter-builder';

const FIELDS: readonly FilterFieldDef[] = [
  { key: 'name', label: 'Name', editorType: 'string' },
  { key: 'role', label: 'Role', editorType: 'string' },
  { key: 'age', label: 'Age', editorType: 'number' },
];
const PEOPLE = [
  /* ... */
];

@Component({
  selector: 'app-people-list',
  template: `
    <cngx-filter-row [fields]="fields" [(value)]="filter" />
    <ul>
      @for (p of filtered(); track p.name) {
        <li>{{ p.name }} - {{ p.role }}</li>
      }
    </ul>
  `,
  imports: [CngxFilterRow],
})
export class PeopleList {
  readonly fields = FIELDS;
  readonly filter = signal<FilterExpression | null>(null);

  readonly filtered = computed(() => {
    const f = this.filter();
    if (!f) return PEOPLE;
    const predicate = toFilterPredicate(createFilterGroup('and', [f]), FIELDS);
    return predicate ? PEOPLE.filter(predicate) : PEOPLE;
  });
}
```
