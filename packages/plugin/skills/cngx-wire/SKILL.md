---
name: cngx-wire
description: How to build a screen or feature with cngx - discover the right component, confirm its exact API, and compose it instead of configuring it. Use when a task says "build X with cngx", "add a Y screen", "wire up a Z", or when you are about to reach for a raw HTML element or a hand-rolled widget in an app that imports any @cngx/* package.
---

# Wiring a feature with cngx

When you build a screen or a feature in an app that uses cngx, do not invent a
component and do not guess an API. cngx is a composition library: the piece you
need almost always exists, and it is assembled from small directives rather than
configured through one large options object. This skill is the procedure. It
names no input and no slot on purpose - those drift between releases, so you read
them live from the MCP tools, never from this file.

## The procedure

**1. Discover the component.** Start from `find_component` with what the feature
needs in plain words (a filterable single choice, a dismissable banner, a
paginated list). It returns the matching `@cngx/*` symbols and the package each
lives in. Reach for the returned symbol before building anything by hand.

**2. Confirm the exact API before you wire it.** Query `get_api` for the symbol
to see its real inputs, outputs, and two-way signals; `get_slots` for the
template slots it exposes; `get_di_tokens` for the factory and config tokens it
accepts. Do this every time. An input name or a slot selector you remember from a
previous release may have moved. The MCP answers *what*; this skill only teaches
*how*.

**3. Compose, do not configure.** This is the load-bearing rule. When a component
does not do quite what you need, reach for the composition surface in this order
before you consider a flag:

- a **template slot** to replace a piece of the rendered output with your own
  markup (`get_slots` lists what each component exposes),
- a **`with*` feature function** passed to the component's provider to switch on
  an optional capability,
- a **`provide*` config** at the right injector level to set defaults for a
  subtree.

Only if none of those fit does another boolean input belong on the table, and
usually it does not: if you are tempted to add one, you probably want a
*different, more specific* component from `find_component`. cngx ships focused
variants instead of one component wearing every flag.

**4. Route to the recipe.** For the common wiring shapes, this plugin ships a
committed recipe that names the symbols it composes and shows the artifact
template. Read the recipe whose symbols match what you are building before you
write the composition yourself. Examples:

- `pack/recipes/ui-command-palette.md` - a composed search-and-act overlay.
- `pack/recipes/ui-data-grid-accordion.md` - a grid whose rows expand.
- `pack/recipes/ui-collection-incremental-list.md` - a list that grows on scroll.
- `pack/recipes/forms-select-single-select.md` - a filterable single choice.

`find_component` and `get_story_example` will point you at the recipe or story
that demonstrates a given symbol; the full set lives under `pack/recipes/`.

## When there is no recipe

Not every symbol has a recipe. When one does not, `get_api` plus
`get_story_example` are the source of record - the story shows a working
composition and the API tool confirms the shape. For anything wider than a single
symbol, the published docs carry the full picture:
`https://cngxjs.github.io/cngx/llms.txt` (index) and
`https://cngxjs.github.io/cngx/llms-full.txt` (full text).

## Never guess

Ground every `@cngx/*` symbol against the MCP tools or the published docs before
you use it. If you cannot confirm an input name or a slot selector from a live
source, stop and query it - a guessed API is a defect, not a shortcut.
