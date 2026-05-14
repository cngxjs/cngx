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

## Async fields via `[cngxFilterBuilderState]`

The presenter implements `CngxStateful` — bind an `AsyncState` from
`@cngx/common/data` to drive the loading / error / empty / content
branches:

```typescript
import { injectAsyncState } from '@cngx/common/data';

@Component({
  template: `
    <cngx-filter-builder
      [fields]="fields()"
      [(value)]="tree"
      [cngxFilterBuilderState]="fieldsState"
    />
  `,
  imports: [CngxFilterBuilder],
})
export class AsyncFilter {
  readonly fieldsState = injectAsyncState(() => this.http.get<FilterFieldDef[]>('/api/fields'));
  readonly fields = computed(() => this.fieldsState.data() ?? []);
  readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
}
```

The component renders the loading branch (`skeletonCount` rows by
default — see config) while the request is in flight, the error branch
on failure, and the content branch on success. The
`aria-busy="true"` attribute is set on the host during loading.

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
| `withSkeletonCount(number)`      | Number of skeleton rows in the loading branch (default: `3`).          |
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
| `cngxFilterBuilderLoading`             | `{ skeletonCount }`                                   |
| `cngxFilterBuilderError`               | `{ error }`                                           |
| `cngxFilterBuilderEmpty`               | `{ addFilter, addGroup }`                             |
| `cngxFilterBuilderAddFilterButton`     | `{ add, label, disabled }`                            |
| `cngxFilterBuilderAddGroupButton`      | `{ add, label, disabled }`                            |
| `cngxFilterBuilderRemoveButton`        | `{ remove, label }`                                   |
| `cngxFilterBuilderLogicToggle`         | `{ logic, options, setLogic }`                        |
| `cngxFilterBuilderNegationToggle`      | `{ negated, toggle, label }`                          |
| `cngxFilterBuilderGroupTemplate`       | `{ group, logic, isRoot, setLogic, toggleNegated, addFilter, addGroup, remove }` |
| `cngxFilterBuilderExpressionTemplate`  | `{ expression, fieldDef, availableOperators, value, setField, setOperator, setValue, remove }` |

Three-stage cascade: `contentChild` directive → `CNGX_FILTER_BUILDER_CONFIG.templates.<key>` → null (renders the default).

## ARIA model

| Element                                       | Role / Attributes                                                     |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `<cngx-filter-builder>` (host)                | `[attr.aria-busy]="loading"`, `[attr.aria-disabled]="disabled"`       |
| `.cngx-filter-builder__group` (every group)   | `role="group"`, `aria-label="Group: <logic> (<n> filters)"`           |
| `.cngx-filter-builder__expression` (each)     | `role="group"`, `aria-label="Filter: <field-label> <operator>"`       |
| `.cngx-filter-builder__error` (default)       | `role="alert"`                                                        |
| `.cngx-filter-builder__loading` (default)     | `role="status"`, `aria-label="<i18n.loading>"`                        |
| Skeleton rows (default loading branch)        | `aria-hidden="true"` (decorative)                                     |
| Decorative glyphs in default buttons          | `aria-hidden="true"` (decorative)                                     |
| Live region (always in DOM)                   | `aria-live="polite"`; mutation announcements via `CngxFilterBuilderAnnouncer` |

Dev-mode guards (`isDevMode()`) warn when `fields()` is empty or when
`value()` references unknown field keys — see
`CngxFilterBuilderPresenter` constructor.

## CSS variables

All values are routed through `var(--cngx-*, fallback)`. Material variants default to `--mat-sys-*`.

| Variable                                            | Default                                                   |
| --------------------------------------------------- | --------------------------------------------------------- |
| `--cngx-filter-builder-padding`                     | `0.5rem`                                                  |
| `--cngx-filter-builder-bg`                          | `transparent`                                             |
| `--cngx-filter-builder-fg`                          | `inherit`                                                 |
| `--cngx-filter-builder-gap`                         | `0.5rem`                                                  |
| `--cngx-filter-builder-group-padding`               | `0.5rem`                                                  |
| `--cngx-filter-builder-group-border`                | `1px solid var(--mat-sys-outline-variant, #ddd)`          |
| `--cngx-filter-builder-radius`                      | `0.375rem`                                                |
| `--cngx-filter-builder-negated-border-style`        | `dashed`                                                  |
| `--cngx-filter-builder-empty-padding`               | `0.75rem`                                                 |
| `--cngx-filter-builder-empty-fg`                    | `var(--mat-sys-on-surface-variant, #666)`                 |
| `--cngx-filter-builder-skeleton-row-height`         | `2rem`                                                    |
| `--cngx-filter-builder-skeleton-bg`                 | `var(--mat-sys-surface-variant, #eee)`                    |
| `--cngx-filter-builder-skeleton-opacity`            | `0.5`                                                     |
