# Stepper / Wizard: UX and Accessibility

A stepper (often called a wizard) takes one long, intimidating task and cuts it into a
short sequence of ordered steps. Each step shows a small, self-contained slice of work,
the user always knows where they are and what is left, and there are explicit checkpoints
to go back and correct mistakes. The pattern earns its keep when a single screen would be
too dense to reason about, or when later steps depend on decisions made earlier.

This document is about the *pattern*, not the CNGX API. It explains when to reach for a
stepper, how it differs from tabs, how to make it keyboard- and screen-reader-complete,
and the mistakes that show up once the happy path is left behind. For the component inputs
and outputs, see the Info and API tabs.

## When a stepper is the right tool

Reach for a stepper when all of these hold:

- The task is long enough that one screen would overwhelm.
- The steps have a natural order, or later steps genuinely depend on earlier answers.
- The user benefits from a sense of progress ("step 2 of 4") and from a review checkpoint
  before anything is committed.

Typical homes: onboarding and account setup, checkout and multi-page application forms,
internal tooling that walks an operator through a procedure.

Do not use a stepper when the surface is small enough that plain navigation or a single
form does the job. Splitting a two-field form into three steps adds clicks and ceremony
without adding clarity. A stepper is also a poor fit when the user wants to jump around
freely and the steps are independent of each other; that is a tabs problem, not a wizard
problem.

### Three common shapes

|Variant|Behaviour|Fits|
|-|-|-|
|Linear wizard|Steps must be completed in order; you cannot skip ahead|Checkout, dependent onboarding|
|Editable stepper|Completed steps stay reachable from the indicator for review and edits|Flows with frequent backtracking|
|Branching wizard|Later steps change based on earlier answers|Eligibility or intent-driven flows|

## Stepper versus tabs

This is the distinction people get wrong most often, because both render as a row of
labels with one panel visible at a time. The difference is about *intent and order*, and
it drives every other decision (ARIA roles, keyboard model, validation).

|-|Tabs|Stepper / Wizard|
|-|-|-|
|Mental model|Parallel views of the same thing|Sequential stages of one task|
|Order|None; pick any tab, any time|Ordered; progress matters|
|Dependency|Tabs are independent|Later steps may depend on earlier ones|
|Completion|There is nothing to "finish"|There is a final submit / done state|
|Progress|Not communicated|Core to the pattern (position, completed, remaining)|
|Validation|Per tab, if at all|Often gates moving forward|
|ARIA role|`tablist` / `tab` / `tabpanel`|Ordered list of steps (not a tablist); current step marked with `aria-current="step"`|
|Keyboard|Arrow keys move between tabs immediately|Tab/Shift+Tab through controls; Next/Back buttons advance|

Rule of thumb: if the user could reasonably do the parts in any order and nothing is ever
"submitted", you want tabs. If there is a start, an end, and an order in between, you want
a stepper. Do not borrow the tab ARIA roles for a stepper; a wizard is not a tablist, and
announcing it as one misleads screen-reader users about how it behaves.

## Anatomy

Required parts:

- Step indicator: shows the current position, what is done, and what remains.
- Step panel: the fields or tasks for the active step, and nothing from other steps.
- Back / Next actions: move between steps without losing entered data.

Optional but valuable:

- Review step: summarises every choice before the final commit, with links back to edit.
- Save and resume: lets the user leave a long flow and come back without starting over.

## UX guidance

- State the purpose of each step before adding any visual complexity. The user should know
  what this step is for in one glance.
- Keep a control, its label, and its outcome in the same visual group. When the status text
  lives far from the thing it describes, users work harder to connect them.
- Communicate state explicitly. Never make the user infer "this step is done" or "this one
  failed" from colour or decoration alone.
- Do not add steps without justification. Every extra step is another click and another
  place to abandon the flow.
- Do not assume one layout serves novices and experts equally; supporting text that helps a
  first-timer can be noise to a returning power user.
- Design the full lifecycle up front: empty, loading, and error states share the same
  container as the default view. Steppers that only handle the happy path fall apart the
  first time a network call is slow or a validation fails.

### Progress indication

The indicator is the spine of the pattern. It should answer three questions at all times:
where am I, what have I completed, what is left. Communicate completion and the current
position with more than colour (an icon, a checkmark, a text label) so the meaning survives
for colour-blind users and in high-contrast modes.

### Validation

In a linear flow, validation usually gates the Next action: the user cannot advance until
the current step is valid. Surface errors at the moment they block progress, attached to
the field that caused them, and announce them (see below) rather than relying on a red
border alone. In an editable stepper, also reflect that a previously completed step has
become invalid, so the user is not surprised at submit time.

## Accessibility

A11y is not a later audit pass; it is part of the design from the first implementation.
Build on semantic HTML first and add ARIA only where the semantics fall short.

### Keyboard

The entire flow must be completable with the keyboard alone.

|Key|Action|
|-|-|
|Tab|Move forward through focusable controls in logical order|
|Shift+Tab|Move backward through focusable controls|
|Enter / Space|Activate the focused button (Next, Back, Submit)|

Notes that matter in practice:

- Focus order stays logical when a panel opens, updates, or reveals new controls. When the
  user advances a step, move focus to the new panel (its heading or first control) so
  keyboard and screen-reader users are not stranded on a button that no longer makes sense.
- Focus stays visible and readable at 200% zoom.
- Unlike tabs, a stepper does not bind arrow keys to immediate step switching. Steps change
  through deliberate Next/Back activation, because moving forward may run validation or
  depend on the current step being complete.

### Screen reader

- Give the stepper itself an accessible name (`aria-label` or `aria-labelledby`) so it is
  not just an unnamed region in the page outline.
- Mark the current step with `aria-current="step"`, not colour or position alone, so the
  user's place in the sequence is exposed programmatically.
- Announce state changes: errors, loading, and completion, using an appropriate live-region
  politeness. A change the user cannot see must still be heard.
- Connect labels, hints, and status text to their controls with `aria-describedby` or with
  real heading structure, so the relationship is programmatic and not just visual.
- Keep status regions present in the DOM and toggle their content, rather than adding and
  removing them, so assistive tech has something stable to observe.

### Visual

- Never encode severity, completion, or selection in colour alone.
- Test at 200% zoom and with reduced motion enabled.
- Keep touch targets comfortable for coarse pointers on mobile.

## State

- Keep the canonical state small and derive the rest. A single source of truth for "which
  step, what is valid, what is entered" avoids forked, contradictory copies.
- Persist enough context that the user can leave and return without losing progress.
- Separate the kinds of state: what belongs in the URL, what is a stored preference, and
  what is transient in-memory interaction state.

## Mobile and responsive

- Keep the pattern stable across common breakpoints; the current step must never get hidden
  by a layout rearrangement.
- Avoid fixed heights when step content varies in length.
- Plan the empty, loading, and error states inside the same container so a slow step does
  not collapse the layout.

## Quick checklist

- Keyboard-only: can you complete the whole flow with Tab, Shift+Tab, Enter, and Space?
- One screen-reader pass: are step changes, errors, and completion announced?
- Does focus move to the new panel on every step change?
- Is progress (position, done, remaining) communicated without relying on colour?
- Is the current step marked with `aria-current="step"` and the stepper itself named?
- Do empty, loading, and error states share the step container and behave?
- Does entered data survive going Back and a page refresh?
