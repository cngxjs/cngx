# @cngx/common/display

Display-only atoms. Icons, avatars, badges, chips, tags, indicators, dividers - the visual vocabulary of cngx. No behaviour, no state beyond presentational flags.

## When you reach for it

You need a primitive visual piece that other components compose:

- An avatar that gracefully degrades from photo URL → initials → fallback.
- A stacked `CngxAvatarGroup` that overlaps avatars and collapses the extras past `[max]` into a `+N` overflow pill, with an `aria-label` summarising the hidden count.
- A chip the user can remove (used internally by multi-select, combobox, tag-input, filter-chips - and available to you for the same purpose).
- A tag pill that conveys status, category, or count - non-removable, theme-aware.
- A checkbox or radio glyph for a custom row design where you want the cngx look but own the selection logic yourself.
- A divider with an optional inline label.

For **interactive** atoms (ripple, async-click, nav badges, expandable disclosures), see `@cngx/common/interactive`. The split is by behaviour-versus-presentation: this entry only renders.

## Mental model

Every atom here is a thin visual surface that reads inputs and produces ARIA-correct markup. None of them own selection, focus, or async state - those are coordinated by the organisms that compose them. That separation is what lets `CngxCheckboxIndicator` appear inside a select panel row, a tree node, a menu item checkbox, and a custom table row without each context having to re-invent the visual or its accessibility shape.

`CngxChip` and `CngxTag` are easy to confuse: a chip is **removable and ephemeral** (the user added it, the user can remove it), a tag is **applied and static** (a label that classifies something). When in doubt, ask whether the user can dismiss it; if yes, it is a chip.

## See also

- Each component's inputs, slots, and CSS variables in the **API** tab.
- Live demos under `examples/stories/common/display/`.
