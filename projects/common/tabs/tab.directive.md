# CngxTab

The single-tab atom. It renders nothing itself - its inputs are the source of the tab's place in the accessibility tree, and the organism renders them into ARIA. Get the inputs right and the a11y follows.

- **Selection is derived from a single source.** `selected` reads the presenter's `activeId`, never a stored flag, so `aria-selected` and the roving tab stop cannot drift apart. The active tab is the group's lone `Tab` stop; arrow keys move within the tablist.
- **`label` (plus `subLabel`) is the accessible name.** Both fold into the spoken name, and the organism prefixes position ("Tab 2 of 5: Settings"). Keep them meaningful; `subLabel` is read on every announcement, so avoid restating the label.
- **Error state is communicated, not just painted.** `[error]` (or the `errorAggregator`) drives `hasError`, which lights the error badge and fills the tab's `aria-describedby` SR descriptor. A non-empty `[error]` string doubles as that spoken message. The badge and colour are never the only channel.
- **Deferred-reveal validation stays silent.** The aggregator arm reads `shouldShow`, not `hasError`, so form errors are not announced before the user reaches and reveals them - AT is not spammed with pending validation. The direct `[error]` flag has no reveal concept: it shows the moment the consumer sets it.
- **`disabled` is skipped, not removed.** A disabled tab carries `aria-disabled` and is skipped by arrow-key navigation, but stays in the tablist and the "of N" count for context.
- **`id` anchors the wiring.** The bound `[id]` is the stable key behind keyboard focus targeting (`data-tab-id`), the tabpanel association, and the `(tabClose)` callback - so a skin reorder cannot misdirect focus or labelling.

## When you reach for it
Almost never directly. This entry is consumed by the skin packages - you import from `@cngx/ui/tabs` or `@cngx/ui/mat-tabs` for ready-to-use components.

### You touch this entry when:

- You are building a custom rendering for tabs (a fully bespoke design system) and want the CNGX keyboard, ARIA, commit lifecycle, and overflow behaviour without redoing them.
- You are wiring tab-level slot defaults (busy spinner, error badge, overflow trigger) across the application via the configuration cascade.
- You need to read the per-tab contract from inside a sub-component - host tokens, not concrete classes.
## Mental model
Tabs are a presenter applied as a hostDirective, a set of declarative CngxTab definitions, content projection via `CngxTabContent` / `CngxTabLabel`, and a configurable overflow surface. The skin component is thin - it forwards inputs and renders a <div role="tablist"> (or a <mat-tab-group> in the Material twin). 
All the state lives in the presenter, and all the wiring between presenter and content runs through `CNGX_TAB_GROUP_HOST` and `CNGX_TAB_PANEL_HOST`.

## Two things make this layout work:

- **Commit lifecycle.** Activating a tab can fire an async action with optimistic or pessimistic semantics. The active state rolls back if the action fails. Per-tab busy and error markers ride the same channel.
- **Overflow.** When tabs do not fit, the runaway tabs collapse into a "more" trigger. Overflow recompute runs on an IntersectionObserver with a debounce, so resize storms do not thrash the layout.
