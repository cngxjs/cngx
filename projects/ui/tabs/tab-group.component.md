# Tabs: UX and Accessibility

Tabs slice one surface into parallel views and show one at a time, so a dense screen
becomes a short row of labelled panels the user can flip between in any order. The pattern
earns its keep when the same subject has several independent facets - an account's Profile,
Security, and Billing - and the user wants to glance at one without scrolling past the
rest. There is nothing to "finish": tabs are a way to organise content, not a task to
complete.

This document is about the *pattern*, not the CNGX API. It explains when to reach for
tabs, how they differ from a stepper, how to make them keyboard- and screen-reader-complete,
and the mistakes that surface once the happy path is left behind. For the component inputs
and outputs, see the Info and API tabs.

## When tabs are the right tool

Reach for tabs when all of these hold:

- The content splits into a small set of named sections that belong to the same subject.
- The sections are independent: the user can read them in any order, and one does not gate
  another.
- Only one section needs to be visible at a time, and switching is cheap and frequent.

Typical homes: settings and account pages, a record's detail / activity / related views, a
dashboard that groups widgets by theme.

Do not use tabs when the parts must be done in order or one depends on another - that is a
stepper, not a tab group. Do not use tabs to hide content the user needs side by side, and
do not pile so many tabs into a row that the labels become cryptic; past a handful, a list
or navigation is clearer than a strip that scrolls or collapses into a "More" menu.

## Tabs versus stepper

This is the distinction people get wrong most often, because both render as a row of labels
with one panel visible at a time. The difference is about *intent and order*, and it drives
every other decision (ARIA roles, keyboard model, validation).

|-|Tabs|Stepper / Wizard|
|-|-|-|
|Mental model|Parallel views of the same thing|Sequential stages of one task|
|Order|None; pick any tab, any time|Ordered; progress matters|
|Dependency|Tabs are independent|Later steps may depend on earlier ones|
|Completion|There is nothing to "finish"|There is a final submit / done state|
|Progress|Not communicated|Core to the pattern (position, completed, remaining)|
|Validation|Per tab, if at all|Often gates moving forward|
|ARIA role|`tablist` / `tab` / `tabpanel`|Ordered list of steps; current step marked `aria-current="step"`|
|Keyboard|Arrow keys move between tabs immediately|Tab/Shift+Tab through controls; Next/Back buttons advance|

Rule of thumb: if the user could reasonably visit the parts in any order and nothing is
ever "submitted", you want tabs. If there is a start, an end, and an order in between, you
want a stepper. Do not borrow stepper semantics for tabs, or tab semantics for a stepper;
the roles tell assistive tech how the thing behaves, and the wrong role misleads.

## Anatomy

Required parts:

- Tab strip (`role="tablist"`): the row (or column) of tab buttons. One is selected.
- Tab (`role="tab"`): a button that selects its panel. Carries `aria-selected` and points
  at its panel with `aria-controls`.
- Tab panel (`role="tabpanel"`): the content of the selected tab, labelled by its tab via
  `aria-labelledby`. Inactive panels are hidden, not removed.

Optional but valuable:

- Overflow "More" menu: when the tabs do not fit, the clipped ones collapse into a menu so
  they stay reachable instead of being lost off-screen.
- Per-tab accessories: an error badge, a busy spinner, a close button - each communicating
  one piece of state without leaving the strip.

## UX guidance

- Name tabs by their content, not by ordinal. "Billing" beats "Tab 3"; the label is the
  thing the user scans for and the accessible name AT reads.
- Keep the selected tab obviously selected, with more than colour. The active state must
  survive colour-blindness and forced-colours.
- Keep switching cheap. Tabs imply the user will flip back and forth; do not lose entered
  data or scroll position when they leave and return to a tab.
- Do not overload the strip. A handful of tabs reads at a glance; a dozen that scroll or
  collapse is a sign the content wants a different navigation.
- Design the full lifecycle up front: empty, loading, and error states share the same panel
  container as the default view. A tab that only handles the happy path falls apart the
  first time a panel's data is slow or invalid.
- Match the visual skin to context, not novelty. In CNGX the skin (`line`, `contained`,
  `pill`, ...) is pure CSS - it changes nothing about structure, keyboard, or ARIA - so pick
  the one that reads best and move on.

## Communicating state

A tab can carry state that lives on the strip while its panel is hidden: this field is
invalid, this tab is loading, this switch was rejected. Communicate it explicitly and never
by colour alone, and keep the two failure channels separate so they never fight for the
same surface.

|Channel|What went wrong|Surface|
|-|-|-|
|Validation|The tab's own content is invalid (a required field, a bad value)|An error badge on the tab header plus an SR descriptor; bind `[error]` directly or wire `[errorAggregator]` for multi-source forms|
|Commit / async|The *switch* was rejected (a guard or a server said no on activate)|The rolled-back tab is decorated via `*cngxTabRejectionIcon` and the reason is announced through a toast / banner|

