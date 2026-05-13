# @cngx/forms/filter-builder

Recursive query-builder (`<cngx-filter-builder>`) for cngx — composable
`FilterGroup` / `FilterExpression` discriminated-union tree, pluggable
value editors, three logic operators (`and` / `or` / `xor`) plus
orthogonal `negated: boolean`, and a `toFilterPredicate` helper that
bridges into `CngxFilter`.

Public surface is populated phase-by-phase; see
[`.internal/architektur/plans/filter-builder-plan.md`](../../../.internal/architektur/plans/filter-builder-plan.md)
for the current state.
