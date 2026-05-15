# @cngx/forms/filter-builder

Recursive query-builder (`<cngx-filter-builder>`) for cngx — composable
`FilterGroup` / `FilterExpression` discriminated-union tree, pluggable
value editors, three logic operators (`and` / `or` / `xor`) plus
orthogonal `negated: boolean`, and a `toFilterPredicate` helper that
bridges into `CngxFilter`.

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

The component is a thin state-branch shell; brain lives in
`CngxFilterBuilderPresenter` (host directive). Two-way binding via
`[(value)]` writes through `model<FilterGroup>` mutators — every change
emits a new frozen tree.

## Controlled usage

Drive the tree from a parent signal (no two-way binding):

```typescript
@Component({
  template: `<cngx-filter-builder [fields]="fields()" [value]="tree()" (valueChange)="handleChange($event)" />`,
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

`<cngx-filter-builder>` no longer renders loading / error branches in
the shell. Wrap with `<cngx-async-container [state]>` for state-driven
UI; one container drives every transition (loading skeleton, error
fallback, refreshing overlay, success body):

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

`CngxAsyncContainer` handles every `AsyncStatus` (`idle` / `loading` /
`pending` / `refreshing` / `success` / `error`) with consistent skeleton
/ overlay / error semantics and reactive ARIA, so the builder stays a
pure decorative tree renderer. Producers: `injectAsyncState`,
`fromHttpResource`, `createManualState`, `buildAsyncStateView`. The
same wrap idiom covers refreshing (e.g. while re-fetching the field
catalogue) and error recovery without re-implementing the state machine
inside the builder.

## Custom editors

The library ships native editors for `string` / `number` / `date` /
`boolean`. Add a custom editor by binding `CNGX_FILTER_EDITORS` with a
component class keyed on a new `editorType`:

```typescript
import { CNGX_FILTER_EDITORS, type CngxFilterEditor } from '@cngx/forms/filter-builder';

@Component({
  selector: 'app-country-picker',
  template: `<!-- pick from list of countries -->`,
})
export class CountryPickerEditor { /* ... */ }

bootstrapApplication(AppComponent, {
  providers: [
    {
      provide: CNGX_FILTER_EDITORS,
      useValue: new Map<string, CngxFilterEditor>([
        ['country', CountryPickerEditor],
      ]),
    },
  ],
});
```

Then declare a field with the matching `editorType: 'country'`. The
component renders `<ng-container *ngComponentOutlet="CountryPickerEditor">`
in the expression row. Custom editor components are expected to bridge
their own value via `injectFilterExpressionContext()` or read it through
a slot template.

## CngxFilter bridge

`toFilterPredicate(tree, fields)` turns any `FilterGroup` into an
item-level predicate. Wire it into `CngxFilter` via an `effect` that
reads the tree (signal) and pushes the resulting predicate:

```typescript
import { effect, untracked, viewChild } from '@angular/core';
import { CngxFilter } from '@cngx/common/data';
import { toFilterPredicate } from '@cngx/forms/filter-builder';

@Component({
  template: `
    <div [cngxFilter]="null"></div>
    <cngx-filter-builder [fields]="fields()" [(value)]="tree" />
  `,
  imports: [CngxFilter, CngxFilterBuilder],
})
export class People {
  readonly fields = signal<readonly FilterFieldDef[]>(/* ... */);
  readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  readonly filterRef = viewChild.required(CngxFilter);

  constructor() {
    effect(() => {
      const filter = this.filterRef();
      const tree = this.tree();
      const fields = this.fields();
      // untracked() is required: setPredicate reads CngxFilter's own
      // predicates signal before writing it; without untracked() the
      // effect subscribes to that read and loops on every write.
      untracked(() => filter.setPredicate(toFilterPredicate(tree, fields)));
    });
  }
}
```

## Pure-function variant

When you do not need `CngxFilter`'s named-predicate stack, build the
predicate inside a `computed` and read it directly:

```typescript
readonly predicate = computed(() => toFilterPredicate(this.tree(), this.fields()));

