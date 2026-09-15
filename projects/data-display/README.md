# @cngx/data-display

Organisms whose job is to display data. Signal-native like the rest of cngx; the treetable is the one surface in the library that composes `@angular/cdk/table`. Never imports `@angular/material`.

## When you reach for it

You need to display structured data - rows, columns, hierarchy, expansion - with selection and async-state behaviour wired in, and you want to theme it through CSS custom properties instead of adopting a Material skin.

## Entry points

| Entry | What it ships |
|-|-|
| `@cngx/data-display/treetable` | `CngxTreetable` - a CDK-table treegrid with expand/collapse, single/multi selection on signal models, template slots, and `[state]`-driven skeleton/empty/error/refresh views. Plus `CngxTreetableRow`, the template-slot directives, `provideTreetable(...features)`, and the pure tree utilities. |

The primary `@cngx/data-display` entry exports only the version constant. There is nothing to import from here in application code - pick a secondary entry.

## Mental model

One component owns the surface: `CngxTreetable` derives flattening, visible-node filtering, and column extraction as memoised computeds from the `tree` input plus the `expandedIds`/`selectedIds` signal models. There is no options bag beyond display concerns and no manual sync - controlled bindings win over internal state via the standard cngx `computed()` pattern.

Sorting and searching stay consumer-side: the entry re-exports the pure tree utilities (`flattenTree`, `filterTree`, `sortTree`, `nodeMatchesSearch`) so you transform the tree before binding it. The table renders what you pass.

## Companion concepts

- **Async state.** Bind `[state]` and the table switches between skeleton, content, refresh, empty, and error views the same way every other cngx surface does.
- **Theming.** The component ships unstyled defaults driven entirely by `--cngx-treetable-*` custom properties - see the entry README for the full token table.

## See also

- Component inputs, outputs, and slot directives in the **API** tab.
- The `@cngx/data-display/treetable` README for Quick Start, configuration features, and accessibility notes.
