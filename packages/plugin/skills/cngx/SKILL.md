---
name: cngx
description: How to build with the cngx Angular component library - its three design principles, plus the pack of async-state wiring recipes and theming tokens this plugin ships. Use when writing or reviewing Angular code that imports any @cngx/* package.
---

# Building with cngx

cngx is a signal-native Angular component library. When you write or review code
that uses any `@cngx/*` package, hold to its three principles and reach for the
grounding this plugin ships before you invent an API.

## The three principles

**1. Derive state, do not manage it.** Every value that depends on another is a
`computed()` from a single source of truth. No manual synchronisation, no
`BehaviorSubject` mirroring another signal, no effect that copies one signal into
another. If you find yourself writing an `effect()` to keep two pieces of state
in step, the second one should have been a `computed()`.

**2. Communication is architecture, not an afterthought.** Every state change is
communicated - visually and to assistive technology - as part of the reactive
graph, not bolted on later. `aria-busy`, `aria-disabled`, `aria-invalid`,
`aria-describedby` are `computed()` outputs that track the same state the UI
shows. A disabled control says *why* it is disabled. A loading region announces
itself. Silent state change is a defect.

**3. Compose, do not configure.** Prefer small, focused directives wired together
over one component with a large options object. Reach for the composition surface
- template slots, `with*` feature functions, `provide*` config - before adding
another boolean input. No God-components, no inheritance.

## The async state machine

The hardest and most important surface in cngx is the async state machine:
`AsyncStatus` moves through `idle -> loading -> pending -> refreshing -> success
-> error`, and the UI plus the ARIA graph derive from it. Prefer
`createAsyncState` / `injectAsyncState` and let `resolveAsyncView` /
`CngxAsyncContainer` project the branch. Bridge status transitions to feedback
with `CngxToastOn` / `CngxAlertOn` / `CngxBannerOn`, and wrap the service call
inside the bridge effect in `untracked()` to avoid a reactive loop. Most recipes
in this pack demonstrate exactly this wiring.

## Specialized skills

For the daily work, reach for the focused skill instead of this index:

- **`cngx-wire`** - build a screen or feature: discover the component, confirm
  its API, and compose it rather than configure it.
- **`cngx-async`** - wire loading/error/success: the async state machine,
  projecting a branch, and bridging transitions to toasts/alerts/banners.
- **`cngx-forms`** - wire a form: the Signal-Forms-first field pattern, the
  select-family decision tree, the Reactive-Forms adapter, and error surfaces.
- **`cngx-from-material`** - migrate an Angular Material screen: the `mat-*` to
  cngx symbol mapping and the idiom shifts the move requires.
- **`cngx-doctor`** - act on a doctor finding: read the machine finding contract
  and apply the fix it names.
- **`cngx-theme`** - theme a consumer app: import the theme bundle so directive
  styling renders, then set brand tokens via the `--cngx-*` custom properties.
- **`cngx-data`** - wire a sortable/filterable/paginated collection: compose the
  orthogonal data directives through one `computed()` chain.
- **`cngx-a11y`** - keep a cngx screen accessible: preserve the ARIA cngx derives
  in the reactive graph, and wire the `@cngx/common/a11y` atoms.

## What this plugin ships, and when to use it

- **`pack/recipes/*.md`** - async-state wiring recipes distilled from the cngx
  example gallery. Each names the symbols it composes and shows the artifact
  template. Read the recipe whose symbols match what you are building before
  writing the composition yourself.
- **`pack/theming-tokens.md`** - the generated `--cngx-*` custom-property
  reference: every token, its default, and what it controls. Consumers theme by
  setting these in their own stylesheet; never hard-code a colour or size a
  component already exposes as a token.
- **The cngx MCP tools** - query these for the exact current API shape (inputs,
  outputs, signals, slots, DI tokens) of any `@cngx/*` symbol before you wire it.
  The recipes teach *how*; the MCP answers *what*.
- **The published docs** - `https://cngxjs.github.io/cngx/llms.txt` (index) and
  `https://cngxjs.github.io/cngx/llms-full.txt` (full text) when you need more
  than a single symbol.

Ground every `@cngx/*` symbol against the MCP tools or the docs above before you
use it. Do not guess an input name or a slot selector.
