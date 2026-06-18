# Pagination: UX and Accessibility

Pagination splits a long result set into numbered pages and gives the user a control to move
between them. It earns its keep when the data is too long to show at once but the user still
needs a sense of *where they are* and *how much is left* - a search result, an admin table, a
catalogue. Unlike infinite scroll, a paginator gives a stable position ("page 4 of 12") that
survives a refresh, a back button, and a shared link.

This document is about the *pattern*, not the CNGX API. It explains when to reach for a
paginator, how it differs from load-more and infinite scroll, how to make it keyboard- and
screen-reader-complete, and the mistakes that surface once the happy path is left behind. For
the component inputs and outputs, see the Info and API tabs.

## When pagination is the right tool

Reach for a paginator when all of these hold:

- The result set is large enough that showing everything at once is slow or overwhelming.
- The user benefits from a stable position they can return to, cite, or share.
- Jumping to a specific page (first, last, page 7) is a real use, not just stepping forward.

Typical homes: data grids and admin tables, search results, catalogues, any list backed by a
paged or offset-based API.

Prefer a different pattern when:

- The user only ever scans forward and position never matters - that is infinite scroll or a
  load-more button, not a paginator.
- The set is small enough to show in full - then pagination is friction with no payoff.
- The content is a sequential task with a start and an end - that is a stepper, not pages of
  the same kind of thing.

## Pagination versus load-more versus infinite scroll

All three break a long list into chunks; the difference is whether *position* is a
first-class, addressable thing.

|-|Pagination|Load-more|Infinite scroll|
|-|-|-|-|
|Position|Explicit and addressable ("page 4 of 12")|Implicit (how many loaded)|None|
|Jump to a page|Yes (first / last / any number)|No|No|
|Shareable / refresh-stable|Yes|Partly|No|
|Best for|Tables, search, catalogues|Feeds where order matters but page does not|Media / social streams|
|Footer controls stay reachable|Yes|Yes|Often pushed off-screen|

Rule of thumb: if the user would ever say "go back to page 3" or wants to know how far through
they are, you want pagination. If they only ever consume forward and never cite a position,
load-more or infinite scroll fits better.

## Anatomy

A paginator composes from independent parts; show only the ones the context needs:

- Page row: the numbered buttons. One carries `aria-current="page"`. A long run truncates
  into an ellipsis that reveals the hidden pages.
- Previous / next: step one page at a time. Disabled at the respective bound.
- First / last: jump to the boundaries. Disabled at the respective bound.
- Range readout: "21-30 of 240" - the honest count of what this page shows.
- Page-size select: how many items per page; changing it resets to the first page.
- Go-to-page / page-of-pages: type or pick a page to jump directly.

The brain that drives all of these is content-agnostic: it computes page math from the total
item count and reports the active page back. The same brain paginates a table, a card grid,
or a dropdown panel.

## UX guidance

- Show the range, not just the page number. "21-30 of 240" tells the user how much there is
  and where they are; a bare "page 3" does not.
- Disable boundary controls visibly, but keep them perceivable - at the first page, previous
  and first are inert, and that inert state must be communicated, not silent.
- Resetting the page size returns to the first page. Jumping the user to "page 7 of a
  re-sized list" is disorienting; start over from the top.
- Keep the control in a predictable place (usually the footer of the list it pages) and keep
  it there as the data changes.
- Match the visual skin to context, not novelty. The skin is pure CSS - it changes nothing
  about structure, keyboard, or ARIA - so pick the one that reads best and move on.
- Plan the empty and loading states. A paginator over zero results should not show a broken
  "page 1 of 0"; a paginator over slow data should gate navigation, not let clicks queue.

## Communicating state

Every change the paginator makes is communicated on three channels at once - visual, semantic,
and to assistive tech - never by one alone.

