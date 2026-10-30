# @cngx/ui/tabs

CDK skin for the cngx tabs system. A thin, Material-free rendering of `<cngx-tab-group>` and `<cngx-tab-overflow>` that applies the presenter from `@cngx/common/tabs` and stays out of its way.

## When you reach for it

You want a tab strip with:

- Async-aware tab activation (optimistic or pessimistic commit, per-tab busy and error markers).
- An overflow menu when the tabs do not fit available width.
- Full keyboard navigation (roving tabindex, arrow keys, `Home`/`End`, `Enter`/`Space`).
- No Material runtime - either because you ship your own design system or because the bundle cost matters.

If you want the same behaviour rendered in Material 3, import `@cngx/ui/mat-tabs` instead. The brain is shared between the two skins.

## Mental model

`<cngx-tab-group>` is a presenter applied as a `hostDirective`. The tab group component itself is thin - it forwards inputs and renders a CDK-based `<div role="tablist">`. All the state - active tab, commit lifecycle, overflow recompute, ARIA wiring - lives in the presenter from `@cngx/common/tabs`. That separation is what makes a Material twin possible without duplication.

Two pieces give the tab strip its character:

- **Commit lifecycle.** Activating a tab can fire an async action. In optimistic mode the tab becomes active immediately and rolls back on error; in pessimistic mode it stays inactive until success. Per-tab busy and error markers ride the same channel.
- **Overflow.** When tabs do not fit, the overflowing ones collapse into a "more" menu. Recompute is debounced through an `IntersectionObserver` so resize storms do not thrash the layout.

## Skins

`[skin]` picks the visual treatment; it maps to a `[data-skin]` host attribute that selects a CSS scope. Structure, slots, ARIA, and keyboard behaviour are identical across every value - only the paint changes. Orthogonal to `[orientation]` (horizontal/vertical) and `[iconLayout]`.

|Skin|Look|
|-|-|
|`line`|Default. Primary underline ink-bar under the active tab.|
|`contained`|Square folder tabs; the active tab fuses with the panel into one box and carries a primary accent bar on its leading edge.|
|`segmented`|Tabs share a muted track; the active tab lifts onto a raised surface.|
|`pill`|Rounded solid fills; the active pill takes the primary fill.|
|`pill-outline`|Same pill shape, but the active tab is a tinted, outlined chip.|

```html
<cngx-tab-group skin="segmented" orientation="vertical"> ... </cngx-tab-group>
```

Set an app-wide default with `withTabsSkin()` (via `provideCngxTabs`). Colours and sizes are CSS custom properties (`--cngx-tab-*`) that chain to `--mat-sys-*` when a Material theme is present.

### How each skin draws the error

The validation badge is a bare alert icon (no disc, `1.15em` of the label font, stroke 2) right after the label, in the danger colour (`--cngx-tab-error-badge-color`, `--cngx-tab-badge-size`).

A rejected tab (the latest commit refused or failed) carries the rejection icon after the label and a reason colour: red alert triangle for a failed commit, amber slashed circle for a refused one (`--cngx-tab-rejection-icon-color`, `--cngx-tab-refused-color`, `--cngx-tab-rejection-icon-size`). The two kinds never differ by colour alone.

|Skin|Rejected tab, horizontal and vertical|
|-|-|
|`line`|colour only: no surface, no line; the label turns the reason colour (`--cngx-tab-failed-text-color`, `--cngx-tab-refused-text-color`)|
|`contained`, `segmented`, `pill`, `pill-outline`|the reason colour tints the tab background (`--cngx-tab-rejection-tint`, 18%) in the skin's own shape; the label keeps its colour|

The colours chain to `--cngx-color-danger` / `--cngx-color-danger-text` and to `--cngx-color-warning` mixed toward `--cngx-color-text`, so they follow the light and dark scheme. Under forced colors the tint and the label colour vanish, so a rejected tab draws a 2px `CanvasText` outline and both icons paint the system text colour.

## Companion entries

- **`@cngx/common/tabs`** - the headless brain, configuration cascade, slot directives.
- **`@cngx/ui/mat-tabs`** - Material twin of this skin.
