# @cngx/ui/tabs

CDK skin for the cngx tabs system. A thin, Material-free rendering of `<cngx-tab-group>` and `<cngx-tab-overflow>` that applies the presenter from `@cngx/common/tabs` and stays out of its way.

## When you reach for it

You want a tab strip with:

- Async-aware tab activation (optimistic or pessimistic commit, per-tab busy and error markers).
- An overflow menu when the tabs do not fit available width.
- Full keyboard navigation (roving tabindex, arrow keys, `Home`/`End`, `Enter`/`Space`).
- No Material runtime — either because you ship your own design system or because the bundle cost matters.

If you want the same behaviour rendered in Material 3, import `@cngx/ui/mat-tabs` instead. The brain is shared between the two skins.

## Mental model

`<cngx-tab-group>` is a presenter applied as a `hostDirective`. The tab group component itself is thin — it forwards inputs and renders a CDK-based `<div role="tablist">`. All the state — active tab, commit lifecycle, overflow recompute, ARIA wiring — lives in the presenter from `@cngx/common/tabs`. That separation is what makes a Material twin possible without duplication.

Two pieces give the tab strip its character:

- **Commit lifecycle.** Activating a tab can fire an async action. In optimistic mode the tab becomes active immediately and rolls back on error; in pessimistic mode it stays inactive until success. Per-tab busy and error markers ride the same channel.
- **Overflow.** When tabs do not fit, the overflowing ones collapse into a "more" menu. Recompute is debounced through an `IntersectionObserver` so resize storms do not thrash the layout.

## Companion entries

- **`@cngx/common/tabs`** — the headless brain, configuration cascade, slot directives.
- **`@cngx/ui/mat-tabs`** — Material twin of this skin.
