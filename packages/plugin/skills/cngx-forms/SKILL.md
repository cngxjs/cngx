---
name: cngx-forms
description: How to wire a form with cngx - the Signal-Forms-first field pattern, the select-family decision tree that picks the right composite by need, the Reactive-Forms adapter, and the error surfaces. Use when a task involves a form, a form field, a dropdown, a picker, a multi-select, an autocomplete, validation, or an error message in an app that imports any @cngx/* package.
---

# Wiring a form with cngx

cngx does forms Signal-Forms-first, and it does not ship one dropdown with a pile
of flags. It ships a field wrapper and a family of focused select composites, and
your job is to pick the right one for the need rather than configure a universal
one. This skill is the procedure and the decision tree; the concrete inputs,
slots, and tokens live behind the MCP tools because they drift.

## The field wrapper

Wrap a control in `<cngx-form-field [field]="f.x">`, where `f.x` is your Angular
Signal Forms `Field<T>` passed **directly** - there is no adapter and no
`ControlValueAccessor`. The field wrapper drives the label, the hint, and the
error region, and pushes `aria-invalid` / `aria-required` / `aria-describedby`
back onto the control as part of the reactive graph (that is Pillar 2, not an
add-on). Confirm the wrapper's exact inputs with `get_api` before wiring.

If your codebase is still on Reactive Forms, adapt the control once with
`adaptFormControl(control, name, destroyRef)` and pass the result to `[field]`.
That is the only bridge; the field wrapper itself knows nothing about Reactive
Forms. Confirm the signature with `get_api`.

## The select-family decision tree

Do not reach for a single component and a `[multiple]` or `[searchable]` flag.
Pick by what the user needs; the mode is in the component name:

- single value, closes on select, behaves like a native `<select>` -> **CngxSelect**
- several values held as a chip strip, stays open -> **CngxMultiSelect**
- filter a list by typing, tag-input style -> **CngxCombobox**
- async autocomplete resolving to one scalar value -> **CngxTypeahead**
- choose from a hierarchy or tree -> **CngxTreeSelect**
- several values the user can reorder -> **CngxReorderableMultiSelect**
- one value that fires an action on commit -> **CngxActionSelect**
- several values that fire an action on commit -> **CngxActionMultiSelect**
- declarative composition from projected `<cngx-option>` / `<cngx-optgroup>` -> **CngxSelectShell**

If you are tempted to add a flag to one of these to make it behave like another,
you have picked the wrong branch. That is Pillar 3: a focused composite per mode,
never one monolith with branching ARIA.

## Slots and tokens: ask, do not memorise

Every composite exposes template slots (for the trigger label, the option
rendering, the empty and loading states, the chips) and DI override tokens (for
the commit handler, the display binding, the panel host, and more). These are the
single most drift-prone surface in the library, so this skill names none of them.
Query `get_slots` for the slot selectors and `get_di_tokens` for the override
tokens of the exact composite you picked, every time.

## Validation and error surfaces

Errors come from the bound `Field<T>` - the field wrapper reads its `errors` and
`invalid` state and renders the error region, gating the `aria-describedby`
reference on whether an error is actually showing. You do not wire an error string
by hand; you attach validators to the Signal Forms field and let the wrapper
communicate the state. Confirm the error-message hooks with `get_api` on the field
wrapper and its config token.

## Recipes

Four of the composites have a committed recipe - read it before wiring:

- `pack/recipes/forms-select-single-select.md` - CngxSelect.
- `pack/recipes/forms-select-multi-select.md` - CngxMultiSelect.
- `pack/recipes/forms-select-combobox.md` - CngxCombobox.
- `pack/recipes/forms-select-typeahead.md` - CngxTypeahead.
- `pack/recipes/forms-filter-builder-filter-builder-async-state.md` - a filter
  builder wired to async state.

The other composites (CngxTreeSelect, CngxReorderableMultiSelect, CngxActionSelect,
CngxActionMultiSelect, CngxSelectShell) do not have a recipe yet. For those, the
source of record is `get_api` for the shape and `get_story_example` for a working
composition - do not assume a recipe exists where it does not.

## Never guess

Ground every `@cngx/*` symbol against the MCP tools or the published docs
(`https://cngxjs.github.io/cngx/llms.txt` index, `llms-full.txt` full text)
before you use it. Do not guess an input name, a slot selector, or a token.
