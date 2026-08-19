---
name: cngx-a11y
description: How to keep a cngx screen accessible - the accessibility guarantees the contract already gives you (ARIA in the reactive graph) and what a consumer must preserve rather than silence when composing or overriding. Use when making a cngx screen accessible, running an a11y review, or overriding a template slot on a cngx component.
---

# Keeping a cngx screen accessible

Accessibility in cngx is not a pass you run at the end - it is built into the
reactive graph, and your job as a consumer is mostly to not break it. cngx derives
its ARIA (`aria-busy`, `aria-disabled`, `aria-invalid`, `aria-describedby`) as
`computed()` outputs that track the same state the UI shows, so a state change is
communicated to assistive technology automatically (Pillar 2). This skill is what
to preserve, what to wire, and how to verify. The exact aria surface per component
lives behind the MCP tools; do not re-list it from memory.

## Preserve, do not silence

The failure mode is a consumer flattening the communication cngx already does:

- **Keep `aria-describedby` targets in the DOM.** cngx gates the *reference* on
  whether the description applies, but the target node stays mounted. Do not delete
  it or hide it with `aria-hidden` - a directly-referenced hidden node is still
  traversed for the accessible name. Let cngx emit or drop the id.
- **Let a disabled control say why.** A disabled cngx control communicates its
  reason through `aria-describedby`; do not swap it for a bare `disabled` attribute
  that tells the user nothing.
- **Restore focus after an overlay closes.** cngx stores the trigger at open and
  returns focus to it on close. If you override the open/close wiring, keep that
  restore - focus that lands on `<body>` is a lost user.
- **Keep live regions live.** The `aria-live` region stays in the DOM with reactive
  content. Do not conditionally remove it; toggling the region out defeats the
  announcement.

## The a11y wiring atoms

When you build the interactive part yourself rather than composing a finished cngx
component, reach for the `@cngx/common/a11y` atoms instead of hand-rolling ARIA:

- `CngxFocusTrap` - trap focus within an overlay or dialog surface.
- `CngxRovingTabindex` - one tab stop across a composite widget (toolbar, listbox,
  group).
- `CngxActiveDescendant` - virtual focus for a listbox or combobox where the input
  keeps DOM focus.

Confirm each atom's inputs and host bindings with the MCP tools before wiring; this
skill names the atom, not its API.

## When you override a template slot

Overriding a slot replaces cngx's markup with yours - and its ARIA with yours. When
you do, carry the same wiring the default slot had: the role, the state attributes,
the id the component references. Query `get_slots` for what the slot exposes and
`get_api` for the aria the component drives, then reproduce it. A slot override that
drops the role or the described-by id is an accessibility regression the component
cannot catch for you.

## How to verify

- Every control has a real, programmatic label, not a placeholder.
- Landmarks are named and the page has one reachable heading outline.
- The whole flow is operable from the keyboard alone, and focus is visible at every
  step.
- Screen-reader output changes when state changes (loading, error, selection).

For the composition itself, hand off to `cngx-wire`. Never guess an aria attribute
or a slot selector - confirm it against the MCP tools or the published docs
(`https://cngxjs.github.io/cngx/llms.txt` index, `llms-full.txt` full text).
