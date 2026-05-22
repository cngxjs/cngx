# @cngx/data-display

Organisms whose job is to display tabular and hierarchical data. CDK is the foundation; Material is one rendering strategy among several.

## When you reach for it

You need to display structured data - rows, columns, hierarchy, expansion - with built-in sorting, selection, virtualisation, and async state behaviour, and you want both a Material-themed surface and a Material-free option available.

## Entry points

| Entry                              | What it ships                                                  |
| ---------------------------------- | -------------------------------------------------------------- |
| `@cngx/data-display/treetable`     | CDK-only treetable - lightweight, custom-theme friendly.       |
| `@cngx/data-display/mat-treetable` | Material-themed twin. Same brain, Material `<mat-table>` skin. |

The primary `@cngx/data-display` entry exports only the version constant. There is nothing to import from here in application code - pick a secondary entry.

## Mental model

This is the canonical home of the **dual-rendering pattern** in cngx. A single presenter directive owns all state and derivations; two thin skin components apply the presenter via `hostDirectives` and render either the CDK or the Material template. From the consumer's side the two look identical - same inputs, same outputs, same behaviour. The choice is the import path and the bundle cost.

This pattern exists for one reason: large feature components have long lifetimes, and consumers should not have to fork the library to swap one toolkit for another. The brain stays linked, the skin is replaceable.

## Companion concepts

- **Async state.** Bind `[state]` and the table switches between skeleton, content, refresh, empty, and error views the same way every other cngx surface does.
- **Atomic decompose.** Both treetable variants are decompose-eligible - the schematic ejects the skin (template + structural CSS) into your project while the presenter stays linked from the library, so future cngx updates land for free.

## See also

- Component inputs, outputs, and slot directives in the **API** tab.
- Architectural deep dive: the "Instrumentation Pattern" chapter in the docs sidebar.
