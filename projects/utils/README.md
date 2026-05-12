# @cngx/utils

The lowest layer of the cngx stack. Framework-agnostic TypeScript — array helpers, tree primitives, version utilities. No Angular runtime dependency.

## When you reach for it

You almost never import from `@cngx/utils` directly in application code. This entry is the substrate the rest of the library is built on, and a handful of helpers leak out into application use:

- You have a value that might be a single item or an array and want the array form.
- You hold a hierarchical data model (categories, file tree, org chart) and want the standard flat-projection primitives used by the cngx tree controllers and tree select.
- You need a parsed `Version` object for displaying or comparing semver strings.

If you reach for "I want to do tree X without rendering it" — that is `@cngx/utils`. If you reach for "I want to render the tree with keyboard nav and selection" — that is `@cngx/common/interactive` (which itself reads `@cngx/utils`).

## Mental model

This entry contains pure functions and pure-data shapes. Anything stateful, signal-aware, or DOM-aware belongs higher in the stack.

The tree primitives are the one piece of "design vocabulary" the rest of the library agrees on: every cngx component that displays hierarchical data — tree select, treetable, hierarchical menus — speaks `CngxTreeNode<T>` and `FlatTreeNode<T>`. Adopting the same shape on the consumer side keeps your data model compatible with every cngx surface that consumes a tree.
