# @cngx/forms/filter-builder

Recursive query-builder (`<cngx-filter-builder>`) for cngx — composable
`FilterGroup` / `FilterExpression` discriminated-union tree, pluggable
value editors, three logic operators (`and` / `or` / `xor`) plus
orthogonal `negated: boolean`, and a `toFilterPredicate` helper that
bridges into `CngxFilter`.

The public surface is populated phase-by-phase; see
[`.internal/architektur/plans/filter-builder-plan.md`](../../../.internal/architektur/plans/filter-builder-plan.md)
for the current state.

## CngxFilter bridge

`toFilterPredicate(tree, fields)` turns any `FilterGroup` into an
item-level predicate. The cleanest wiring runs an `effect` that reads
the current tree (signal) and the field set (signal) and pushes the
resulting predicate into `CngxFilter.setPredicate`. The effect is owned
by the consumer's injection context, so it tears down with the
component:

```typescript
import { Component, effect, signal, untracked, viewChild } from '@angular/core';
import { CngxFilter } from '@cngx/common/data';
import {
  CngxFilterBuilderPresenter,
  createEmptyFilterRoot,
  toFilterPredicate,
  type FilterFieldDef,
  type FilterGroup,
} from '@cngx/forms/filter-builder';

@Component({
  selector: 'app-people',
  template: `
    <div [cngxFilter]="null"></div>
    <ng-container
      cngxFilterBuilderPresenter
      [fields]="fields()"
      [(value)]="tree"
    ></ng-container>
  `,
  imports: [CngxFilter, CngxFilterBuilderPresenter],
})
export class People {
  readonly fields = signal<readonly FilterFieldDef[]>([
    { key: 'name', label: 'Name', editorType: 'string' },
    { key: 'age', label: 'Age', editorType: 'number' },
  ]);
  readonly tree = signal<FilterGroup>(createEmptyFilterRoot());
  readonly filterRef = viewChild.required(CngxFilter);

  constructor() {
    effect(() => {
      const filter = this.filterRef();
      const tree = this.tree();
      const fields = this.fields();
      // setPredicate reads CngxFilter's own predicatesState signal before
      // writing it; without untracked() the effect subscribes to that read
      // and loops on every write.
      untracked(() => filter.setPredicate(toFilterPredicate(tree, fields)));
    });
  }
}
```

`setPredicate` writes through `CngxFilter`'s internal signal; consumers
of the filter (e.g. a `computed` that filters a list) re-evaluate
automatically.

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

| Operator | Semantic                                                            |
| -------- | ------------------------------------------------------------------- |
| `and`    | Every direct child evaluates to `true`. Empty group → `true`.       |
| `or`     | At least one direct child evaluates to `true`. Empty group → `false`. |
| `xor`    | Exactly one direct child evaluates to `true` (n >= 2 required).     |

`negated: boolean` on a group flips the result of the logic combinator
above — `negated: true` over `and` denotes the rejected `nand`; over
`or` denotes `nor`.

`xor` is not associative across nested groups; nest a sub-group of the
desired arity to express XOR over more children.
