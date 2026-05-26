# @cngx/data-display

Organisms whose job is to display tabular and hierarchical data. CDK is the foundation; Material is one rendering strategy among several.

## When you reach for it

You need to display structured data - rows, columns, hierarchy, expansion - with built-in sorting, selection, virtualisation, and async state behaviour, and you want both a Material-themed surface and a Material-free option available.

## Entry points

| Entry | What it ships |
|-|-|
| `@cngx/data-display/treetable` | CDK-only treetable - lightweight, custom-theme friendly. |

The primary `@cngx/data-display` entry exports only the version constant. There is nothing to import from here in application code - pick a secondary entry.

## Mental model

A single presenter directive owns all state and derivations; the thin skin component applies the presenter via `hostDirectives` and renders the CDK template. The brain-skin split is the seam: a future Material twin (or any other renderer) would compose the same presenter from its own host directive without forking the state machine.

## Companion concepts

- **Async state.** Bind `[state]` and the table switches between skeleton, content, refresh, empty, and error views the same way every other cngx surface does.
- **Atomic decompose.** Both treetable variants are decompose-eligible - the schematic ejects the skin (template + structural CSS) into your project while the presenter stays linked from the library, so future cngx updates land for free.

## See also

- Component inputs, outputs, and slot directives in the **API** tab.
- Architectural deep dive: the "Instrumentation Pattern" chapter in the docs sidebar.
