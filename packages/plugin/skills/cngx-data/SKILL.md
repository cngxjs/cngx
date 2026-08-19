---
name: cngx-data
description: How to wire a sortable, filterable, paginated collection with cngx - compose the orthogonal data directives (CngxSort, CngxFilter, CngxPaginate, injectDataSource) through one computed() chain instead of reaching for a monolithic table. Use when building a table, a list, or any collection the user can sort, filter, or page.
---

# Wiring a data collection with cngx

cngx ships no monolithic table that injects sort, filter, and pagination for you.
It ships those as independent directives, and the consumer wires them together.
That is deliberate: the rows you render are a `computed()` derived from the raw
data and the current sort/filter/page state, not a widget you configure. This
skill is that wiring pattern; the exact inputs live behind the MCP tools.

## The orthogonal directives

`CngxSort`, `CngxFilter`, `CngxPaginate`, and `injectDataSource` are orthogonal -
no component injects them, and none knows about the others. You hold each one's
state and derive the rendered rows from all of them in a single `computed()`
chain:

- the source data (static, or from `injectDataSource`),
- through the active filter predicate,
- through the active sort comparator,
- through the current page slice.

Derive, do not manage (Pillar 1): no `effect()` copies the sorted list into a
second signal, and nothing re-sorts by hand on a filter change. One `computed()`
reads sort, filter, page, and data and returns the rows; change any input and the
rows recompute. If you are synchronising two lists by hand, collapse them into one
`computed()`.

## Route to the recipe

Committed recipes show the working shapes - read the one that matches before
writing the chain yourself:

- `pack/recipes/common-data-async-boundary.md` - a collection whose data arrives
  asynchronously, wired to the async state boundary.
- `pack/recipes/common-data-recycler.md` - a virtualised, recycled list for large
  collections.

## The async boundary is cngx-async's job

When the data loads asynchronously, the loading/error/success branching is not
this skill's concern - it belongs to the async state machine. Hand off to
`cngx-async` for `createAsyncState` / `resolveAsyncView` and the toast/alert/banner
bridges, then wire the sort/filter/page chain on top of the resolved data. Keep
the two concerns apart: the data directives shape the rows, the async layer
communicates the load.

## Never guess

Confirm every `@cngx/*` symbol (`CngxSort`, `CngxFilter`, `CngxPaginate`,
`injectDataSource`, and their inputs) against the MCP tools (`find_component`,
`get_api`, `get_di_tokens`) or the published docs
(`https://cngxjs.github.io/cngx/llms.txt` index, `llms-full.txt` full text) before
wiring. A guessed input is a defect. For composing the surrounding screen, hand off
to `cngx-wire`.