The badge and the rejection icon are visual cues, never the only channel: the error message
rides the tab's `aria-describedby` descriptor, and the rejection is announced through a live
region. Validation owns the error badge, commit owns the rejection icon, and each renders on
its own surface without overwriting the other.

## Accessibility

A11y is not a later audit pass; it is part of the design from the first implementation.
Build on semantic HTML first and add ARIA only where the semantics fall short.

### Keyboard

The whole tab group must be operable from the keyboard alone.

|Key|Action|
|-|-|
|Tab|Move into the tablist (lands on the selected tab), then on to the active panel|
|Arrow keys|Move between tabs along the strip's axis and select as you go (automatic activation)|
|Home / End|Jump to the first / last tab|
|Enter / Space|Activate the focused tab (redundant under automatic activation, still expected)|

Notes that matter in practice:

- The selected tab is the strip's only tab stop (roving tabindex), so `Tab` never walks
  through every tab - it lands on the active one and the next `Tab` moves to the panel.
- Under automatic activation, an arrow press moves focus *and* selects in one step, so focus
  and selection never diverge. This is the right model for tabs precisely because switching
  is cheap and side-effect-free; a stepper, where moving may validate, deliberately does not
  do this.
- Disabled tabs are skipped by arrow navigation but stay in the strip and the "of N" count.
- The active tab is scrolled into view when it would otherwise be clipped by overflow, so
  keyboard navigation never strands focus off-screen.

### Screen reader

- Give the tab group an accessible name (`aria-label` or `aria-labelledby`) so it is not
  just an unnamed region in the page outline.
- The accessible name of each tab comes from its label, and the group announces position
  with it ("Tab 2 of 5: Settings") so the user hears where they are without counting.
- Mark the selected tab with `aria-selected`, and tie each tab to its panel both ways
  (`aria-controls` on the tab, `aria-labelledby` on the panel) so AT can move between them.
- Announce state changes - selection, errors, loading - through a live region rather than
  relying on a visual change a screen-reader user cannot see.
- Keep status regions (the error descriptor, the live region) present in the DOM and toggle
  their content, rather than adding and removing them, so assistive tech has something
  stable to observe.

### Visual

- Never encode selection, error, or busy state in colour alone; pair it with a shape, icon,
  or text.
- Keep the focus ring visible and high-contrast, and readable at 200% zoom.
- Keep touch targets comfortable for coarse pointers; a cramped tab strip is hard to hit on
  mobile.

## Overflow and skins

When the tabs do not fit the available width, the runaway tabs must not simply vanish. A
"More" affordance (a menu-button: `aria-haspopup="menu"`, keyboard-navigable, with virtual
focus over the rows) keeps every tab reachable, and picking a hidden tab scrolls it back
into the strip. Skins change only the CSS layer (via a host attribute); structure, ARIA, and
keyboard behaviour are identical across every skin, so the choice is purely cosmetic and
never an accessibility decision.

## Routing

Tabs often map to URLs, and there are two distinct levels - pick by how much of the router
you actually need.

- Reflect the active tab in the URL while the content stays inline, so a link is shareable
  and a refresh stays on the tab. This is URL state sync (a `#tab=` fragment or `?tab=`
  query param); the panels are still plain templates.
- Make each tab a real route whose component renders into a `<router-outlet>`, so you get
  lazy loading, resolvers, `CanDeactivate` guards, deep links, and browser back/forward
  between tabs. The tabs stay `role="tab"` buttons driving navigation centrally - they are
  not anchors. When you need genuine link semantics (open-in-new-tab, middle-click), use a
  link-based navigation pattern instead.

Either way the tablist a11y - roles, keyboard, the named region - stays intact.

## State

- Keep the canonical state small and derive the rest. A single source of truth for "which
  tab is active" avoids a second index drifting out of sync with the URL or the selection.
- Persist enough context that the user can leave a tab and return without losing entered
  data or scroll position.
- Separate the kinds of state: what belongs in the URL (the active tab, when it is
  link-worthy), what is a stored preference, and what is transient in-memory interaction.

## Mobile and responsive

- Keep the pattern stable across breakpoints; the selected tab must never get hidden by a
  layout rearrangement.
- Let the strip overflow into a "More" menu rather than wrapping into an unreadable grid of
  labels.
- Avoid fixed panel heights when content varies in length, and plan the empty, loading, and
  error states inside the same panel container so a slow tab does not collapse the layout.

## Quick checklist

- Keyboard-only: can you reach the strip, move between tabs with the arrow keys, and Tab on
  to the panel?
- One screen-reader pass: is the group named, the selected tab announced with its position,
  and are errors and loading announced?
- Is selection (and any error / busy state) communicated without relying on colour?
- Do clipped tabs stay reachable through an overflow affordance instead of disappearing?
- Does entered data and scroll position survive switching away and back?
- Are tabs really the right pattern here, or is the content actually ordered (a stepper) or
  side-by-side (not tabs at all)?