|State|What changes|How it is communicated|
|-|-|-|
|Current page|The active page button|`aria-current="page"` on the active button plus a live-region "Page N of M" announcement|
|At a boundary|First/previous or next/last become inert|`aria-disabled` on the button (it stays focusable so the bound state is heard), not a removed control|
|Busy / loading|Navigation is gated|`aria-busy` on the landmark, an indeterminate progress bar, and a "Loading" / "Updated" announcement|
|Range|The first-last-of-total readout|Live text derived from the same page math, so it never drifts from the buttons|

A `total`-shrink that clamps the effective page (the data got smaller while the user was on a
high page) is never silent: the clamped page is both reported back to the consumer and
announced, so the user is not stranded on a page that no longer exists.

## Accessibility

A11y is not a later audit pass; it is part of the design from the first implementation. Build
on semantic HTML first (native `<button>`s, a named `nav` landmark) and add ARIA only where
the semantics fall short.

### Keyboard

The whole paginator must be operable from the keyboard alone.

|Key|Action|
|-|-|
|Tab|Move into the page row (lands on the active page), then on to the next control|
|Arrow keys|Move the active page button along the row|
|Home / End|Jump to the first / last page button in the row|
|Enter / Space|Activate the focused page or control|

Notes that matter in practice:

- The page row is one tab stop (roving tabindex): `Tab` lands on the active page and the next
  `Tab` moves on, rather than walking through every number.
- Previous / next / first / last stay in normal tab order as ordinary buttons.
- A button at its bound reports `aria-disabled` but keeps its place in the tab order, so a
  screen-reader user hears that the boundary is reached instead of finding the control gone.
- While the bound async state is busy, navigation is a no-op - a page click cannot race an
  in-flight load.

### Screen reader

- Give the paginator an accessible name (it is a `nav` landmark) so it is not just an unnamed
  region in the page outline.
- Each control carries an explicit accessible name ("Next page", "Go to page", "Page 4"), so
  the purpose is heard, not inferred from a glyph.
- Announce page changes, the clamp, and async transitions through a live region rather than
  relying on a visual change a screen-reader user cannot see.
- Keep the live region present in the DOM and toggle its content, rather than adding and
  removing it, so assistive tech has something stable to observe.
- All accessible-name and announcement strings are English by default and fully overridable,
  so the control localises with the rest of the app.

### Visual

- Never encode the current page, a boundary, or a busy state in colour alone; pair it with a
  shape, weight, or text.
- Keep the focus ring visible and high-contrast, and readable at 200% zoom.
- Keep touch targets comfortable for coarse pointers; a cramped page row is hard to hit on
  mobile, where the control should bump its hit-targets automatically.

## Async and loading

A paginator backed by a remote, paged API has to handle the gap between a click and the data
arriving. Bind the async state and the paginator becomes a consumer of it: while busy it gates
navigation, shows an indeterminate progress bar, flips `aria-busy`, and announces the
transition. The point is that a slow page never leaves the control in an ambiguous state and
never lets a second click queue behind the first.

## Skins and density

The skin (`numbered`, `minimal`, `pill`, `segmented`, `rail`, `dots`, `bar`) changes only the
CSS layer via a host attribute; structure, ARIA, and keyboard behaviour are identical across
every skin, so the choice is purely cosmetic and never an accessibility decision. Density and
the responsive collapse are likewise device- and context-driven, not separate behaviours.

## Mobile and responsive

- Keep the control stable across breakpoints; the active page must never get hidden by a
  layout rearrangement.
- Let a long page row truncate into the ellipsis menu rather than wrapping into an unreadable
  grid of numbers.
- On coarse pointers, prefer the compact skins and let the hit-targets grow; do not ship a
  desktop-dense row to a phone.

## Quick checklist

- Keyboard-only: can you reach the page row, move the active page with the arrow keys, and Tab
  on to the next control?
- One screen-reader pass: is the landmark named, the current page announced with its position,
  and are the boundary, loading, and clamp states announced?
- Is the current page (and any boundary or busy state) communicated without relying on colour?
- Does a long row truncate into a reachable ellipsis menu instead of overflowing?
- Does resetting the page size return to the first page?
- Is pagination really the right pattern here, or does the user actually want load-more,
  infinite scroll (forward-only), or a stepper (an ordered task)?