readonly filtered = computed(() => {
  const fn = this.predicate();
  return fn ? this.items().filter(fn) : this.items();
});
```

## Operator semantics

| Operator | Semantic                                                              |
| -------- | --------------------------------------------------------------------- |
| `and`    | Every direct child evaluates to `true`. Empty group → `true`.         |
| `or`     | At least one direct child evaluates to `true`. Empty group → `false`. |
| `xor`    | Exactly one direct child evaluates to `true` (n ≥ 2 required).        |

`negated: boolean` on a group flips the result of the logic combinator
— `negated: true` over `and` denotes the rejected `nand`; over `or`
denotes `nor`.

`xor` is not associative across nested groups; nest a sub-group of the
desired arity to express XOR over more children.

## Configuration

`provideFilterBuilderConfig(...)` (root) or `provideFilterBuilderConfigAt(...)`
(scoped) compose the config from `with*` features:

| Feature                          | Purpose                                                                |
| -------------------------------- | ---------------------------------------------------------------------- |
| `withNegation(boolean)`          | Show the per-group "Negate" toggle (default: `false`).                 |
| `withLogicOptions(readonly[])`   | Constrain logic toggle options (default: `['and', 'or']`).             |
| `withMaxNestingDepth(number)`    | Cap nested-group depth (`Infinity` by default).                        |
| `withDefaultOperators(...)`      | Override per-`editorType` default operator list.                       |
| `withFilterBuilderI18n(partial)` | Override labels, operator names, announcement formatters.              |
| `withTemplates(partial)`         | Provide default slot templates as a fallback below `contentChild`.     |

Resolution priority: per-instance input → `provideFilterBuilderConfigAt`
→ `provideFilterBuilderConfig` → library defaults (English).

## Template slots

Every visible region is overrideable. Each slot directive comes with a
typed context interface:

| Directive                              | Context type                                          |
| -------------------------------------- | ----------------------------------------------------- |
| `cngxFilterBuilderEmpty`               | `{ addFilter, addGroup }`                             |
| `cngxFilterBuilderAddFilterButton`     | `{ add, label, disabled }`                            |
| `cngxFilterBuilderAddGroupButton`      | `{ add, label, disabled }`                            |
| `cngxFilterBuilderRemoveButton`        | `{ remove, label }`                                   |
| `cngxFilterBuilderLogicToggle`         | `{ logic, options, setLogic }`                        |
| `cngxFilterBuilderNegationToggle`      | `{ negated, toggle, label }`                          |
| `cngxFilterBuilderGroupTemplate`       | `{ group, logic, isRoot, setLogic, toggleNegated, addFilter, addGroup, remove }` |
| `cngxFilterBuilderExpressionTemplate`  | `{ expression, fieldDef, availableOperators, value, setField, setOperator, setValue, remove }` |
| `cngxFilterBuilderValueEditor`         | `{ value, fieldDef, setValue, expression }`           |

Three-stage cascade: `contentChild` directive → `CNGX_FILTER_BUILDER_CONFIG.templates.<key>` → null (renders the default).

## ARIA model

| Element                                       | Role / Attributes                                                     |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `<cngx-filter-builder>` (host)                | `[attr.aria-disabled]="disabled"`                                     |
| `.cngx-filter-builder__group` (every group)   | `role="group"`, `aria-label="Group: <logic> (<n> filters)"`           |
| `.cngx-filter-builder__expression` (each)     | `role="group"`, `aria-label="Filter: <field-label> <operator>"`       |
| Decorative glyphs in default buttons          | `aria-hidden="true"` (decorative)                                     |
| Live region (always in DOM)                   | `aria-live="polite"`; mutation announcements via `CngxFilterBuilderAnnouncer` |

Loading / refreshing / error ARIA (`aria-busy`, `role="alert"`,
skeleton placeholders) lives on the consumer's `<cngx-async-container>`
wrap — see [State-driven UI](#state-driven-ui).

Dev-mode guards (`isDevMode()`) warn when `fields()` is empty or when
`value()` references unknown field keys — see
`CngxFilterBuilderPresenter` constructor.

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

`CngxFilterExpressionRow` is the same component the builder mounts internally — exported as a public surface so a single filter row can live outside the recursive tree. Typical use cases: a table-column header that filters one column, a side-panel quick filter, or any place where a full builder tree is overkill.

Pass `[fields]` (a one-element array for the column it filters) and a writable `[(value)]` binding. The row owns its `FilterExpression | null` directly — no presenter, no host token. The Remove button writes `null`; subsequent edits are no-ops until the consumer seeds a fresh expression.

```typescript
import { Component, computed, signal } from '@angular/core';
import {
  CngxFilterExpressionRow,
  createFilterGroup,
  toFilterPredicate,
  type FilterExpression,
  type FilterFieldDef,
} from '@cngx/forms/filter-builder';

const NAME_FIELD: FilterFieldDef = { key: 'name', label: 'Name', editorType: 'string' };
const PEOPLE = [/* ... */];

@Component({
  selector: 'app-people-table',
  template: `
    <table>
      <thead>
        <tr>
          <th>
            Name
            <cngx-filter-expression-row [fields]="[nameField]" [(value)]="nameFilter" />
          </th>
        </tr>
      </thead>
      <tbody>
        @for (p of filtered(); track p.name) {
          <tr><td>{{ p.name }}</td></tr>
        }
      </tbody>
    </table>
  `,
  imports: [CngxFilterExpressionRow],
})
export class PeopleTable {
  readonly nameField = NAME_FIELD;
  readonly nameFilter = signal<FilterExpression | null>(null);

  readonly filtered = computed(() => {
    const f = this.nameFilter();
    if (!f) return PEOPLE;
    const predicate = toFilterPredicate(createFilterGroup('and', [f]), [this.nameField]);
    return predicate ? PEOPLE.filter(predicate) : PEOPLE;
  });
}
```

A live demo wiring two standalone rows into a filtered table lives at `/#/forms/filter-expression-row`.

The row picks **embedded** mode automatically when mounted inside `<cngx-filter-builder>` (the host token is provided by the presenter); switching to standalone mode is silent — drop the row outside the builder and the optional-host code path takes over.
