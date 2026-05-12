# @cngx/common/tabs

The headless brain of the cngx tabs system. Presenter directive, host contracts, configuration cascade, slot directives, overflow strategy. Pairs with a rendering skin from `@cngx/ui/tabs` (CDK) or `@cngx/ui/mat-tabs` (Material), or with consumer-authored templates.

## When you reach for it

Almost never directly. This entry is consumed by the skin packages — you import from `@cngx/ui/tabs` or `@cngx/ui/mat-tabs` for ready-to-use components.

You touch this entry when:

- You are building a **custom rendering** for tabs (a fully bespoke design system) and want the cngx keyboard, ARIA, commit lifecycle, and overflow behaviour without redoing them.
- You are wiring **tab-level slot defaults** (busy spinner, error badge, overflow trigger) across the application via the configuration cascade.
- You need to read the per-tab contract from inside a sub-component — host tokens, not concrete classes.

## Mental model

Tabs are a presenter applied as a `hostDirective`, a set of declarative `CngxTab` definitions, content projection via `CngxTabContent` / `CngxTabLabel`, and a configurable overflow surface. The skin component is thin — it forwards inputs and renders a `<div role="tablist">` (or a `<mat-tab-group>` in the Material twin). All the state lives in the presenter, and all the wiring between presenter and content runs through `CNGX_TAB_GROUP_HOST` and `CNGX_TAB_PANEL_HOST`.

Two things make this layout work:

- **Commit lifecycle.** Activating a tab can fire an async action with optimistic or pessimistic semantics. The active state rolls back if the action fails. Per-tab busy and error markers ride the same channel.
- **Overflow.** When tabs do not fit, the runaway tabs collapse into a "more" trigger. Overflow recompute runs on an `IntersectionObserver` with a debounce, so resize storms do not thrash the layout.

## Companion entries

- **`@cngx/ui/tabs`** — CDK skin (`<cngx-tab-group>`, `<cngx-tab-overflow>`).
- **`@cngx/ui/mat-tabs`** — Material twin.
- **`@cngx/common/stepper`** — sibling brain for ordered flows.

## See also

- Presenter inputs/outputs, host tokens, slot directives, and `with*` config features in the **API** tab.
