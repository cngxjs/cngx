# cngx theming tokens

Every cngx component themes through `--cngx-*` CSS custom properties with literal fallbacks. Set any token in your own stylesheet to override it; leave it unset to keep the default below. 3015 tokens across 167 components.

## CngxA11yPanel

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-a11y-panel-gap`|`var(--cngx-space-md, 1rem)`|Layout|Gap between the preference axes in the panel body.|
|`--cngx-a11y-panel-axis-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Gap between an axis label and its control.|
|`--cngx-a11y-panel-reset-pad-x`|`var(--cngx-space-md, 1rem)`|Layout|Inline padding of the reset button.|
|`--cngx-a11y-panel-reset-pad-y`|`var(--cngx-space-sm, 0.5rem)`|Layout|Block padding of the reset button.|

## CngxAccordion

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-accordion-header-padding`|`0.75rem 1rem`|Header|Header button padding. The pixel `initial-value` is only the un-set fallback; the standalone `[cngxAccordion]` host SETs this from `--cngx-space-*` (below) so a global `[data-density]` re-scales a bare `@cngx/common` accordion, and the `@cngx/ui/accordion` organism SETs the same tokens at its group default. Never put `var()` in the `initial-value` (it is invalid, and a registered initial-value defeats any `var()` fallback - reference_property_color_initial_defeats_fallback); derive via a host SET.|
|`--cngx-accordion-region-padding`|`0.75rem 1rem`|Region|Region (content) padding.|
|`--cngx-accordion-border-color`|`oklch(0.88 0.005 250)`|Header|Divider colour between rows.|
|`--cngx-accordion-twisty-display`|`block`|Header|Display of the CSS twisty. `block` shows it, `none` hides it. A skin that ships its own chevron (e.g. the @cngx/ui accordion organism) sets this to `none` on the header instead of a blanket `::after` reset. `inherits: true` so a value set on the header button reaches the `::after` pseudo.|

## CngxAccordionGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-accordion-heading-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Gap between the leading, title and meta cells of the item heading row.|
|`--cngx-accordion-header-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Gap between the title block and the chevron inside the header button.|
|`--cngx-accordion-title-gap`|`var(--cngx-space-xs, 0.125rem)`|Layout|Gap between the item title and its subtitle.|
|`--cngx-accordion-border-color`|`var(--cngx-color-border, #d1d5db)`|Surface|Colour of the default group and item divider lines.|
|`--cngx-accordion-header-padding`|`var(--cngx-space-sm, 8px) var(--cngx-space-md, 16px)`|Layout|Padding of the item header button.|
|`--cngx-accordion-region-padding`|`var(--cngx-space-sm, 8px) var(--cngx-space-md, 16px)`|Layout|Padding of the expanded item region.|
|`--cngx-accordion-divider`|`none`|Skin|Border of the divider below each item and above the group. Skins set it to `none` when they paint their own frame.|
|`--cngx-accordion-focus-color`|`var(--cngx-color-primary, #1d4ed8)`|Skin|Colour of the header focus outline.|
|`--cngx-accordion-group-border-block-start`|`none`|Skin|Top border of the group. Card skins set it to `none`.|
|`--cngx-accordion-hairline`|`color-mix(in srgb, var(--cngx-color-text, #0f1320) 6%, transparent)`|Skin|Faint line colour shared by skin frames and row dividers.|
|`--cngx-accordion-marker`|`plus-minus`|Skin|Marker style of the item chevron: `plus-minus` draws a boxed plus, `none` hides it, unset keeps the chevron.|
|`--cngx-accordion-alt-surface`|`color-mix(
      in oklab,
      var(--cngx-color-surface, #fff) 93%,
      var(--cngx-color-text, #0f1320) 7%
    )`|Skin|Alternate surface fill for the plus-minus marker box and the header hover.|
|`--cngx-accordion-marker-size`|`1.75rem`|Skin|Width and height of the plus-minus marker box.|
|`--cngx-accordion-header-color`|`var(--cngx-color-text-muted, #6b7280)`|Skin|Text colour of the item header button.|
|`--cngx-accordion-subtitle-color`|`color-mix(
      in oklab,
      var(--cngx-color-surface, #fff) 62%,
      var(--cngx-color-text, #111827)
    )`|Skin|Text colour of the item subtitle.|
|`--cngx-accordion-band-bg`|`color-mix(in oklab, var(--cngx-color-text, #f2f4fa) 87%, var(--cngx-color-surface, #13151d))`|Skin|Background of the section-bands heading band.|
|`--cngx-accordion-band-bg-hover`|`color-mix(in oklab, var(--cngx-color-text, #f2f4fa) 79%, var(--cngx-color-surface, #13151d))`|Skin|Background of the section-bands heading band on hover.|
|`--cngx-accordion-spine-color`|`var(--cngx-color-danger, #dc2626)`|Skin|Colour of the severity-spine column on an expanded item.|

## CngxAccordionItem

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-accordion-twisty-display`|`none`|Layout|Display of the Track-B skin's `::after` twisty on the item header. Set to `none` because the item renders its own chevron.|

## CngxAccordionPanel

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-accordion-header-padding`|`0.75rem 1rem`|Header|Header button padding. The pixel `initial-value` is only the un-set fallback; the standalone `[cngxAccordion]` host SETs this from `--cngx-space-*` (below) so a global `[data-density]` re-scales a bare `@cngx/common` accordion, and the `@cngx/ui/accordion` organism SETs the same tokens at its group default. Never put `var()` in the `initial-value` (it is invalid, and a registered initial-value defeats any `var()` fallback - reference_property_color_initial_defeats_fallback); derive via a host SET.|
|`--cngx-accordion-region-padding`|`0.75rem 1rem`|Region|Region (content) padding.|
|`--cngx-accordion-border-color`|`oklch(0.88 0.005 250)`|Header|Divider colour between rows.|
|`--cngx-accordion-twisty-display`|`block`|Header|Display of the CSS twisty. `block` shows it, `none` hides it. A skin that ships its own chevron (e.g. the @cngx/ui accordion organism) sets this to `none` on the header instead of a blanket `::after` reset. `inherits: true` so a value set on the header button reaches the `::after` pseudo.|

## CngxActionButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-padding-block`|`0.5rem`|Layout|Block padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-padding-inline`|`1rem`|Layout|Inline padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-gap`|`0.5rem`|Layout|Gap between the slots and the label.|
|`--cngx-button-font-size`|`1rem`|Typography|Font size. `md` reads the form-control font so the button shares the control line box.|
|`--cngx-button-radius`|`0.5rem`|Layout|Corner radius.|
|`--cngx-button-border-width`|`1px`|Layout|Border width on all four sides; transparent where the variant paints none, so every variant shares one box.|
|`--cngx-button-transition`|`150ms`|Motion|Transition duration for colour changes. Derives from the `--cngx-duration-fast` rung of the motion scale.|
|`--cngx-button-tone`|`currentColor`|Tone|Tone colour: the outline border, the hover wash, and the solid fill unless `--cngx-button-tone-fill` is set.|
|`--cngx-button-tone-text`|`currentColor`|Tone|Text colour on a transparent or tonal surface.|
|`--cngx-button-on-tone`|`Canvas`|Tone|Text colour on the solid tone fill.|
|`--cngx-button-tone-fill`|``|Tone|Solid fill colour. Set by the primary and danger tones to the strong palette rung their on-colour clears 4.5:1 against; unset, the solid fill falls back to `--cngx-button-tone`. Outline, secondary, ghost and link keep painting from `--cngx-button-tone`. Registered without an initial value so the fallback stays live.|
|`--cngx-button-spinner-size`|`1em`|Busy|Diameter of the busy spinner ring, and the box of a bare `svg` or `img` drawn by a `provideButtonSpinner` component.|
|`--cngx-button-spinner-thickness`|`2px`|Busy|Stroke width of the busy spinner ring. Inherits so a value set on the button reaches the ring inside the busy layer.|
|`--cngx-button-hover-shade`|`oklch(0 0 0)`|Tone|Colour a solid button's tone mixes towards on hover and press (by `--cngx-button-hover-layer` / `--cngx-button-pressed-layer`), so the fill darkens without a second tone token.|
|`--cngx-button-link-hover-thickness`|`2px`|Tone|Underline thickness of a `link` button on hover; at rest it keeps the font's own underline.|
|`--cngx-button-icon-size`|`1.25em`|Layout|Edge length of an `svg` or `img` in a start or end slot. Same rung as `--cngx-icon-size-md`, so a projected `cngx-icon` and a bare `svg` match. Inherits so a value set on the button reaches the slot glyph.|
|`--cngx-button-neutral-tint`|`5%`|Tone|Tint strength of a neutral `secondary` fill and its hover. Light text on a dark surface reads a small tint as almost nothing, so the dark scheme steps both up.|
|`--cngx-button-neutral-tint-hover`|`9%`|Tone|Hover tint strength of a neutral `secondary` fill.|
|`--cngx-button-hover-layer`|`12%`|State / Hover|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill on hover, a state layer. A theme maps it to its hover state-layer opacity (the Material bridge: `--mat-sys-hover-state-layer-opacity`).|
|`--cngx-button-pressed-layer`|`20%`|State / Pressed|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill while pressed, one step above `--cngx-button-hover-layer`. A theme maps it to its pressed state-layer opacity (the Material bridge: `--mat-sys-pressed-state-layer-opacity`).|
|`--cngx-button-pressed-wash`|`12%`|State / Pressed|Tone wash of a pressed `outline` or `ghost` button (hover takes 8%).|
|`--cngx-button-neutral-tint-pressed`|`13%`|State / Pressed|Pressed tint strength of a neutral `secondary` fill, one step above `--cngx-button-neutral-tint-hover`; the dark scheme steps it up.|
|`--cngx-button-secondary-bg-pressed`|``|State / Pressed|Pressed fill of a `secondary` button. Unset by default, so the pressed tone mix paints; a theme sets it next to `--cngx-button-secondary-bg-hover`.|
|`--cngx-button-secondary-bg`|``|Tone|Fill of a `secondary` button. Unset by default, so the fill is the tone mixed into transparency (the neutral tint for `neutral`, 12% otherwise). A theme sets it to paint a container colour instead (the Material bridge maps it to the `*-container` roles).|
|`--cngx-button-secondary-bg-hover`|``|Tone|Hover fill of a `secondary` button. Unset by default, so hover steps the tone mix up.|
|`--cngx-button-secondary-color`|``|Tone|Text colour of a `secondary` button. Unset by default, so the tone text colour paints.|

## CngxActionMultiSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel host (anchor-positioned, may sit outside the normal DOM flow).|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through `--cngx-color-surface`.|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value `currentColor` lets the panel inherit text color from its ancestor by default. Registering as `<color>` would forbid `currentColor` since `<color>` requires a computationally- independent value.|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the floating panel host.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-action-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the separator between the action region and the options: on the block-start side of a bottom action, the block-end side of a top action. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel. Set it to `none` to drop the separator.|
|`--cngx-select-action-padding`|`0.25rem`|Layout|Space between the action separator and the action content.|
|`--cngx-select-action-margin`|`0.25rem`|Layout|Space between the options and the action separator.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven, so dense rows stay compact) and composes into the touch-target floor via `max()`. A `0px` rather than `auto` default is deliberate: `auto` cannot be an argument to `max()`, and the floor needs to compose the row height against `--cngx-target-min`.|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a low-alpha tint of `--cngx-color-primary` so the highlight reads as brand-accented without competing with selection state.|
|`--cngx-select-option-active-indicator`|`oklch(0.5 0.2 275)`|State|Colour of the inline-start indicator bar on the keyboard-active row. The background tint alone is ~1.1:1 against the panel; this opaque bar carries the active affordance at >= 3:1. Delegates to the primary colour below, so it follows the scheme and a re-theme.|
|`--cngx-select-option-multi-selected-bg`|`transparent`|State / Selected|Background of a selected row in a multi-value panel whose selection indicator renders. Transparent by default: the checkbox carries the selection, so a mostly-selected panel does not turn into a solid block. Assign a colour to opt the fill back in. Single-value panels and rows with the indicator hidden keep `--cngx-option-selected-bg`.|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through `--cngx-color-primary`.|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant. Muted by default to mirror the placeholder token; the Material bridge maps it to `--mat-sys-on-surface-variant`. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks the same muted default as the caret so both trigger affordances read uniformly. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-caret-size`|`1.6em`|Layout|Font-size of the dropdown caret glyph shared across every variant. Read at the caret span (a trigger descendant), so `inherits: true` is load-bearing: with `inherits: false` the registered initial would always win at the caret and no consumer or composing organism could ever set the token (the inherits:false trap). The default glyph box never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a caret smaller than the 12px micro box.|
|`--cngx-select-clear-target-min`|`24px`|Layout|Fine-pointer hit-area floor of the clear button, on both axes. The 24px default meets WCAG 2.5.8 (AA); under the touch floor the larger `--cngx-target-min` wins. The trigger row keeps its height: the box hands back what it adds over the control line box. `inherits: true` so a trigger-level or ancestor override reaches the button.|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-skeleton-shimmer`|`oklch(0.2 0.01 250)`|State / Loading|Base colour the skeleton shimmer gradient is mixed from. Defaults from the foundation text colour, so the shimmer darkens a light panel and lightens a dark one in every scheme (OS, a `data-color-scheme` island, or a consumer light theme under OS dark) without a hardcoded dark-mode swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-option-spinner-track`|`oklch(0 0 0 / 0.15)`|State / Commit|Track (resting ring) colour of the per-option commit spinner. Defaults from the foundation text colour at a low alpha, so it reads on the panel in every scheme without a dark swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true` so the :root dark-mode override (alpha-on-white on dark) reaches the spinner inside the floating panel.|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to `--cngx-color-primary`.|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.46 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a reorderable chip wrap.|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-reorder-move-size`|`0.75em`|Layout|Size of the move-up / move-down glyph in the reorder list the panel shows under the touch floor: the box of the default triangles (still floored at the 0.75rem micro floor) and the font-size of a projected `*cngxMultiSelectMoveGlyph`. Read at the move button (a descendant of the select host), so `inherits: true` is load-bearing: with `inherits: false` a host-level override would never reach it.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the chip while it's being dragged.|
|`--cngx-select-chip-drag-bg`|`oklch(0.58 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Defaults track `--cngx-color-primary-strong` via the delegating entries below.|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state. Defaults track `--cngx-color-on-primary-strong`, which holds 4.5:1 on the drag background in both schemes.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to `--cngx-color-primary`.|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of every error surface. Falls back to `--cngx-color-danger`.|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a `box-shadow` so it composes with any consumer-supplied focus outline.|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-commit-error-hint-color`|`oklch(0.5 0.2 25)`|State / Commit|Text colour of the commit-error hint shown under a closed trigger. Defaults to the danger-text contrast tier so it clears 4.5:1 like the inline banner.|
|`--cngx-select-commit-error-hint-margin`|`0.25rem`|State / Commit|Block-start margin of the commit-error hint, set from the density scale.|
|`--cngx-select-reorder-list-max-block-size`|`40dvh`|Layout|Height cap of the sortable list of selected values that a reorderable select shows in its sheet under the touch floor. A longer selection scrolls inside the list, so the options below stay reachable.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|
|`--cngx-select-message-padding`|`var(--cngx-space-sm) var(--cngx-space-sm)`|Layout|Padding of the loading and empty message rows in the panel.|
|`--cngx-select-chip-fit-badge-reserve`|`5ch`|State / Overflow|Inline space a `chipOverflow: 'fit'` strip keeps free for the `+N` badge. The badge slot is exactly this wide and clips a wider badge; raise it for a projected `*cngxSelectChipOverflow` or a custom `chipOverflowBadge` formatter. Set it on the select, a container or `:root`. Never assigned by the library, so the `5ch` fallback (room for `+99`) resolves against the strip font.|
|`--cngx-action-multi-select-min-width`|`var(--cngx-combobox-min-width, var(--cngx-select-min-width, 12rem))`|Layout|Preferred minimum inline size of the select. A standalone or toolbar select is at least this wide; a narrower cell shrinks it, as it does an input. Falls back to `--cngx-combobox-min-width`, then `--cngx-select-min-width`; see {@link --cngx-select-min-width} for why no `initial-value` is declared.|
|`--cngx-action-multi-select-gap`|`var(--cngx-combobox-gap, var(--cngx-select-gap, var(--cngx-space-xs, 0.375rem)))`|Layout|Gap between the chip list, input, caret, and clear-all button. Falls back to `--cngx-combobox-gap`, then `--cngx-select-gap`; see {@link --cngx-select-gap} for why no `initial-value` is declared.|
|`--cngx-action-multi-select-padding`|`var(--cngx-combobox-padding, var(--cngx-select-padding, var(--cngx-space-sm, 0.25rem) var(--cngx-space-md, 0.375rem)))`|Layout|Padding shorthand of the trigger. Falls back to `--cngx-combobox-padding`, then `--cngx-select-padding`; see {@link --cngx-select-padding} for why no `initial-value` is declared.|
|`--cngx-action-multi-select-border`|`var(--cngx-combobox-border, var(--cngx-select-border, 1px solid var(--cngx-color-border-strong)))`|Surface|Border shorthand of the trigger. Falls back to `--cngx-combobox-border`, then `--cngx-select-border`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-action-multi-select-radius`|`var(--cngx-combobox-radius, var(--cngx-select-radius, var(--cngx-radius-md, 8px)))`|Layout|Corner radius of the trigger. Falls back to `--cngx-combobox-radius`, then `--cngx-select-radius`; see {@link --cngx-select-radius} for why no `initial-value` is declared.|
|`--cngx-action-multi-select-bg`|`var(--cngx-combobox-bg, var(--cngx-select-bg, transparent))`|Surface|Background of the trigger. Falls back to `--cngx-combobox-bg`, then `--cngx-select-bg`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-action-multi-select-color`|`var(--cngx-combobox-color, var(--cngx-select-color, inherit))`|Surface|Text color of the trigger. Falls back to `--cngx-combobox-color`, then `--cngx-select-color`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-action-multi-select-min-height`|`var(--cngx-combobox-min-height, var(--cngx-select-min-height, 2.125rem))`|Layout|Minimum block size of the trigger. Falls back to `--cngx-combobox-min-height`, then `--cngx-select-min-height`; see {@link --cngx-select-min-height} for why no `initial-value` is declared. The touch floor still lifts the trigger to `--cngx-target-min`.|
|`--cngx-action-multi-select-focus-outline`|`var(--cngx-combobox-focus-outline, var(--cngx-select-focus-outline, 2px solid var(--cngx-color-primary)))`|State / Focus|Focus-ring outline shorthand of the trigger. Falls back to `--cngx-combobox-focus-outline`, then `--cngx-select-focus-outline`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-action-multi-select-input-flex-basis`|`var(--cngx-combobox-input-flex-basis, 4rem)`|Layout|Flex basis of the inline input. Falls back to `--cngx-combobox-input-flex-basis`; see {@link --cngx-combobox-input-flex-basis} for why no `initial-value` is declared.|
|`--cngx-action-multi-select-input-min-width`|`var(--cngx-combobox-input-min-width, 4rem)`|Layout|Minimum inline size of the inline input. Falls back to `--cngx-combobox-input-min-width`; see {@link --cngx-combobox-input-min-width} for why no `initial-value` is declared.|

## CngxActionSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel host (anchor-positioned, may sit outside the normal DOM flow).|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through `--cngx-color-surface`.|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value `currentColor` lets the panel inherit text color from its ancestor by default. Registering as `<color>` would forbid `currentColor` since `<color>` requires a computationally- independent value.|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the floating panel host.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-action-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the separator between the action region and the options: on the block-start side of a bottom action, the block-end side of a top action. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel. Set it to `none` to drop the separator.|
|`--cngx-select-action-padding`|`0.25rem`|Layout|Space between the action separator and the action content.|
|`--cngx-select-action-margin`|`0.25rem`|Layout|Space between the options and the action separator.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven, so dense rows stay compact) and composes into the touch-target floor via `max()`. A `0px` rather than `auto` default is deliberate: `auto` cannot be an argument to `max()`, and the floor needs to compose the row height against `--cngx-target-min`.|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a low-alpha tint of `--cngx-color-primary` so the highlight reads as brand-accented without competing with selection state.|
|`--cngx-select-option-active-indicator`|`oklch(0.5 0.2 275)`|State|Colour of the inline-start indicator bar on the keyboard-active row. The background tint alone is ~1.1:1 against the panel; this opaque bar carries the active affordance at >= 3:1. Delegates to the primary colour below, so it follows the scheme and a re-theme.|
|`--cngx-select-option-multi-selected-bg`|`transparent`|State / Selected|Background of a selected row in a multi-value panel whose selection indicator renders. Transparent by default: the checkbox carries the selection, so a mostly-selected panel does not turn into a solid block. Assign a colour to opt the fill back in. Single-value panels and rows with the indicator hidden keep `--cngx-option-selected-bg`.|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through `--cngx-color-primary`.|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant. Muted by default to mirror the placeholder token; the Material bridge maps it to `--mat-sys-on-surface-variant`. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks the same muted default as the caret so both trigger affordances read uniformly. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-caret-size`|`1.6em`|Layout|Font-size of the dropdown caret glyph shared across every variant. Read at the caret span (a trigger descendant), so `inherits: true` is load-bearing: with `inherits: false` the registered initial would always win at the caret and no consumer or composing organism could ever set the token (the inherits:false trap). The default glyph box never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a caret smaller than the 12px micro box.|
|`--cngx-select-clear-target-min`|`24px`|Layout|Fine-pointer hit-area floor of the clear button, on both axes. The 24px default meets WCAG 2.5.8 (AA); under the touch floor the larger `--cngx-target-min` wins. The trigger row keeps its height: the box hands back what it adds over the control line box. `inherits: true` so a trigger-level or ancestor override reaches the button.|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-skeleton-shimmer`|`oklch(0.2 0.01 250)`|State / Loading|Base colour the skeleton shimmer gradient is mixed from. Defaults from the foundation text colour, so the shimmer darkens a light panel and lightens a dark one in every scheme (OS, a `data-color-scheme` island, or a consumer light theme under OS dark) without a hardcoded dark-mode swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-option-spinner-track`|`oklch(0 0 0 / 0.15)`|State / Commit|Track (resting ring) colour of the per-option commit spinner. Defaults from the foundation text colour at a low alpha, so it reads on the panel in every scheme without a dark swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true` so the :root dark-mode override (alpha-on-white on dark) reaches the spinner inside the floating panel.|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to `--cngx-color-primary`.|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.46 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a reorderable chip wrap.|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-reorder-move-size`|`0.75em`|Layout|Size of the move-up / move-down glyph in the reorder list the panel shows under the touch floor: the box of the default triangles (still floored at the 0.75rem micro floor) and the font-size of a projected `*cngxMultiSelectMoveGlyph`. Read at the move button (a descendant of the select host), so `inherits: true` is load-bearing: with `inherits: false` a host-level override would never reach it.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the chip while it's being dragged.|
|`--cngx-select-chip-drag-bg`|`oklch(0.58 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Defaults track `--cngx-color-primary-strong` via the delegating entries below.|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state. Defaults track `--cngx-color-on-primary-strong`, which holds 4.5:1 on the drag background in both schemes.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to `--cngx-color-primary`.|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of every error surface. Falls back to `--cngx-color-danger`.|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a `box-shadow` so it composes with any consumer-supplied focus outline.|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-commit-error-hint-color`|`oklch(0.5 0.2 25)`|State / Commit|Text colour of the commit-error hint shown under a closed trigger. Defaults to the danger-text contrast tier so it clears 4.5:1 like the inline banner.|
|`--cngx-select-commit-error-hint-margin`|`0.25rem`|State / Commit|Block-start margin of the commit-error hint, set from the density scale.|
|`--cngx-select-reorder-list-max-block-size`|`40dvh`|Layout|Height cap of the sortable list of selected values that a reorderable select shows in its sheet under the touch floor. A longer selection scrolls inside the list, so the options below stay reachable.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|
|`--cngx-select-message-padding`|`var(--cngx-space-sm) var(--cngx-space-sm)`|Layout|Padding of the loading and empty message rows in the panel.|
|`--cngx-select-chip-fit-badge-reserve`|`5ch`|State / Overflow|Inline space a `chipOverflow: 'fit'` strip keeps free for the `+N` badge. The badge slot is exactly this wide and clips a wider badge; raise it for a projected `*cngxSelectChipOverflow` or a custom `chipOverflowBadge` formatter. Set it on the select, a container or `:root`. Never assigned by the library, so the `5ch` fallback (room for `+99`) resolves against the strip font.|
|`--cngx-action-select-gap`|`var(--cngx-select-gap, var(--cngx-space-sm, 0.5rem))`|Layout|Gap between the input, clear button, and caret. Falls back to `--cngx-select-gap`; see {@link --cngx-select-gap} for why no `initial-value` is declared.|
|`--cngx-action-select-min-height`|`var(--cngx-select-min-height, 2.125rem)`|Layout|Minimum block size of the trigger. Falls back to `--cngx-select-min-height`; see {@link --cngx-select-min-height} for why no `initial-value` is declared. The touch floor still lifts the trigger to `--cngx-target-min`.|
|`--cngx-action-select-padding`|`var(--cngx-select-padding, var(--cngx-space-sm, 0) var(--cngx-space-md, 0.75rem))`|Layout|Padding shorthand of the trigger. Falls back to `--cngx-select-padding`; see {@link --cngx-select-padding} for why no `initial-value` is declared.|
|`--cngx-action-select-border`|`var(--cngx-select-border, 1px solid var(--cngx-color-border-strong))`|Surface|Border shorthand of the trigger. Falls back to `--cngx-select-border`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-action-select-radius`|`var(--cngx-select-radius, var(--cngx-radius-md, 8px))`|Layout|Corner radius of the trigger. Falls back to `--cngx-select-radius`; see {@link --cngx-select-radius} for why no `initial-value` is declared.|
|`--cngx-action-select-bg`|`var(--cngx-select-bg, transparent)`|Surface|Background of the trigger. Falls back to `--cngx-select-bg`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|

## CngxAlert

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-feedback-info-bg`|`oklch(from var(--cngx-color-info, oklch(0.65 0.12 240)) 0.96 0.025 h)`|Severity|Background tint of info alerts and banners.|
|`--cngx-feedback-info-border`|`oklch(
      from var(--cngx-color-info, oklch(0.65 0.12 240)) 0.85 0.07 h
    )`|Severity|Border colour of info alerts and banners.|
|`--cngx-feedback-info-icon`|`color-mix(
      in oklab,
      var(--cngx-color-info, oklch(0.65 0.12 240)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the info severity icon in alerts and banners, and the info toast accent.|
|`--cngx-feedback-success-bg`|`oklch(
      from var(--cngx-color-success, oklch(0.6 0.15 145)) 0.96 0.04 h
    )`|Severity|Background tint of success alerts and banners.|
|`--cngx-feedback-success-border`|`oklch(
      from var(--cngx-color-success, oklch(0.6 0.15 145)) 0.85 0.1 h
    )`|Severity|Border colour of success alerts and banners.|
|`--cngx-feedback-success-icon`|`color-mix(
      in oklab,
      var(--cngx-color-success, oklch(0.6 0.15 145)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the success severity icon in alerts and banners, and the success toast accent.|
|`--cngx-feedback-warning-bg`|`oklch(
      from var(--cngx-color-warning, oklch(0.72 0.15 75)) 0.97 0.04 h
    )`|Severity|Background tint of warning alerts and banners.|
|`--cngx-feedback-warning-border`|`oklch(
      from var(--cngx-color-warning, oklch(0.72 0.15 75)) 0.86 0.1 h
    )`|Severity|Border colour of warning alerts and banners.|
|`--cngx-feedback-warning-icon`|`color-mix(
      in oklab,
      var(--cngx-color-warning, oklch(0.72 0.15 75)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the warning severity icon in alerts and banners, and the warning toast accent.|
|`--cngx-feedback-error-bg`|`oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.96 0.025 h)`|Severity|Background tint of error alerts and banners.|
|`--cngx-feedback-error-border`|`oklch(
      from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.85 0.08 h
    )`|Severity|Border colour of error alerts and banners.|
|`--cngx-feedback-error-icon`|`color-mix(
      in oklab,
      var(--cngx-color-danger, oklch(0.6 0.18 25)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the error severity icon in alerts and banners, and the error toast accent.|
|`--cngx-alert-gap`|`12px`|Layout|Gap between the icon, body, and dismiss button.|
|`--cngx-alert-padding`|`12px 16px`|Layout|Padding shorthand inside the alert.|
|`--cngx-alert-border-radius`|`8px`|Layout|Corner radius.|
|`--cngx-alert-border-color`|`transparent`|Surface|Border color - neutral by default; severity rules override.|
|`--cngx-alert-bg`|`oklch(0.98 0.005 250)`|Surface|Background - neutral by default; severity rules override.|
|`--cngx-alert-color`|`currentColor`|Surface|Text color - defaults to `currentColor`.|
|`--cngx-alert-info-bg`|`oklch(0.96 0.025 240)`|Variant / Info|Background tint of the info severity. Derives from `--cngx-color-info` hue at L 0.96 C 0.025 (dark L 0.3 C 0.05). Defaults to the shared `--cngx-feedback-info-bg`.|
|`--cngx-alert-info-border`|`oklch(0.85 0.07 240)`|Variant / Info|Border color of the info severity. Derives from `--cngx-color-info` hue at L 0.85 C 0.07 (dark L 0.5 C 0.08). Defaults to the shared `--cngx-feedback-info-border`.|
|`--cngx-alert-info-icon`|`oklch(0.6 0.11 240)`|Variant / Info|Icon color of the info severity. Derives from `--cngx-color-info`, 90% into the text colour. Defaults to the shared `--cngx-feedback-info-icon`.|
|`--cngx-alert-success-bg`|`oklch(0.96 0.04 145)`|Variant / Success|Background tint of the success severity. Derives from `--cngx-color-success` hue at L 0.96 C 0.04 (dark L 0.3 C 0.06). Defaults to the shared `--cngx-feedback-success-bg`.|
|`--cngx-alert-success-border`|`oklch(0.85 0.1 145)`|Variant / Success|Border color of the success severity. Derives from `--cngx-color-success` hue at L 0.85 C 0.1 (dark L 0.5 C 0.1). Defaults to the shared `--cngx-feedback-success-border`.|
|`--cngx-alert-success-icon`|`oklch(0.56 0.135 145)`|Variant / Success|Icon color of the success severity. Derives from `--cngx-color-success`, 90% into the text colour. Defaults to the shared `--cngx-feedback-success-icon`.|
|`--cngx-alert-warning-bg`|`oklch(0.97 0.04 75)`|Variant / Warning|Background tint of the warning severity. Derives from `--cngx-color-warning` hue at L 0.97 C 0.04 (dark L 0.32 C 0.06). Defaults to the shared `--cngx-feedback-warning-bg`.|
|`--cngx-alert-warning-border`|`oklch(0.86 0.1 75)`|Variant / Warning|Border color of the warning severity. Derives from `--cngx-color-warning` hue at L 0.86 C 0.1 (dark L 0.55 C 0.1). Defaults to the shared `--cngx-feedback-warning-border`.|
|`--cngx-alert-warning-icon`|`oklch(0.67 0.135 75)`|Variant / Warning|Icon color of the warning severity. Derives from `--cngx-color-warning`, 90% into the text colour. Defaults to the shared `--cngx-feedback-warning-icon`.|
|`--cngx-alert-error-bg`|`oklch(0.96 0.025 25)`|Variant / Error|Background tint of the error severity. Derives from `--cngx-color-danger` hue at L 0.96 C 0.025 (dark L 0.3 C 0.05). Defaults to the shared `--cngx-feedback-error-bg`.|
|`--cngx-alert-error-border`|`oklch(0.85 0.08 25)`|Variant / Error|Border color of the error severity. Derives from `--cngx-color-danger` hue at L 0.85 C 0.08 (dark L 0.5 C 0.1). Defaults to the shared `--cngx-feedback-error-border`.|
|`--cngx-alert-error-icon`|`oklch(0.56 0.16 25)`|Variant / Error|Icon color of the error severity. Derives from `--cngx-color-danger`, 90% into the text colour. Defaults to the shared `--cngx-feedback-error-icon`.|
|`--cngx-alert-icon-color`|`currentColor`|Surface|Icon color override - defaults to `currentColor` and is pinned by each severity rule.|
|`--cngx-alert-icon-size`|`20px`|Layout|Default icon size when no custom icon is projected.|
|`--cngx-alert-title-weight`|`600`|Typography|Font-weight of the title slot.|
|`--cngx-alert-title-gap`|`4px`|Layout|Gap between the title and the body text.|
|`--cngx-alert-collapse-duration`|`200ms`|Motion|Duration of the collapsed-state grid-row transition. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-alert-collapsed-hover-bg`|`oklch(0 0 0 / 0.02)`|State / Collapsed|Background tint applied on hover of a collapsed alert.|
|`--cngx-alert-actions-gap`|`8px`|Layout|Gap above the actions slot.|
|`--cngx-alert-action-bg`|`transparent`|State / Action|Background of the projected action button. Defaults to transparent so the severity tint shows through; consumers can pin a filled accent.|
|`--cngx-alert-action-radius`|`4px`|State / Action|Corner radius of the projected action button.|
|`--cngx-alert-action-padding`|`4px 10px`|State / Action|Padding shorthand of the projected action button.|
|`--cngx-alert-action-font-size`|`0.875rem`|State / Action|Font-size of the projected action button label.|
|`--cngx-alert-action-font-weight`|`600`|State / Action|Font-weight of the projected action button label.|
|`--cngx-alert-action-color`|`color-mix(in oklab, var(--cngx-alert-icon-color) 60%, var(--cngx-color-text))`|State / Action|Label and border color of the projected action button. Unset by default, so the use site derives it from the severity accent mixed 60% into the text color: the pure accent misses 4.5:1 on the light tint. Pin it to `--cngx-alert-icon-color` to paint the action in the pure accent again (the Material bridge does).|
|`--cngx-alert-action-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Action|Background tint applied on hover of the projected action button.|
|`--cngx-alert-enter-duration`|`200ms`|Motion|Duration of the enter animation. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-alert-exit-duration`|`150ms`|Motion|Duration of the exit animation. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-alert-icon-pulse-duration`|`300ms`|Motion|Duration of the icon-pulse animation that fires on enter.|
|`--cngx-alert-enter-offset`|`8px`|Motion|Vertical offset the alert translates from while entering.|
|`--cngx-alert-exit-offset`|`8px`|Motion|Vertical offset the alert translates to while exiting.|

## CngxAlertStack

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-feedback-info-bg`|`oklch(from var(--cngx-color-info, oklch(0.65 0.12 240)) 0.96 0.025 h)`|Severity|Background tint of info alerts and banners.|
|`--cngx-feedback-info-border`|`oklch(
      from var(--cngx-color-info, oklch(0.65 0.12 240)) 0.85 0.07 h
    )`|Severity|Border colour of info alerts and banners.|
|`--cngx-feedback-info-icon`|`color-mix(
      in oklab,
      var(--cngx-color-info, oklch(0.65 0.12 240)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the info severity icon in alerts and banners, and the info toast accent.|
|`--cngx-feedback-success-bg`|`oklch(
      from var(--cngx-color-success, oklch(0.6 0.15 145)) 0.96 0.04 h
    )`|Severity|Background tint of success alerts and banners.|
|`--cngx-feedback-success-border`|`oklch(
      from var(--cngx-color-success, oklch(0.6 0.15 145)) 0.85 0.1 h
    )`|Severity|Border colour of success alerts and banners.|
|`--cngx-feedback-success-icon`|`color-mix(
      in oklab,
      var(--cngx-color-success, oklch(0.6 0.15 145)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the success severity icon in alerts and banners, and the success toast accent.|
|`--cngx-feedback-warning-bg`|`oklch(
      from var(--cngx-color-warning, oklch(0.72 0.15 75)) 0.97 0.04 h
    )`|Severity|Background tint of warning alerts and banners.|
|`--cngx-feedback-warning-border`|`oklch(
      from var(--cngx-color-warning, oklch(0.72 0.15 75)) 0.86 0.1 h
    )`|Severity|Border colour of warning alerts and banners.|
|`--cngx-feedback-warning-icon`|`color-mix(
      in oklab,
      var(--cngx-color-warning, oklch(0.72 0.15 75)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the warning severity icon in alerts and banners, and the warning toast accent.|
|`--cngx-feedback-error-bg`|`oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.96 0.025 h)`|Severity|Background tint of error alerts and banners.|
|`--cngx-feedback-error-border`|`oklch(
      from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.85 0.08 h
    )`|Severity|Border colour of error alerts and banners.|
|`--cngx-feedback-error-icon`|`color-mix(
      in oklab,
      var(--cngx-color-danger, oklch(0.6 0.18 25)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the error severity icon in alerts and banners, and the error toast accent.|
|`--cngx-alert-stack-gap`|`8px`|Layout|Vertical gap between stacked alert items.|
|`--cngx-alert-stack-reserve-height`|`56px`|Layout|Minimum block-size reserved for the stack so layout doesn't shift when alerts mount / dismount.|
|`--cngx-alert-stack-message-size`|`0.875rem`|Typography|Font-size of the per-item message text.|
|`--cngx-alert-stack-message-line-height`|`1.5`|Typography|Line-height of the per-item message text.|
|`--cngx-alert-stack-overflow-bg`|`transparent`|State / Overflow|Background of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-border`|`oklch(0.85 0.005 250)`|State / Overflow|Border color of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-padding`|`8px 16px`|State / Overflow|Padding shorthand of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-size`|`0.8125rem`|State / Overflow|Font-size of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-color`|`oklch(0.5 0.01 250)`|State / Overflow|Text color of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-hover-bg`|`oklch(0.96 0.005 250)`|State / Overflow|Background tint on hover of the "show more" overflow button.|

## CngxAsyncClick

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-async-transition`|`0.2s ease`|Motion|Transition shorthand for the background-color / color / border-color / opacity changes between async states. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-async-pending-opacity`|`0.7`|State / Pending|Opacity applied while `cngxAsyncClick` reports `pending`. Combined with `cursor: wait` on the same state. Not applied to `.cngx-button` hosts, which show their own busy treatment.|
|`--cngx-async-success-bg`|``|State / Success|Background tint after a successful async commit. Unset by default: 12% `--cngx-color-success`. Not read on `.cngx-button` hosts.|
|`--cngx-async-success-color`|``|State / Success|Text color after a successful async commit. Unset by default: `--cngx-color-success` mixed 75% toward `--cngx-color-text`, so it reads as text in both schemes. Not read on `.cngx-button` hosts.|
|`--cngx-async-success-border`|``|State / Success|Border color after a successful async commit. Unset by default: `--cngx-color-success`. Not read on `.cngx-button` hosts.|
|`--cngx-async-error-bg`|``|State / Error|Background tint after a failed async commit. Unset by default: 12% `--cngx-color-danger`. Not read on `.cngx-button` hosts.|
|`--cngx-async-error-color`|``|State / Error|Text color after a failed async commit. Unset by default: `--cngx-color-danger-text`. Not read on `.cngx-button` hosts.|
|`--cngx-async-error-border`|``|State / Error|Border color after a failed async commit. Unset by default: `--cngx-color-danger`. Not read on `.cngx-button` hosts.|

## CngxAsyncContainer

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-async-container-refresh-z`|`5`|Layout|Stacking-context order of the refresh indicator overlay. Defaults to 5 so it sits above the content stream but below dialog / popover surfaces.|

## CngxAvatar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-avatar-size`|`2.5rem`|Layout|Active size of the avatar - consumed by the `:scope` rule and pinned by the size-variant classes.|
|`--cngx-avatar-font-size`|`1rem`|Typography|Active font-size of the initials block. Scaled in step with `--cngx-avatar-size` by the size-variant classes.|
|`--cngx-avatar-bg`|`oklch(0.92 0.01 240)`|Surface|Background of the avatar plate. Defaults to the foundation border tone so an avatar without an image still reads as a neutral surface.|
|`--cngx-avatar-color`|`oklch(0.28 0 0)`|Surface|Text color of the initials block.|
|`--cngx-avatar-circle-radius`|`999px`|Variant / Shape|Corner radius applied by `.cngx-avatar--circle` (pill default).|
|`--cngx-avatar-square-radius`|`6px`|Variant / Shape|Corner radius applied by `.cngx-avatar--square`.|
|`--cngx-avatar-size-xs`|`1.5rem`|Variant / Size|Size token for the `.cngx-avatar--xs` variant.|
|`--cngx-avatar-size-sm`|`2rem`|Variant / Size|Size token for the `.cngx-avatar--sm` variant.|
|`--cngx-avatar-size-md`|`2.5rem`|Variant / Size|Size token for the `.cngx-avatar--md` variant (default).|
|`--cngx-avatar-size-lg`|`3rem`|Variant / Size|Size token for the `.cngx-avatar--lg` variant.|
|`--cngx-avatar-size-xl`|`4rem`|Variant / Size|Size token for the `.cngx-avatar--xl` variant.|
|`--cngx-avatar-font-size-xs`|`0.625rem`|Variant / Size|Font-size token for the `.cngx-avatar--xs` initials.|
|`--cngx-avatar-font-size-sm`|`0.75rem`|Variant / Size|Font-size token for the `.cngx-avatar--sm` initials.|
|`--cngx-avatar-font-size-md`|`1rem`|Variant / Size|Font-size token for the `.cngx-avatar--md` initials (default).|
|`--cngx-avatar-font-size-lg`|`1.125rem`|Variant / Size|Font-size token for the `.cngx-avatar--lg` initials.|
|`--cngx-avatar-font-size-xl`|`1.5rem`|Variant / Size|Font-size token for the `.cngx-avatar--xl` initials.|
|`--cngx-avatar-status-size`|`0.65em`|State / Status|Diameter of the status dot, expressed in `em` so it scales with the avatar's font-size.|
|`--cngx-avatar-status-border`|`oklch(1 0 0)`|State / Status|Ring color around the status dot - defaults to the surface color so the dot reads as cut out of the avatar.|
|`--cngx-avatar-status-bg`|`oklch(0.68 0.01 240)`|State / Status|Fallback background of the status dot when no state modifier is applied.|
|`--cngx-avatar-status-online`|`oklch(0.68 0.18 145)`|State / Status|Dot color for the `.cngx-avatar__status--online` modifier.|
|`--cngx-avatar-status-offline`|`oklch(0.68 0.01 240)`|State / Status|Dot color for the `.cngx-avatar__status--offline` modifier.|
|`--cngx-avatar-status-busy`|`oklch(0.62 0.22 25)`|State / Status|Dot color for the `.cngx-avatar__status--busy` modifier.|
|`--cngx-avatar-status-away`|`oklch(0.72 0.18 70)`|State / Status|Dot color for the `.cngx-avatar__status--away` modifier.|

## CngxAvatarGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-avatar-group-pill-size`|`1.5rem`|Layout|Inline and block size of the `+N` overflow pill. Each size preset sets it to match the avatars.|
|`--cngx-avatar-group-overlap`|`-0.375rem`|Layout|Inline-start margin of every avatar after the first and of the overflow pill. A negative value stacks the discs under their predecessor.|
|`--cngx-avatar-group-pill-font-size`|`0.625rem`|Typography|Font size of the `+N` count in the overflow pill.|

## CngxBackdrop

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-backdrop-bg`|`oklch(0 0 0 / 0.5)`|Surface|Background of the overlay scrim. Defaults to a 50% black wash so content beneath stays legible but visually muted.|
|`--cngx-backdrop-transition-duration`|`200ms`|Motion|Duration of the opacity fade between hidden and visible states. Falls back to `--cngx-duration-base`. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|

## CngxBadge

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-badge-size`|`16px`|Layout|Diameter (and minimum width) of the indicator pill in text mode.|
|`--cngx-badge-dot-size`|`8px`|Variant / Dot|Diameter of the indicator in `--dot` mode (no text).|
|`--cngx-badge-padding-inline`|`3px`|Layout|Inline padding around the badge text. Capped at 3px so a single-digit count fits within the 16px min-width and renders as a true circle; multi-character content widens the pill naturally.|
|`--cngx-badge-radius`|`999px`|Layout|Corner radius. Defaults to the pill radius via `--cngx-radius-pill`.|
|`--cngx-badge-inline-gap`|`0.375rem`|Layout / Inline|Gap between the host content and the indicator in the `inline` position variant. Has no effect on corner anchors.|
|`--cngx-badge-font-size`|`0.6875rem`|Typography|Font-size of the badge text.|
|`--cngx-badge-font-weight`|`600`|Typography|Font-weight of the badge text.|
|`--cngx-badge-border`|`0`|Surface|Ring around the badge. Defaults to `0` so the indicator reads as a solid pill that sits flush on its host (the dot variant in particular would shrink to a single visible pixel under a 2px ring). Set a non-zero border at consumer level when the badge needs to cut out from a busy host surface - e.g. `--cngx-badge-border: 2px solid var(--mat-sys-surface)`. Only applied in the corner variants (`above-*` / `below-*`); the `inline` variant is borderless either way. `inherits: true` so a single `:root` override reaches every indicator span at once.|
|`--cngx-badge-primary-bg`|`oklch(0.66 0.19 50)`|Variant / Primary|Background of the primary variant. Falls back to `--cngx-color-primary`.|
|`--cngx-badge-primary-color`|`oklch(1 0 0)`|Variant / Primary|Text color of the primary variant.|
|`--cngx-badge-error-bg`|`oklch(0.62 0.22 25)`|Variant / Error|Background of the error variant. Falls back to `--cngx-color-danger`.|
|`--cngx-badge-error-color`|`oklch(1 0 0)`|Variant / Error|Text color of the error variant.|
|`--cngx-badge-warning-bg`|`oklch(0.65 0.2 70)`|Variant / Warning|Background of the warning variant. Falls back to `--cngx-color-warning`.|
|`--cngx-badge-warning-color`|`oklch(0.2 0.01 250)`|Variant / Warning|Text color of the warning variant.|
|`--cngx-badge-neutral-bg`|`oklch(0.68 0.01 240)`|Variant / Neutral|Background of the neutral variant.|
|`--cngx-badge-neutral-color`|`oklch(1 0 0)`|Variant / Neutral|Text color of the neutral variant.|

## CngxBannerOutlet

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-feedback-info-bg`|`oklch(from var(--cngx-color-info, oklch(0.65 0.12 240)) 0.96 0.025 h)`|Severity|Background tint of info alerts and banners.|
|`--cngx-feedback-info-border`|`oklch(
      from var(--cngx-color-info, oklch(0.65 0.12 240)) 0.85 0.07 h
    )`|Severity|Border colour of info alerts and banners.|
|`--cngx-feedback-info-icon`|`color-mix(
      in oklab,
      var(--cngx-color-info, oklch(0.65 0.12 240)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the info severity icon in alerts and banners, and the info toast accent.|
|`--cngx-feedback-success-bg`|`oklch(
      from var(--cngx-color-success, oklch(0.6 0.15 145)) 0.96 0.04 h
    )`|Severity|Background tint of success alerts and banners.|
|`--cngx-feedback-success-border`|`oklch(
      from var(--cngx-color-success, oklch(0.6 0.15 145)) 0.85 0.1 h
    )`|Severity|Border colour of success alerts and banners.|
|`--cngx-feedback-success-icon`|`color-mix(
      in oklab,
      var(--cngx-color-success, oklch(0.6 0.15 145)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the success severity icon in alerts and banners, and the success toast accent.|
|`--cngx-feedback-warning-bg`|`oklch(
      from var(--cngx-color-warning, oklch(0.72 0.15 75)) 0.97 0.04 h
    )`|Severity|Background tint of warning alerts and banners.|
|`--cngx-feedback-warning-border`|`oklch(
      from var(--cngx-color-warning, oklch(0.72 0.15 75)) 0.86 0.1 h
    )`|Severity|Border colour of warning alerts and banners.|
|`--cngx-feedback-warning-icon`|`color-mix(
      in oklab,
      var(--cngx-color-warning, oklch(0.72 0.15 75)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the warning severity icon in alerts and banners, and the warning toast accent.|
|`--cngx-feedback-error-bg`|`oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.96 0.025 h)`|Severity|Background tint of error alerts and banners.|
|`--cngx-feedback-error-border`|`oklch(
      from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.85 0.08 h
    )`|Severity|Border colour of error alerts and banners.|
|`--cngx-feedback-error-icon`|`color-mix(
      in oklab,
      var(--cngx-color-danger, oklch(0.6 0.18 25)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the error severity icon in alerts and banners, and the error toast accent.|
|`--cngx-banner-z-index`|`900`|Layout|Stacking-context order - sticky-top banner sits below modal surfaces but above page content.|
|`--cngx-banner-gap`|`12px`|Layout|Gap between icon, body, action, and dismiss slots.|
|`--cngx-banner-padding`|`10px 16px`|Layout|Padding shorthand inside each banner.|
|`--cngx-banner-bg`|`oklch(0.98 0.005 250)`|Surface|Background - neutral by default; severity rules override.|
|`--cngx-banner-color`|`currentColor`|Surface|Text color - defaults to `currentColor`.|
|`--cngx-banner-border-color`|`transparent`|Surface|Border color - neutral by default; severity rules override.|
|`--cngx-banner-enter-duration`|`200ms`|Motion|Duration of the slide-down enter animation. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-banner-enter-offset`|`100%`|Motion|Vertical offset the banner translates from while entering.|
|`--cngx-banner-info-bg`|`oklch(0.96 0.025 240)`|Variant / Info|Background tint of the info severity. Derives from `--cngx-color-info` hue at L 0.96 C 0.025 (dark L 0.3 C 0.05). Defaults to the shared `--cngx-feedback-info-bg`.|
|`--cngx-banner-info-border`|`oklch(0.85 0.07 240)`|Variant / Info|Border color of the info severity. Derives from `--cngx-color-info` hue at L 0.85 C 0.07 (dark L 0.5 C 0.08). Defaults to the shared `--cngx-feedback-info-border`.|
|`--cngx-banner-info-icon`|`oklch(0.6 0.11 240)`|Variant / Info|Icon color of the info severity. Derives from `--cngx-color-info`, 90% into the text colour. Defaults to the shared `--cngx-feedback-info-icon`.|
|`--cngx-banner-success-bg`|`oklch(0.96 0.04 145)`|Variant / Success|Background tint of the success severity. Derives from `--cngx-color-success` hue at L 0.96 C 0.04 (dark L 0.3 C 0.06). Defaults to the shared `--cngx-feedback-success-bg`.|
|`--cngx-banner-success-border`|`oklch(0.85 0.1 145)`|Variant / Success|Border color of the success severity. Derives from `--cngx-color-success` hue at L 0.85 C 0.1 (dark L 0.5 C 0.1). Defaults to the shared `--cngx-feedback-success-border`.|
|`--cngx-banner-success-icon`|`oklch(0.56 0.135 145)`|Variant / Success|Icon color of the success severity. Derives from `--cngx-color-success`, 90% into the text colour. Defaults to the shared `--cngx-feedback-success-icon`.|
|`--cngx-banner-warning-bg`|`oklch(0.97 0.04 75)`|Variant / Warning|Background tint of the warning severity. Derives from `--cngx-color-warning` hue at L 0.97 C 0.04 (dark L 0.32 C 0.06). Defaults to the shared `--cngx-feedback-warning-bg`.|
|`--cngx-banner-warning-border`|`oklch(0.86 0.1 75)`|Variant / Warning|Border color of the warning severity. Derives from `--cngx-color-warning` hue at L 0.86 C 0.1 (dark L 0.55 C 0.1). Defaults to the shared `--cngx-feedback-warning-border`.|
|`--cngx-banner-warning-icon`|`oklch(0.67 0.135 75)`|Variant / Warning|Icon color of the warning severity. Derives from `--cngx-color-warning`, 90% into the text colour. Defaults to the shared `--cngx-feedback-warning-icon`.|
|`--cngx-banner-error-bg`|`oklch(0.96 0.025 25)`|Variant / Error|Background tint of the error severity. Derives from `--cngx-color-danger` hue at L 0.96 C 0.025 (dark L 0.3 C 0.05). Defaults to the shared `--cngx-feedback-error-bg`.|
|`--cngx-banner-error-border`|`oklch(0.85 0.08 25)`|Variant / Error|Border color of the error severity. Derives from `--cngx-color-danger` hue at L 0.85 C 0.08 (dark L 0.5 C 0.1). Defaults to the shared `--cngx-feedback-error-border`.|
|`--cngx-banner-error-icon`|`oklch(0.56 0.16 25)`|Variant / Error|Icon color of the error severity. Derives from `--cngx-color-danger`, 90% into the text colour. Defaults to the shared `--cngx-feedback-error-icon`.|
|`--cngx-banner-icon-color`|`currentColor`|Surface|Icon color override - defaults to `currentColor` and is pinned by each severity rule.|
|`--cngx-banner-accent`|`currentColor`|Surface|Severity accent the action button color derives from (see `--cngx-banner-action-color`). Pinned by each severity rule.|
|`--cngx-banner-icon-size`|`20px`|Layout|Default icon size when no custom icon is projected.|
|`--cngx-banner-font-size`|`0.9375rem`|Typography|Font-size of the body message.|
|`--cngx-banner-line-height`|`1.5`|Typography|Line-height of the body message.|
|`--cngx-banner-error-font-size`|`0.875rem`|State / Error|Font-size of the inline-error sub-line.|
|`--cngx-banner-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of the inline-error sub-line. Falls back to `--cngx-color-danger-text` (the raw danger is a fill colour and sits under 4.5:1 as text on the light tints).|
|`--cngx-banner-action-bg`|`transparent`|State / Action|Background of the action button.|
|`--cngx-banner-action-radius`|`4px`|State / Action|Corner radius of the action button.|
|`--cngx-banner-action-padding`|`4px 10px`|State / Action|Padding shorthand of the action button.|
|`--cngx-banner-action-font-size`|`0.875rem`|State / Action|Font-size of the action button label.|
|`--cngx-banner-action-font-weight`|`600`|State / Action|Font-weight of the action button label.|
|`--cngx-banner-action-color`|`color-mix(in oklab, var(--cngx-banner-accent) 60%, var(--cngx-color-text))`|State / Action|Label and border color of the action button. Unset by default, so the use site derives it from `--cngx-banner-accent` mixed 60% into the text color: the pure accent misses 4.5:1 on the light tint. Pin it to `--cngx-banner-accent` to paint the action in the pure accent again (the Material bridge does).|
|`--cngx-banner-action-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Action|Background tint applied on hover of the action button.|
|`--cngx-banner-pending-opacity`|`0.85`|State / Pending|Opacity multiplier applied while the banner is pending.|

## CngxBottomSheet

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-bottom-sheet-radius`|`16px 16px 0 0`|Layout|Corner radius of the sheet. Defaults to rounded top corners only, matching the bottom-anchored anatomy.|
|`--cngx-bottom-sheet-padding`|`24px`|Layout|Padding shorthand inside the sheet.|
|`--cngx-bottom-sheet-max-width`|`100%`|Layout|Maximum inline size - full viewport by default.|
|`--cngx-bottom-sheet-max-height`|`80vh`|Layout|Maximum block size - 80vh by default so the dismiss gesture has room above the sheet.|
|`--cngx-bottom-sheet-handle-width`|`40px`|Layout|Width of the drag handle pill.|
|`--cngx-bottom-sheet-handle-height`|`4px`|Layout|Height of the drag handle pill.|
|`--cngx-bottom-sheet-handle-color`|`oklch(0.8 0.005 250)`|Surface|Color of the drag handle pill. `inherits: true` so the :root cascade reaches the `::before` pseudo on the open dialog.|
|`--cngx-bottom-sheet-handle-radius`|`2px`|Layout|Corner radius of the drag handle pill.|
|`--cngx-bottom-sheet-handle-margin`|`0 auto 16px`|Layout|Margin shorthand around the drag handle - centres it horizontally and pushes the sheet content down.|

## CngxBreadcrumb

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-breadcrumb-gap`|`8px`|Trail|Gap between crumbs and separators.|
|`--cngx-breadcrumb-separator-color`|`oklch(0.6 0.01 250)`|Separator|Separator colour. Delegated at `:root` to the dark-aware foundation token `--cngx-color-text-muted` so the separator mutes in step with the link and terminal colours; the literal `initial-value` is only the last-resort fallback (CSS forbids a `var()` in `@property` `initial-value`).|

## CngxBreadcrumbBar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-breadcrumb-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Gap between the crumbs and separators in the list.|
|`--cngx-breadcrumb-separator`|`'\2039'`|Skin|Separator glyph rendered by the chevron-delimited skins (header, chips, iconlabel, icononly, shell, record). Swapped to the left-pointing chevron under RTL.|
|`--cngx-breadcrumb-max-visible`|`2`|Layout|Crumb cap the bar reads back from its own container. Registered `<integer>` so a malformed consumer override falls back to the initial value rather than reaching TypeScript as a `NaN`. `inherits: false` because the property is written on `.cngx-breadcrumb::after` and read back from the same pseudo-element - it is a channel between the container query and the component, never a theme token, so it must not reach the crumbs. The consequence a consumer has to know: **an override must target `::after` too.** Setting `--cngx-breadcrumb-max-visible` on the host (or any ancestor) has no effect, because a non-inheriting property does not reach the pseudo-element that the read actually resolves against.|
|`--cngx-breadcrumb-plain-link-decoration`|`none`|Skin|Link text-decoration under the `plain` skin (retints the shared link-decoration leaf token).|
|`--cngx-breadcrumb-contained-padding`|`0.375rem 0.75rem`|Skin|Inline padding of the `contained` list surface.|
|`--cngx-breadcrumb-contained-bg`|`#f4f4f5`|Skin|Surface fill of the `contained` list box (set adaptively from `--cngx-color-surface` in `:scope`).|
|`--cngx-breadcrumb-contained-border`|`1px solid`|Skin|Border width + style of the `contained` box.|
|`--cngx-breadcrumb-contained-border-color`|`#e4e4e7`|Skin|Border colour of the `contained` box (set adaptively from `--cngx-color-border` in `:scope`).|
|`--cngx-breadcrumb-contained-radius`|`0.375rem`|Skin|Corner radius of the `contained` box.|
|`--cngx-breadcrumb-pill-track-bg`|`oklch(0.97 0.005 250)`|Skin|Track fill of the segmented `pill` bar.|
|`--cngx-breadcrumb-pill-track-border`|`oklch(0.88 0.005 250)`|Skin|Track border of the segmented `pill` bar.|
|`--cngx-breadcrumb-pill-radius`|`999px`|Skin|Corner radius of the `pill` track and its segments.|
|`--cngx-breadcrumb-pill-color`|`oklch(0.5 0.01 250)`|Skin|Resting segment label colour under the `pill` skin.|
|`--cngx-breadcrumb-pill-hover-bg`|`oklch(0.95 0.03 50)`|Skin|Hover segment fill under the `pill` skin.|
|`--cngx-breadcrumb-pill-hover-color`|`oklch(0.2 0.01 250)`|Skin|Hover segment label colour under the `pill` skin.|
|`--cngx-breadcrumb-pill-active-bg`|`oklch(0.66 0.19 50)`|Skin|Active-segment fill under the `pill` skin.|
|`--cngx-breadcrumb-pill-active-color`|`oklch(0.2 0.01 250)`|Skin|Active-segment label colour under the `pill` skin.|
|`--cngx-breadcrumb-pill-font-size`|`0.875rem`|Skin|Segment font size under the `pill` skin.|
|`--cngx-breadcrumb-link-decoration`|`var(--cngx-breadcrumb-plain-link-decoration, none)`|Typography|Text decoration of the crumb links. The `plain` skin sets it from `--cngx-breadcrumb-plain-link-decoration`.|
|`--cngx-breadcrumb-ribbon-bg`|`oklch(0.97 0.005 250)`|Skin|Ribbon skin: resting fill of each chevron segment.|
|`--cngx-breadcrumb-ribbon-color`|`oklch(0.5 0.01 250)`|Skin|Ribbon skin: resting label colour of the segments.|
|`--cngx-breadcrumb-ribbon-hover-bg`|`oklch(0.95 0.03 50)`|Skin|Ribbon skin: segment fill on hover.|
|`--cngx-breadcrumb-ribbon-hover-color`|`oklch(0.2 0.01 250)`|Skin|Ribbon skin: segment label colour on hover.|
|`--cngx-breadcrumb-ribbon-active-bg`|`oklch(0.66 0.19 50)`|Skin|Ribbon skin: fill of the current-page segment.|
|`--cngx-breadcrumb-ribbon-active-color`|`oklch(0.2 0.01 250)`|Skin|Ribbon skin: label colour of the current-page segment.|
|`--cngx-breadcrumb-ribbon-font-size`|`0.875rem`|Skin|Ribbon skin: font size of the segment labels.|
|`--cngx-breadcrumb-ribbon-radius`|`4px`|Skin|Ribbon skin: corner radius of the flat outer edge of the first segment.|
|`--cngx-breadcrumb-ribbon-notch`|`12px`|Skin|Ribbon skin: depth of the chevron arrow cut into each segment. The RTL mirror reads the same value.|
|`--cngx-breadcrumb-editorial-accent`|`oklch(0.66 0.19 50)`|Skin|Editorial skin: start colour of the gradient underline that wipes in on hover.|
|`--cngx-breadcrumb-editorial-text`|`oklch(0.2 0.01 250)`|Skin|Editorial skin: link text colour, also mixed into the end stop of the underline and current-page gradients.|
|`--cngx-breadcrumb-editorial-font-size`|`1rem`|Skin|Editorial skin: font size of the links and the mid-dot separator.|
|`--cngx-breadcrumb-header-color`|`oklch(0.5 0.01 250)`|Skin|Header skin: resting colour of the ancestor links.|
|`--cngx-breadcrumb-header-hover-bg`|`oklch(0.97 0.005 250)`|Skin|Header skin: link background on hover.|
|`--cngx-breadcrumb-header-text`|`oklch(0.2 0.01 250)`|Skin|Header skin: link colour on hover and colour of the current-page title.|
|`--cngx-breadcrumb-header-font-size`|`0.875rem`|Skin|Header skin: font size of the ancestor links and the chevron separator.|
|`--cngx-breadcrumb-header-leaf-font-size`|`1.125rem`|Skin|Header skin: font size of the current-page crumb, which wraps to its own row as the page title.|
|`--cngx-breadcrumb-header-radius`|`4px`|Skin|Header skin: corner radius of the links.|
|`--cngx-breadcrumb-metro-accent`|`oklch(0.66 0.19 50)`|Skin|Metro skin: border of the station dots, plus the dot fill and halo on the current page.|
|`--cngx-breadcrumb-metro-surface`|`oklch(1 0 0)`|Skin|Metro skin: resting fill of the station dots.|
|`--cngx-breadcrumb-metro-hover-dot`|`oklch(0.95 0.03 50)`|Skin|Metro skin: station dot fill on hover.|
|`--cngx-breadcrumb-metro-color`|`oklch(0.5 0.01 250)`|Skin|Metro skin: resting link label colour.|
|`--cngx-breadcrumb-metro-active-color`|`oklch(0.2 0.01 250)`|Skin|Metro skin: link label colour on hover and on the current page.|
|`--cngx-breadcrumb-metro-rail`|`oklch(0.8 0.06 50)`|Skin|Metro skin: colour of the rail that replaces the separator between stations.|
|`--cngx-breadcrumb-metro-font-size`|`0.875rem`|Skin|Metro skin: font size of the link labels.|
|`--cngx-breadcrumb-toolbar-bg`|`oklch(1 0 0)`|Skin|Toolbar skin: fill of the toolbar strip.|
|`--cngx-breadcrumb-toolbar-border-strong`|`oklch(0.78 0.01 250)`|Skin|Toolbar skin: outer border colour of the strip.|
|`--cngx-breadcrumb-toolbar-cell-border`|`oklch(0.88 0.005 250)`|Skin|Toolbar skin: colour of the divider between cells.|
|`--cngx-breadcrumb-toolbar-color`|`oklch(0.5 0.01 250)`|Skin|Toolbar skin: resting cell label colour.|
|`--cngx-breadcrumb-toolbar-hover-bg`|`oklch(0.97 0.005 250)`|Skin|Toolbar skin: cell fill on hover.|
|`--cngx-breadcrumb-toolbar-hover-color`|`oklch(0.2 0.01 250)`|Skin|Toolbar skin: cell label colour on hover.|
|`--cngx-breadcrumb-toolbar-active-bg`|`oklch(0.95 0.03 50)`|Skin|Toolbar skin: fill of the current-page cell.|
|`--cngx-breadcrumb-toolbar-active-color`|`oklch(0.54 0.19 50)`|Skin|Toolbar skin: label colour of the current-page cell.|
|`--cngx-breadcrumb-toolbar-font-size`|`0.875rem`|Skin|Toolbar skin: font size of the cell labels.|
|`--cngx-breadcrumb-toolbar-radius`|`4px`|Skin|Toolbar skin: corner radius of the strip.|
|`--cngx-breadcrumb-chips-bg`|`oklch(1 0 0)`|Skin|Chips skin: resting chip fill.|
|`--cngx-breadcrumb-chips-border`|`oklch(0.88 0.005 250)`|Skin|Chips skin: resting chip border colour.|
|`--cngx-breadcrumb-chips-color`|`oklch(0.5 0.01 250)`|Skin|Chips skin: resting chip label colour.|
|`--cngx-breadcrumb-chips-hover-border`|`oklch(0.78 0.01 250)`|Skin|Chips skin: chip border colour on hover.|
|`--cngx-breadcrumb-chips-hover-bg`|`oklch(0.97 0.005 250)`|Skin|Chips skin: chip fill on hover.|
|`--cngx-breadcrumb-chips-hover-color`|`oklch(0.2 0.01 250)`|Skin|Chips skin: chip label colour on hover.|
|`--cngx-breadcrumb-chips-active-bg`|`oklch(0.95 0.03 50)`|Skin|Chips skin: fill of the current-page chip.|
|`--cngx-breadcrumb-chips-active-border`|`oklch(0.82 0.08 50)`|Skin|Chips skin: border colour of the current-page chip.|
|`--cngx-breadcrumb-chips-active-color`|`oklch(0.54 0.19 50)`|Skin|Chips skin: label colour of the current-page chip.|
|`--cngx-breadcrumb-chips-font-size`|`0.875rem`|Skin|Chips skin: font size of the chip labels and the chevron separator.|
|`--cngx-breadcrumb-chips-radius`|`999px`|Skin|Chips skin: corner radius of the chips.|
|`--cngx-breadcrumb-path-track-bg`|`oklch(0.97 0.005 250)`|Skin|Path skin: fill of the track behind the crumbs.|
|`--cngx-breadcrumb-path-track-border`|`oklch(0.88 0.005 250)`|Skin|Path skin: border colour of the track.|
|`--cngx-breadcrumb-path-color`|`oklch(0.5 0.01 250)`|Skin|Path skin: resting link colour.|
|`--cngx-breadcrumb-path-hover-bg`|`oklch(1 0 0)`|Skin|Path skin: link background on hover.|
|`--cngx-breadcrumb-path-hover-color`|`oklch(0.2 0.01 250)`|Skin|Path skin: link colour on hover.|
|`--cngx-breadcrumb-path-active-color`|`oklch(0.54 0.19 50)`|Skin|Path skin: colour of the current-page link.|
|`--cngx-breadcrumb-path-sep-color`|`oklch(0.5 0.01 250)`|Skin|Path skin: separator colour.|
|`--cngx-breadcrumb-path-radius`|`8px`|Skin|Path skin: corner radius of the track.|
|`--cngx-breadcrumb-path-link-radius`|`4px`|Skin|Path skin: corner radius of each link.|
|`--cngx-breadcrumb-path-font-size`|`0.875rem`|Skin|Path skin: font size of the links.|
|`--cngx-breadcrumb-iconlabel-color`|`oklch(0.5 0.01 250)`|Skin|Iconlabel skin: resting crumb colour; the leading icon inherits it.|
|`--cngx-breadcrumb-iconlabel-hover-bg`|`oklch(0.97 0.005 250)`|Skin|Iconlabel skin: link background on hover.|
|`--cngx-breadcrumb-iconlabel-hover-color`|`oklch(0.2 0.01 250)`|Skin|Iconlabel skin: link colour on hover.|
|`--cngx-breadcrumb-iconlabel-active-bg`|`oklch(0.95 0.03 50)`|Skin|Iconlabel skin: background of the current-page link.|
|`--cngx-breadcrumb-iconlabel-active-color`|`oklch(0.54 0.19 50)`|Skin|Iconlabel skin: label and icon colour of the current-page crumb.|
|`--cngx-breadcrumb-iconlabel-radius`|`999px`|Skin|Iconlabel skin: corner radius of the links.|
|`--cngx-breadcrumb-iconlabel-font-size`|`0.875rem`|Skin|Iconlabel skin: font size of the link labels and the chevron separator.|
|`--cngx-breadcrumb-icononly-color`|`oklch(0.5 0.01 250)`|Skin|Icononly skin: resting colour of the icon squares.|
|`--cngx-breadcrumb-icononly-hover-bg`|`oklch(0.97 0.005 250)`|Skin|Icononly skin: icon square background on hover.|
|`--cngx-breadcrumb-icononly-hover-color`|`oklch(0.2 0.01 250)`|Skin|Icononly skin: icon square colour on hover.|
|`--cngx-breadcrumb-icononly-active-bg`|`oklch(0.66 0.19 50)`|Skin|Icononly skin: fill of the current-page icon square.|
|`--cngx-breadcrumb-icononly-active-color`|`oklch(0.2 0.01 250)`|Skin|Icononly skin: icon colour of the current-page square.|
|`--cngx-breadcrumb-icononly-tip-bg`|`oklch(0.2 0.01 250)`|Skin|Icononly skin: background of the label tooltip shown on hover and focus.|
|`--cngx-breadcrumb-icononly-tip-color`|`oklch(1 0 0)`|Skin|Icononly skin: text colour of the label tooltip.|
|`--cngx-breadcrumb-icononly-radius`|`4px`|Skin|Icononly skin: corner radius of the icon squares and the tooltip.|
|`--cngx-breadcrumb-icononly-font-size`|`0.875rem`|Skin|Icononly skin: font size of the chevron separator.|
|`--cngx-breadcrumb-shell-color`|`oklch(0.5 0.01 250)`|Skin|Shell skin: resting link colour.|
|`--cngx-breadcrumb-shell-hover-bg`|`oklch(0.97 0.005 250)`|Skin|Shell skin: link background on hover.|
|`--cngx-breadcrumb-shell-text`|`oklch(0.2 0.01 250)`|Skin|Shell skin: link colour on hover, on the current page and on the root product crumb.|
|`--cngx-breadcrumb-shell-mark-bg`|`oklch(0.66 0.19 50)`|Skin|Shell skin: fill of the root product mark.|
|`--cngx-breadcrumb-shell-mark-color`|`oklch(1 0 0)`|Skin|Shell skin: text colour of the root product mark.|
|`--cngx-breadcrumb-shell-font-size`|`0.875rem`|Skin|Shell skin: font size of the links and the chevron separator.|
|`--cngx-breadcrumb-shell-radius`|`4px`|Skin|Shell skin: corner radius of the links.|
|`--cngx-breadcrumb-record-color`|`oklch(0.5 0.01 250)`|Skin|Record skin: resting link colour.|
|`--cngx-breadcrumb-record-hover-bg`|`oklch(0.97 0.005 250)`|Skin|Record skin: link background on hover.|
|`--cngx-breadcrumb-record-text`|`oklch(0.2 0.01 250)`|Skin|Record skin: link colour on hover and on the current page.|
|`--cngx-breadcrumb-record-chip-bg`|`oklch(1 0 0)`|Skin|Record skin: fill of the record chip that wraps the terminal crumb.|
|`--cngx-breadcrumb-record-chip-border`|`oklch(0.78 0.01 250)`|Skin|Record skin: border colour of the record chip.|
|`--cngx-breadcrumb-record-status`|`oklch(0.7 0.17 145)`|Skin|Record skin: colour of the status dot, its halo and the status label.|
|`--cngx-breadcrumb-record-font-size`|`0.875rem`|Skin|Record skin: font size of the links and the chevron separator.|
|`--cngx-breadcrumb-record-radius`|`4px`|Skin|Record skin: corner radius of the links.|
|`--cngx-breadcrumb-record-chip-radius`|`999px`|Skin|Record skin: corner radius of the record chip.|

## CngxBreadcrumbItem

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-breadcrumb-gap`|`8px`|Trail|Gap between crumbs and separators.|
|`--cngx-breadcrumb-separator-color`|`oklch(0.6 0.01 250)`|Separator|Separator colour. Delegated at `:root` to the dark-aware foundation token `--cngx-color-text-muted` so the separator mutes in step with the link and terminal colours; the literal `initial-value` is only the last-resort fallback (CSS forbids a `var()` in `@property` `initial-value`).|

## CngxBreadcrumbOverflow

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-breadcrumb-overflow-menu-padding`|`var(--cngx-space-xs, 0.25rem) 0`|Layout|Block and inline padding of the overflow menu list.|
|`--cngx-breadcrumb-overflow-item-padding`|`var(--cngx-space-sm, 0.5em) var(--cngx-space-sm, 0.6em)`|Layout|Padding of each collapsed-crumb row in the overflow menu.|

## CngxBreadcrumbSeparator

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-breadcrumb-gap`|`8px`|Trail|Gap between crumbs and separators.|
|`--cngx-breadcrumb-separator-color`|`oklch(0.6 0.01 250)`|Separator|Separator colour. Delegated at `:root` to the dark-aware foundation token `--cngx-color-text-muted` so the separator mutes in step with the link and terminal colours; the literal `initial-value` is only the last-resort fallback (CSS forbids a `var()` in `@property` `initial-value`).|

## CngxBreadcrumbSiblings

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-breadcrumb-siblings-menu-padding`|`var(--cngx-space-xs, 0.25rem) 0`|Layout|Block and inline padding of the sibling menu list.|
|`--cngx-breadcrumb-siblings-item-padding`|`var(--cngx-space-sm, 0.45em) var(--cngx-space-sm, 0.55em)`|Layout|Padding of each sibling row in the dropdown.|

## CngxBullet

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back through the consumer-facing `--accent` and then to the foundation `--cngx-color-primary` (Ember).|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame. Registered with `inherits: true` deliberately: with `inherits: false` a value set on `:root` or any container resets to the initial value at every element boundary and never reaches the chart host, silently no-opping the documented consumer override.|
|`--cngx-chart-numeric-bidi`|`isolate`|Typography|`unicode-bidi` of every numeric chart label (axis ticks, legend, threshold and band labels). Set to `normal` to opt out of isolation.|
|`--cngx-bullet-actual-color`|`var(--cngx-chart-primary, currentColor)`|Surface|Colour of the actual-value bar.|
|`--cngx-bullet-target-color`|`var(--cngx-chart-text-color, currentColor)`|Surface|Colour of the target marker.|

## CngxButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-padding-block`|`0.5rem`|Layout|Block padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-padding-inline`|`1rem`|Layout|Inline padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-gap`|`0.5rem`|Layout|Gap between the slots and the label.|
|`--cngx-button-font-size`|`1rem`|Typography|Font size. `md` reads the form-control font so the button shares the control line box.|
|`--cngx-button-radius`|`0.5rem`|Layout|Corner radius.|
|`--cngx-button-border-width`|`1px`|Layout|Border width on all four sides; transparent where the variant paints none, so every variant shares one box.|
|`--cngx-button-transition`|`150ms`|Motion|Transition duration for colour changes. Derives from the `--cngx-duration-fast` rung of the motion scale.|
|`--cngx-button-tone`|`currentColor`|Tone|Tone colour: the outline border, the hover wash, and the solid fill unless `--cngx-button-tone-fill` is set.|
|`--cngx-button-tone-text`|`currentColor`|Tone|Text colour on a transparent or tonal surface.|
|`--cngx-button-on-tone`|`Canvas`|Tone|Text colour on the solid tone fill.|
|`--cngx-button-tone-fill`|``|Tone|Solid fill colour. Set by the primary and danger tones to the strong palette rung their on-colour clears 4.5:1 against; unset, the solid fill falls back to `--cngx-button-tone`. Outline, secondary, ghost and link keep painting from `--cngx-button-tone`. Registered without an initial value so the fallback stays live.|
|`--cngx-button-spinner-size`|`1em`|Busy|Diameter of the busy spinner ring, and the box of a bare `svg` or `img` drawn by a `provideButtonSpinner` component.|
|`--cngx-button-spinner-thickness`|`2px`|Busy|Stroke width of the busy spinner ring. Inherits so a value set on the button reaches the ring inside the busy layer.|
|`--cngx-button-hover-shade`|`oklch(0 0 0)`|Tone|Colour a solid button's tone mixes towards on hover and press (by `--cngx-button-hover-layer` / `--cngx-button-pressed-layer`), so the fill darkens without a second tone token.|
|`--cngx-button-link-hover-thickness`|`2px`|Tone|Underline thickness of a `link` button on hover; at rest it keeps the font's own underline.|
|`--cngx-button-icon-size`|`1.25em`|Layout|Edge length of an `svg` or `img` in a start or end slot. Same rung as `--cngx-icon-size-md`, so a projected `cngx-icon` and a bare `svg` match. Inherits so a value set on the button reaches the slot glyph.|
|`--cngx-button-neutral-tint`|`5%`|Tone|Tint strength of a neutral `secondary` fill and its hover. Light text on a dark surface reads a small tint as almost nothing, so the dark scheme steps both up.|
|`--cngx-button-neutral-tint-hover`|`9%`|Tone|Hover tint strength of a neutral `secondary` fill.|
|`--cngx-button-hover-layer`|`12%`|State / Hover|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill on hover, a state layer. A theme maps it to its hover state-layer opacity (the Material bridge: `--mat-sys-hover-state-layer-opacity`).|
|`--cngx-button-pressed-layer`|`20%`|State / Pressed|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill while pressed, one step above `--cngx-button-hover-layer`. A theme maps it to its pressed state-layer opacity (the Material bridge: `--mat-sys-pressed-state-layer-opacity`).|
|`--cngx-button-pressed-wash`|`12%`|State / Pressed|Tone wash of a pressed `outline` or `ghost` button (hover takes 8%).|
|`--cngx-button-neutral-tint-pressed`|`13%`|State / Pressed|Pressed tint strength of a neutral `secondary` fill, one step above `--cngx-button-neutral-tint-hover`; the dark scheme steps it up.|
|`--cngx-button-secondary-bg-pressed`|``|State / Pressed|Pressed fill of a `secondary` button. Unset by default, so the pressed tone mix paints; a theme sets it next to `--cngx-button-secondary-bg-hover`.|
|`--cngx-button-secondary-bg`|``|Tone|Fill of a `secondary` button. Unset by default, so the fill is the tone mixed into transparency (the neutral tint for `neutral`, 12% otherwise). A theme sets it to paint a container colour instead (the Material bridge maps it to the `*-container` roles).|
|`--cngx-button-secondary-bg-hover`|``|Tone|Hover fill of a `secondary` button. Unset by default, so hover steps the tone mix up.|
|`--cngx-button-secondary-color`|``|Tone|Text colour of a `secondary` button. Unset by default, so the tone text colour paints.|

## CngxButtonGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-group-gap`|`0.5rem`|Layout|Space between the sub-groups of a group of groups. Floored to `--cngx-target-gap` at the use site.|
|`--cngx-button-group-addon-padding-inline`|`1rem`|Layout|Inline padding of an addon segment.|
|`--cngx-button-group-addon-media-size`|`24px`|Layout|Largest block size of a media child of an addon (`img`, `svg`, `cngx-icon`, `cngx-avatar`, ...). SET to `1lh` on the addon; registered as a length so `1lh` resolves against the addon's line box, not the child's, and the children inherit that pixel value. The initial value is the md label line and only shows where `lh` is unsupported.|
|`--cngx-button-group-radius`|`0.5rem`|Layout|Radius of the two outer ends. Inherits, so a value set on the group reaches the segments that read it.|

## CngxButtonMultiToggleGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-toggle-group-gap`|`0`|Layout|Gap between toggle children. Zero by default so the buttons read as a segmented control.|
|`--cngx-button-toggle-group-radius`|`0.375rem`|Layout|Corner radius of the group container. Defaults to `--cngx-radius-md`.|

## CngxButtonToggle

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-toggle-padding-block`|`0.4rem`|||
|`--cngx-button-toggle-padding-inline`|`0.875rem`|||

## CngxButtonToggleGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-toggle-group-gap`|`0`|Layout|Gap between toggle children. Zero by default so the buttons read as a segmented control.|
|`--cngx-button-toggle-group-radius`|`0.375rem`|Layout|Corner radius of the group container. Defaults to `--cngx-radius-md`.|

## CngxCard

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-card-radius`|`12px`|Layout|Corner radius. Defaults to `--cngx-radius-lg`.|
|`--cngx-card-bg`|`oklch(1 0 0)`|Surface|Card surface color. Falls back through `--cngx-color-surface`.|
|`--cngx-card-color`|`oklch(0.2 0.01 290)`|Surface|Card text color. Falls back through `--cngx-color-text`.|
|`--cngx-card-border`|`1px solid oklch(0.81 0.005 250)`|Surface|Border shorthand. Falls back through `--cngx-color-border`.|
|`--cngx-card-min-width`|`120px`|Layout|Minimum inline size of the card so empty cards still read as a surface.|
|`--cngx-card-hover-shadow`|`0 2px 8px 0 oklch(0 0 0 / 0.12)`|State / Hover|Drop-shadow applied on hover for `.cngx-card--interactive`.|
|`--cngx-card-active-opacity`|`0.88`|State / Active|Opacity multiplier applied on touch-active. Only fires under `(hover: none)` so it doesn't compete with the hover shadow.|
|`--cngx-card-focus-width`|`2px`|State / Focus|Focus-ring width.|
|`--cngx-card-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-card-focus-color`|`oklch(0.66 0.19 50)`|State / Focus|Focus-ring color. Falls back to `--cngx-color-primary`.|
|`--cngx-card-selected-border`|`oklch(0.66 0.19 50)`|State / Selected|Border color of the selected state and the inset selection bar. Falls back to `--cngx-color-primary`.|
|`--cngx-card-selected-bg`|`oklch(0.96 0.04 50)`|State / Selected|Background of the selected state. The runtime fallback uses `color-mix()` against `--cngx-color-primary`, so this static default only matters when a theme pins the token explicitly.|
|`--cngx-card-selected-bar-width`|`3px`|State / Selected|Width of the inset selection bar drawn via `::before` - provides a non-color-only selection signal (WCAG 1.4.1).|
|`--cngx-card-loading-shimmer`|`oklch(1 0 0 / 0.4)`|State / Loading|Shimmer band color for the loading overlay gradient.|
|`--cngx-card-loading-overlay`|`oklch(1 0 0 / 0.3)`|State / Loading|Static overlay shown when `prefers-reduced-motion` suppresses the shimmer animation.|
|`--cngx-card-title-size`|`1rem`|Typography|Font-size of the title slot.|
|`--cngx-card-title-weight`|`600`|Typography|Font-weight of the title slot.|
|`--cngx-card-title-color`|`oklch(0.2 0.01 290)`|Typography|Text color of the title slot.|
|`--cngx-card-subtitle-size`|`0.8125rem`|Typography|Font-size of the subtitle slot.|
|`--cngx-card-subtitle-weight`|`400`|Typography|Font-weight of the subtitle slot.|
|`--cngx-card-subtitle-color`|`oklch(0.36 0.02 290)`|Typography|Text color of the subtitle slot - muted by default.|
|`--cngx-card-divider`|`oklch(0.81 0.005 250)`|Surface|Border color of the actions divider.|
|`--cngx-card-accent-width`|`3px`|Variant / Accent|Width of the top accent stripe applied by `.cngx-card--accent`.|
|`--cngx-card-accent-color`|`transparent`|Variant / Accent|Color of the top accent stripe. Per-variant rules set it to the matching foundation semantic color.|
|`--cngx-card-accent-info-bg`|`oklch(0.97 0.03 250)`|Variant / Accent|Tinted background for `.cngx-card--accent-info`. The runtime fallback uses `color-mix()` against `--cngx-color-info`; this static default only matters when a theme pins the token directly.|
|`--cngx-card-accent-success-bg`|`oklch(0.97 0.04 145)`|Variant / Accent|Tinted background for `.cngx-card--accent-success`.|
|`--cngx-card-accent-warning-bg`|`oklch(0.97 0.04 75)`|Variant / Accent|Tinted background for `.cngx-card--accent-warning`.|
|`--cngx-card-accent-danger-bg`|`oklch(0.97 0.03 25)`|Variant / Accent|Tinted background for `.cngx-card--accent-danger`.|
|`--cngx-card-badge-offset`|`-6px`|Layout|Offset of the badge slot from the card corners (negative pulls the badge half-out so it overlaps the edge).|
|`--cngx-card-badge-size-sm`|`10px`|Sizing|Diameter (and minimum width) of the badge pill at the `sm` size. Also drives the `:empty` status-dot fallback regardless of the `size` input.|
|`--cngx-card-badge-size-md`|`22px`|Sizing|Diameter (and minimum width) of the badge pill at the `md` size.|
|`--cngx-card-badge-size-lg`|`28px`|Sizing|Diameter (and minimum width) of the badge pill at the `lg` size.|
|`--cngx-card-badge-padding-inline`|`5px`|Sizing|Inline padding around content-bearing badges. Zeroed by the `:empty` dot fallback.|
|`--cngx-card-badge-font-size-sm`|`0.625rem`|Sizing|Font-size at the `sm` size.|
|`--cngx-card-badge-font-size-md`|`0.7rem`|Sizing|Font-size at the `md` size.|
|`--cngx-card-badge-font-size-lg`|`0.8125rem`|Sizing|Font-size at the `lg` size.|
|`--cngx-card-badge-radius`|`999px`|Sizing|Corner radius. Defaults to the pill radius via `--cngx-radius-pill` so the surface reads as a round indicator across all three sizes.|
|`--cngx-card-badge-border`|`2px solid oklch(1 0 0)`|Surface|Ring around the badge - contrasts the pill against the card surface so the corner anchor reads as a separate element. The `:root` dark-mode override swaps the colour; `inherits: true` so the swap reaches the host element through the cascade.|
|`--cngx-card-badge-primary-bg`|`oklch(0.66 0.19 50)`|Variant / Primary|Background of the `primary` intent. Falls back through `--cngx-badge-primary-bg` then `--cngx-color-primary`.|
|`--cngx-card-badge-primary-color`|`oklch(1 0 0)`|Variant / Primary|Text colour of the `primary` intent.|
|`--cngx-card-badge-danger-bg`|`oklch(0.62 0.22 25)`|Variant / Danger|Background of the `danger` intent. Falls back through `--cngx-badge-error-bg` then `--cngx-color-danger`.|
|`--cngx-card-badge-danger-color`|`oklch(1 0 0)`|Variant / Danger|Text colour of the `danger` intent.|
|`--cngx-card-badge-warning-bg`|`oklch(0.72 0.18 70)`|Variant / Warning|Background of the `warning` intent. Falls back through `--cngx-badge-warning-bg` then `--cngx-color-warning`.|
|`--cngx-card-badge-warning-color`|`oklch(0.2 0.01 250)`|Variant / Warning|Text colour of the `warning` intent.|
|`--cngx-card-badge-success-bg`|`oklch(0.6 0.15 145)`|Variant / Success|Background of the `success` intent. No `CngxBadge` analogue - falls straight back to `--cngx-color-success`.|
|`--cngx-card-badge-success-color`|`oklch(1 0 0)`|Variant / Success|Text colour of the `success` intent.|
|`--cngx-card-badge-neutral-bg`|`oklch(0.68 0.01 240)`|Variant / Neutral|Background of the `neutral` intent. Falls back through `--cngx-badge-neutral-bg` then `--cngx-color-text-muted`.|
|`--cngx-card-badge-neutral-color`|`oklch(1 0 0)`|Variant / Neutral|Text colour of the `neutral` intent.|

## CngxCardGrid

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-card-grid-min`|`280px`|Layout|Minimum inline size of a single grid cell - `auto-fill` packs as many cells as fit before reflowing.|
|`--cngx-card-grid-gap`|`16px`|Layout|Gap between grid cells. Density modifiers re-pin this and the nested `--cngx-card-padding`.|

## CngxCardSkeleton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-skeleton-gap`|`10px`|Layout|Vertical gap between the skeleton's child blocks.|
|`--cngx-skeleton-bg`|`oklch(0.88 0.005 250)`|Surface|Base color of the shimmer gradient.|
|`--cngx-skeleton-shimmer`|`oklch(0.96 0.005 250)`|Surface|Highlight color of the shimmer gradient.|
|`--cngx-skeleton-media-height`|`120px`|Layout|Height of the media placeholder block.|
|`--cngx-skeleton-title-height`|`1.25rem`|Layout|Height of the title placeholder bar.|
|`--cngx-skeleton-line-height`|`0.875rem`|Layout|Height of each text-line placeholder bar.|

## CngxCardTimestamp

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-card-timestamp-gap`|`4px`|Layout|Gap between the prefix slot and the date.|
|`--cngx-card-timestamp-size`|`0.75rem`|Typography|Font-size of the timestamp text.|
|`--cngx-card-timestamp-color`|`oklch(0.36 0.02 290)`|Typography|Text color - muted by default.|
|`--cngx-card-timestamp-prefix-weight`|`400`|Typography|Font-weight of the prefix slot.|

## CngxCharCount

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-char-count-font-size`|`0.75rem`|Typography|Font-size of the counter text. Falls back through `--cngx-font-size-sm`. `syntax: '*'` because `@property`'s `<length>` initial-value forbids `rem`.|
|`--cngx-field-char-count-color`|`oklch(0.45 0 0)`|Surface|Text color while under the limit. Falls back through `--cngx-field-hint-color`.|
|`--cngx-field-char-count-over-color`|`oklch(0.6 0.18 25)`|State / Over|Text color once the count exceeds the limit. Falls back through `--cngx-field-error-color` and then `--cngx-color-danger`.|

## CngxChart

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back through the consumer-facing `--accent` and then to the foundation `--cngx-color-primary` (Ember).|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame. Registered with `inherits: true` deliberately: with `inherits: false` a value set on `:root` or any container resets to the initial value at every element boundary and never reaches the chart host, silently no-opping the documented consumer override.|
|`--cngx-chart-numeric-bidi`|`isolate`|Typography|`unicode-bidi` of every numeric chart label (axis ticks, legend, threshold and band labels). Set to `normal` to opt out of isolation.|

## CngxChartPanel

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-panel-gap`|`var(--cngx-space-md, 1rem)`|Layout|Gap between the header, chart body, legend and footer.|
|`--cngx-chart-panel-header-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Gap between the title block and the actions in the header.|
|`--cngx-chart-panel-heading-gap`|`calc(var(--cngx-space-xs, 0.25rem) / 2)`|Layout|Gap between the title and the subtitle.|
|`--cngx-chart-panel-padding`|`var(--cngx-space-md, 1rem)`|Layout|Padding of the panel.|
|`--cngx-chart-panel-footer-gap`|`var(--cngx-space-xs, 0.25rem)`|Layout|Gap between items in the footer and in the actions row.|

## CngxCheckbox

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-checkbox-gap`|`0.5rem`|Layout|Gap between the indicator and the label slot. Falls back to `--cngx-space-sm`.|
|`--cngx-checkbox-sibling-gap`|`1rem`|Layout|Horizontal spacing between adjacent inline `<cngx-checkbox>` siblings. Override with `0` if the consumer wraps siblings in its own flex/grid container.|
|`--cngx-checkbox-focus-outline`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand applied via `outline` on the host.|
|`--cngx-checkbox-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-checkbox-focus-radius`|`0.25rem`|State / Focus|Corner radius applied while focused - keeps the ring rounded around the inline shell.|

## CngxCheckboxGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-checkbox-group-gap`|`0.5rem`|Layout|Gap between checkbox children. Falls back to `--cngx-space-sm`.|

## CngxCheckboxIndicator

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-checkbox-size`|`1em`|Layout|Active size of the indicator box. `inherits: true` is load-bearing - the inner `__box` is a child of the host, and the size-variant classes (`--sm` / `--md` / `--lg`) set this token on the host. With `inherits: false` the child would only see the registered initial value and the size variants would render with a constant-sized box inside a variable-sized host frame.|
|`--cngx-checkbox-color`|`currentColor`|Surface|Text color of the inner glyph in the bare `checkmark` variant. Defaults to `currentColor`.|
|`--cngx-checkbox-bg`|`transparent`|Surface|Background of the unchecked box. Inherited so a host-level override reaches the `__box` child that consumes it.|
|`--cngx-checkbox-border`|`1.5px solid currentColor`|Surface|Border shorthand of the unchecked box. Width + style + color in one declaration so a consumer can re-skin the stroke with a single override. Inherited so a host-level override reaches the `__box` child that consumes it.|
|`--cngx-checkbox-radius`|`2px`|Layout|Corner radius of the box. Defaults to `--cngx-radius-sm`. Inherited so a host-level override reaches the `__box` child that consumes it.|
|`--cngx-checkbox-checked-bg`|`oklch(0.66 0.19 50)`|State / Checked|Background of the box when checked or indeterminate. Falls back to `--cngx-color-primary`.|
|`--cngx-checkbox-checked-color`|`oklch(1 0 0)`|State / Checked|Glyph color inside the checked/indeterminate box.|
|`--cngx-checkbox-size-sm`|`0.875em`|Variant / Size|Size token for the `.cngx-checkbox-indicator--sm` variant. The check and dash glyph never drop below `--cngx-icon-svg-micro-floor` (12px), which fits a box from 14px up; for a smaller box set that token to `0px` as well, so the glyph shrinks with the box.|
|`--cngx-checkbox-size-md`|`1em`|Variant / Size|Size token for the `.cngx-checkbox-indicator--md` variant (default).|
|`--cngx-checkbox-size-lg`|`1.25em`|Variant / Size|Size token for the `.cngx-checkbox-indicator--lg` variant.|
|`--cngx-checkbox-glyph-stroke-width`|`3`|Glyph|Stroke width of the check and dash glyphs, in grid units of their 24x24 viewBox. Heavier than the icon default so the glyph stays legible at checkbox size.|

## CngxChip

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chip-inner-gap`|`4px`|Layout|Gap between the chip's internal slots (prefix / label / remove). Falls back to `--cngx-space-xs`.|
|`--cngx-chip-padding-block`|`2px`|Layout|Block-axis padding of the pill.|
|`--cngx-chip-padding-inline`|`8px`|Layout|Inline-axis padding of the pill.|
|`--cngx-chip-radius`|`999px`|Layout|Corner radius. Defaults to a full pill via `--cngx-radius-pill`.|
|`--cngx-chip-bg`|`oklch(0.66 0.19 50 / 0.12)`|Surface|Background of the default (unkeyed) chip. Primary-tinted at low alpha so the chip reads as accented without competing with stronger surfaces.|
|`--cngx-chip-color`|`currentColor`|Surface|Text color. Defaults to `currentColor` so the chip inherits the container's text color.|
|`--cngx-chip-border`|`0 solid transparent`|Surface|Border shorthand. Zero-width by default - pillows fill the box.|
|`--cngx-chip-font-size`|``|Typography|Font-size of the chip label.|
|`--cngx-chip-transition`|`background-color 150ms ease,
      color 150ms ease,
      border-color 150ms ease`|Motion|Transition shorthand for background / color / border-color changes on hover, selected, and disabled states. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-chip-hover-bg`|`oklch(0.66 0.19 50 / 0.2)`|State / Hover|Background of the hover state for interactive chips (`[role=button]`, `[tabindex]`, or a chip with a remove button).|
|`--cngx-chip-hover-color`|`currentColor`|State / Hover|Text color of the hover state.|
|`--cngx-chip-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring shorthand applied via `outline` on `:focus-visible`. Defaults to the brand primary so the ring contrasts with the chip's own tinted fill (selected or unkeyed) instead of inheriting `currentColor`, which would render the ring in the text color and read as a generic dark border on top of the orange fill.|
|`--cngx-chip-focus-outline-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-chip-selected-bg`|`oklch(0.66 0.19 50 / 0.32)`|State / Selected|Background of the selected state (`[aria-selected=true]` / `[aria-pressed=true]`).|
|`--cngx-chip-selected-color`|`currentColor`|State / Selected|Text color of the selected state.|
|`--cngx-chip-info-bg`|`oklch(0.65 0.12 240 / 0.16)`|Variant / Info|Background of the `[data-color=info]` variant.|
|`--cngx-chip-info-color`|`oklch(0.45 0.12 240)`|Variant / Info|Text color of the `[data-color=info]` variant.|
|`--cngx-chip-success-bg`|`oklch(0.65 0.15 145 / 0.16)`|Variant / Success|Background of the `[data-color=success]` variant.|
|`--cngx-chip-success-color`|`oklch(0.45 0.15 145)`|Variant / Success|Text color of the `[data-color=success]` variant.|
|`--cngx-chip-warning-bg`|`oklch(0.72 0.15 75 / 0.18)`|Variant / Warning|Background of the `[data-color=warning]` variant.|
|`--cngx-chip-warning-color`|`oklch(0.5 0.15 75)`|Variant / Warning|Text color of the `[data-color=warning]` variant.|
|`--cngx-chip-danger-bg`|`oklch(0.65 0.22 25 / 0.18)`|Variant / Danger|Background of the `[data-color=danger]` variant.|
|`--cngx-chip-danger-color`|`oklch(0.5 0.2 25)`|Variant / Danger|Text color of the `[data-color=danger]` variant.|
|`--cngx-chip-remove-radius`|`999px`|State / Remove|Corner radius of the inline remove button. Fully round by default, so the hover tint and focus ring circle the X inside the pill.|
|`--cngx-chip-remove-focus-width`|`2px`|State / Remove|Focus-ring width of the inline remove button.|
|`--cngx-chip-remove-focus-color`|`oklch(0.66 0.19 50)`|State / Remove|Focus-ring color of the inline remove button. Falls back to `--cngx-color-primary`.|
|`--cngx-chip-remove-focus-offset`|`-3px`|State / Remove|Focus-ring offset of the inline remove button. Negative by default: the button keeps its 24px hit area, and the ring circles the X inside it instead of tracing the whole target.|

## CngxChipGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chip-group-gap`|`0.5rem`|Layout|Gap between chip children. Falls back to `--cngx-space-sm`.|

## CngxCloseButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-padding-block`|`0.5rem`|Layout|Block padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-padding-inline`|`1rem`|Layout|Inline padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-gap`|`0.5rem`|Layout|Gap between the slots and the label.|
|`--cngx-button-font-size`|`1rem`|Typography|Font size. `md` reads the form-control font so the button shares the control line box.|
|`--cngx-button-radius`|`0.5rem`|Layout|Corner radius.|
|`--cngx-button-border-width`|`1px`|Layout|Border width on all four sides; transparent where the variant paints none, so every variant shares one box.|
|`--cngx-button-transition`|`150ms`|Motion|Transition duration for colour changes. Derives from the `--cngx-duration-fast` rung of the motion scale.|
|`--cngx-button-tone`|`currentColor`|Tone|Tone colour: the outline border, the hover wash, and the solid fill unless `--cngx-button-tone-fill` is set.|
|`--cngx-button-tone-text`|`currentColor`|Tone|Text colour on a transparent or tonal surface.|
|`--cngx-button-on-tone`|`Canvas`|Tone|Text colour on the solid tone fill.|
|`--cngx-button-tone-fill`|``|Tone|Solid fill colour. Set by the primary and danger tones to the strong palette rung their on-colour clears 4.5:1 against; unset, the solid fill falls back to `--cngx-button-tone`. Outline, secondary, ghost and link keep painting from `--cngx-button-tone`. Registered without an initial value so the fallback stays live.|
|`--cngx-button-spinner-size`|`1em`|Busy|Diameter of the busy spinner ring, and the box of a bare `svg` or `img` drawn by a `provideButtonSpinner` component.|
|`--cngx-button-spinner-thickness`|`2px`|Busy|Stroke width of the busy spinner ring. Inherits so a value set on the button reaches the ring inside the busy layer.|
|`--cngx-button-hover-shade`|`oklch(0 0 0)`|Tone|Colour a solid button's tone mixes towards on hover and press (by `--cngx-button-hover-layer` / `--cngx-button-pressed-layer`), so the fill darkens without a second tone token.|
|`--cngx-button-link-hover-thickness`|`2px`|Tone|Underline thickness of a `link` button on hover; at rest it keeps the font's own underline.|
|`--cngx-button-icon-size`|`1.25em`|Layout|Edge length of an `svg` or `img` in a start or end slot. Same rung as `--cngx-icon-size-md`, so a projected `cngx-icon` and a bare `svg` match. Inherits so a value set on the button reaches the slot glyph.|
|`--cngx-button-neutral-tint`|`5%`|Tone|Tint strength of a neutral `secondary` fill and its hover. Light text on a dark surface reads a small tint as almost nothing, so the dark scheme steps both up.|
|`--cngx-button-neutral-tint-hover`|`9%`|Tone|Hover tint strength of a neutral `secondary` fill.|
|`--cngx-button-hover-layer`|`12%`|State / Hover|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill on hover, a state layer. A theme maps it to its hover state-layer opacity (the Material bridge: `--mat-sys-hover-state-layer-opacity`).|
|`--cngx-button-pressed-layer`|`20%`|State / Pressed|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill while pressed, one step above `--cngx-button-hover-layer`. A theme maps it to its pressed state-layer opacity (the Material bridge: `--mat-sys-pressed-state-layer-opacity`).|
|`--cngx-button-pressed-wash`|`12%`|State / Pressed|Tone wash of a pressed `outline` or `ghost` button (hover takes 8%).|
|`--cngx-button-neutral-tint-pressed`|`13%`|State / Pressed|Pressed tint strength of a neutral `secondary` fill, one step above `--cngx-button-neutral-tint-hover`; the dark scheme steps it up.|
|`--cngx-button-secondary-bg-pressed`|``|State / Pressed|Pressed fill of a `secondary` button. Unset by default, so the pressed tone mix paints; a theme sets it next to `--cngx-button-secondary-bg-hover`.|
|`--cngx-button-secondary-bg`|``|Tone|Fill of a `secondary` button. Unset by default, so the fill is the tone mixed into transparency (the neutral tint for `neutral`, 12% otherwise). A theme sets it to paint a container colour instead (the Material bridge maps it to the `*-container` roles).|
|`--cngx-button-secondary-bg-hover`|``|Tone|Hover fill of a `secondary` button. Unset by default, so hover steps the tone mix up.|
|`--cngx-button-secondary-color`|``|Tone|Text colour of a `secondary` button. Unset by default, so the tone text colour paints.|
|`--cngx-close-button-color`|`currentColor`|Surface|Resting glyph colour of a neutral close button. Defaults to `--cngx-color-text-muted` (set below); hover and focus lift the glyph to the tone text colour.|
|`--cngx-close-button-size`|``|Layout|Edge length of the square box. Unset by default, so the box follows the icon-button row of the `size` input (density and text scale included).|
|`--cngx-close-button-icon-size`|``|Layout|Edge length of an `svg` or `img` glyph, projected or drawn by a `provideButtonCloseIcon` component. Unset by default (`1.25em` of the button font). Inherits so a value set on the button reaches the glyph.|
|`--cngx-close-button-radius`|``|Layout|Corner radius. Defaults to `--cngx-radius-sm`.|
|`--cngx-close-button-hover-bg`|``|State / Hover|Hover background. Unset by default, so the ghost variant's tone wash paints.|
|`--cngx-close-button-pressed-bg`|``|State / Pressed|Pressed background. Unset by default, so the ghost variant's pressed tone wash paints.|

## CngxCombobox

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel host (anchor-positioned, may sit outside the normal DOM flow).|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through `--cngx-color-surface`.|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value `currentColor` lets the panel inherit text color from its ancestor by default. Registering as `<color>` would forbid `currentColor` since `<color>` requires a computationally- independent value.|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the floating panel host.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-action-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the separator between the action region and the options: on the block-start side of a bottom action, the block-end side of a top action. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel. Set it to `none` to drop the separator.|
|`--cngx-select-action-padding`|`0.25rem`|Layout|Space between the action separator and the action content.|
|`--cngx-select-action-margin`|`0.25rem`|Layout|Space between the options and the action separator.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven, so dense rows stay compact) and composes into the touch-target floor via `max()`. A `0px` rather than `auto` default is deliberate: `auto` cannot be an argument to `max()`, and the floor needs to compose the row height against `--cngx-target-min`.|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a low-alpha tint of `--cngx-color-primary` so the highlight reads as brand-accented without competing with selection state.|
|`--cngx-select-option-active-indicator`|`oklch(0.5 0.2 275)`|State|Colour of the inline-start indicator bar on the keyboard-active row. The background tint alone is ~1.1:1 against the panel; this opaque bar carries the active affordance at >= 3:1. Delegates to the primary colour below, so it follows the scheme and a re-theme.|
|`--cngx-select-option-multi-selected-bg`|`transparent`|State / Selected|Background of a selected row in a multi-value panel whose selection indicator renders. Transparent by default: the checkbox carries the selection, so a mostly-selected panel does not turn into a solid block. Assign a colour to opt the fill back in. Single-value panels and rows with the indicator hidden keep `--cngx-option-selected-bg`.|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through `--cngx-color-primary`.|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant. Muted by default to mirror the placeholder token; the Material bridge maps it to `--mat-sys-on-surface-variant`. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks the same muted default as the caret so both trigger affordances read uniformly. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-caret-size`|`1.6em`|Layout|Font-size of the dropdown caret glyph shared across every variant. Read at the caret span (a trigger descendant), so `inherits: true` is load-bearing: with `inherits: false` the registered initial would always win at the caret and no consumer or composing organism could ever set the token (the inherits:false trap). The default glyph box never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a caret smaller than the 12px micro box.|
|`--cngx-select-clear-target-min`|`24px`|Layout|Fine-pointer hit-area floor of the clear button, on both axes. The 24px default meets WCAG 2.5.8 (AA); under the touch floor the larger `--cngx-target-min` wins. The trigger row keeps its height: the box hands back what it adds over the control line box. `inherits: true` so a trigger-level or ancestor override reaches the button.|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-skeleton-shimmer`|`oklch(0.2 0.01 250)`|State / Loading|Base colour the skeleton shimmer gradient is mixed from. Defaults from the foundation text colour, so the shimmer darkens a light panel and lightens a dark one in every scheme (OS, a `data-color-scheme` island, or a consumer light theme under OS dark) without a hardcoded dark-mode swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-option-spinner-track`|`oklch(0 0 0 / 0.15)`|State / Commit|Track (resting ring) colour of the per-option commit spinner. Defaults from the foundation text colour at a low alpha, so it reads on the panel in every scheme without a dark swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true` so the :root dark-mode override (alpha-on-white on dark) reaches the spinner inside the floating panel.|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to `--cngx-color-primary`.|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.46 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a reorderable chip wrap.|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-reorder-move-size`|`0.75em`|Layout|Size of the move-up / move-down glyph in the reorder list the panel shows under the touch floor: the box of the default triangles (still floored at the 0.75rem micro floor) and the font-size of a projected `*cngxMultiSelectMoveGlyph`. Read at the move button (a descendant of the select host), so `inherits: true` is load-bearing: with `inherits: false` a host-level override would never reach it.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the chip while it's being dragged.|
|`--cngx-select-chip-drag-bg`|`oklch(0.58 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Defaults track `--cngx-color-primary-strong` via the delegating entries below.|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state. Defaults track `--cngx-color-on-primary-strong`, which holds 4.5:1 on the drag background in both schemes.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to `--cngx-color-primary`.|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of every error surface. Falls back to `--cngx-color-danger`.|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a `box-shadow` so it composes with any consumer-supplied focus outline.|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-commit-error-hint-color`|`oklch(0.5 0.2 25)`|State / Commit|Text colour of the commit-error hint shown under a closed trigger. Defaults to the danger-text contrast tier so it clears 4.5:1 like the inline banner.|
|`--cngx-select-commit-error-hint-margin`|`0.25rem`|State / Commit|Block-start margin of the commit-error hint, set from the density scale.|
|`--cngx-select-reorder-list-max-block-size`|`40dvh`|Layout|Height cap of the sortable list of selected values that a reorderable select shows in its sheet under the touch floor. A longer selection scrolls inside the list, so the options below stay reachable.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|
|`--cngx-select-message-padding`|`var(--cngx-space-sm) var(--cngx-space-sm)`|Layout|Padding of the loading and empty message rows in the panel.|
|`--cngx-select-chip-fit-badge-reserve`|`5ch`|State / Overflow|Inline space a `chipOverflow: 'fit'` strip keeps free for the `+N` badge. The badge slot is exactly this wide and clips a wider badge; raise it for a projected `*cngxSelectChipOverflow` or a custom `chipOverflowBadge` formatter. Set it on the select, a container or `:root`. Never assigned by the library, so the `5ch` fallback (room for `+99`) resolves against the strip font.|
|`--cngx-combobox-min-width`|`var(--cngx-select-min-width, 12rem)`|Layout|Preferred minimum inline size of the select. A standalone or toolbar select is at least this wide; a narrower cell shrinks it, as it does an input. Falls back to `--cngx-select-min-width`; see {@link --cngx-select-min-width} for why no `initial-value` is declared.|
|`--cngx-combobox-gap`|`var(--cngx-select-gap, var(--cngx-space-xs, 0.5rem))`|Layout|Gap between the chip list, input, caret, and clear-all button. Falls back to `--cngx-select-gap`; see {@link --cngx-select-gap} for why no `initial-value` is declared.|
|`--cngx-combobox-padding`|`var(--cngx-select-padding, var(--cngx-space-sm, 0.5rem) var(--cngx-space-md, 0.75rem))`|Layout|Padding shorthand of the trigger. Falls back to `--cngx-select-padding`; see {@link --cngx-select-padding} for why no `initial-value` is declared.|
|`--cngx-combobox-border`|`var(--cngx-select-border, 1px solid var(--cngx-color-border-strong))`|Surface|Border shorthand of the trigger. Falls back to `--cngx-select-border`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-combobox-radius`|`var(--cngx-select-radius, var(--cngx-radius-md, 8px))`|Layout|Corner radius of the trigger. Falls back to `--cngx-select-radius`; see {@link --cngx-select-radius} for why no `initial-value` is declared.|
|`--cngx-combobox-bg`|`var(--cngx-select-bg, transparent)`|Surface|Background of the trigger. Falls back to `--cngx-select-bg`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-combobox-color`|`var(--cngx-select-color, inherit)`|Surface|Text color of the trigger. Falls back to `--cngx-select-color`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-combobox-min-height`|`var(--cngx-select-min-height, 2.125rem)`|Layout|Minimum block size of the trigger - fits a single row of chips. Falls back to `--cngx-select-min-height`; see {@link --cngx-select-min-height} for why no `initial-value` is declared. The touch floor still lifts the trigger to `--cngx-target-min`.|
|`--cngx-combobox-focus-outline`|`var(--cngx-select-focus-outline, 2px solid var(--cngx-color-primary))`|State / Focus|Focus-ring outline shorthand of the trigger. Falls back to `--cngx-select-focus-outline`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-combobox-input-flex-basis`|`4rem`|Layout|Flex basis of the inline input - sets the preferred starting width before the input grows or shrinks. No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback survives, and a value set on the host or an ancestor reaches the input.|
|`--cngx-combobox-input-min-width`|`4rem`|Layout|Minimum inline size of the inline input - keeps the input tappable even when chips dominate the trigger row. No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback survives, and a value set on the host or an ancestor reaches the input.|

## CngxCommandPalette

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-command-footer-gap`|`var(--cngx-space-md, 1rem)`|Layout|Gap between the keyboard legends in the footer.|
|`--cngx-command-footer-pad-y`|`var(--cngx-space-sm, 0.5rem)`|Layout|Block padding of the footer.|
|`--cngx-command-footer-pad-x`|`var(--cngx-space-md, 1rem)`|Layout|Inline padding of the footer.|
|`--cngx-command-state-pad`|`var(--cngx-space-lg, 1.5rem)`|Layout|Padding of the loading, empty and error state blocks.|

## CngxContextMenu

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-context-menu-surface`|`oklch(1 0 0)`|Surface|Popup surface background. Falls back through `--cngx-color-surface`.|
|`--cngx-context-menu-color`|`oklch(0.2 0.01 250)`|Surface|Menu text color. Falls back through `--cngx-color-text`.|
|`--cngx-context-menu-border`|`1px solid oklch(0.88 0.005 250)`|Surface|Border shorthand around the popup surface. Falls back through `--cngx-color-border`.|
|`--cngx-context-menu-radius`|`8px`|Layout|Corner radius of the popup surface.|
|`--cngx-context-menu-shadow`|`0 4px 16px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand for the popup. `inherits: true` so a `:root` override reaches the open surface. Falls back through `--cngx-shadow-md`.|
|`--cngx-context-menu-padding`|`4px`|Layout|Padding inside the popup surface (around the item stack). Derived from `--cngx-space-xs` at the host so density tracks; the registered pixel initial defeats the use-site fallback, so the `:scope` SET is the only mechanism that re-scales it.|
|`--cngx-context-menu-separator-color`|`oklch(0.88 0.005 250)`|Surface|Color of the separator hairline. Falls back through `--cngx-color-border`.|
|`--cngx-context-menu-separator-inset`|`4px`|Layout|Block margin above and below the separator hairline. Derived from `--cngx-space-xs` at the host.|

## CngxContextMenuItem

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-context-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each item row. Derived from the `--cngx-space-*` scale at the host so density tracks (the registered pixel initial defeats the use-site fallback).|
|`--cngx-context-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / kbd / caret). Derived from `--cngx-space-sm`.|
|`--cngx-context-menu-item-radius`|`4px`|Layout|Corner radius of each item row.|
|`--cngx-context-menu-item-caret-color`|`oklch(0.5 0.01 250)`|Surface|Color of the trailing submenu caret. Falls back through `--cngx-color-text-muted`.|
|`--cngx-context-menu-item-check-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading checkbox / radio indicator icon on a checked item. Falls back through `--cngx-color-primary`.|

## CngxContextMenuItemCheckbox

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-context-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each item row. Derived from the `--cngx-space-*` scale at the host so density tracks (the registered pixel initial defeats the use-site fallback).|
|`--cngx-context-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / kbd / caret). Derived from `--cngx-space-sm`.|
|`--cngx-context-menu-item-radius`|`4px`|Layout|Corner radius of each item row.|
|`--cngx-context-menu-item-caret-color`|`oklch(0.5 0.01 250)`|Surface|Color of the trailing submenu caret. Falls back through `--cngx-color-text-muted`.|
|`--cngx-context-menu-item-check-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading checkbox / radio indicator icon on a checked item. Falls back through `--cngx-color-primary`.|

## CngxContextMenuItemRadio

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-context-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each item row. Derived from the `--cngx-space-*` scale at the host so density tracks (the registered pixel initial defeats the use-site fallback).|
|`--cngx-context-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / kbd / caret). Derived from `--cngx-space-sm`.|
|`--cngx-context-menu-item-radius`|`4px`|Layout|Corner radius of each item row.|
|`--cngx-context-menu-item-caret-color`|`oklch(0.5 0.01 250)`|Surface|Color of the trailing submenu caret. Falls back through `--cngx-color-text-muted`.|
|`--cngx-context-menu-item-check-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading checkbox / radio indicator icon on a checked item. Falls back through `--cngx-color-primary`.|

## CngxCopyBlock

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-copy-block-gap`|`8px`|Layout|Gap between the content block and the copy button. Falls back to `--cngx-space-sm`.|
|`--cngx-copy-block-btn-border`|`currentColor`|Surface|Border color of the idle copy button.|
|`--cngx-copy-block-btn-bg`|`transparent`|Surface|Background of the idle copy button.|
|`--cngx-copy-block-btn-color`|`currentColor`|Surface|Text color of the idle copy button.|
|`--cngx-copy-block-btn-radius`|`4px`|Layout|Corner radius of the copy button. Defaults to `--cngx-radius-sm`.|
|`--cngx-copy-block-btn-padding`|`4px 8px`|Layout|Padding shorthand of the copy button.|
|`--cngx-copy-block-btn-font-size`|`0.75rem`|Typography|Font-size of the copy-button label. Falls back to `--cngx-font-size-sm`.|
|`--cngx-copy-block-btn-copied-bg`|`oklch(0.96 0.025 145)`|State / Copied|Background of the copied-state button - soft success tint. `inherits: true` so the :root dark-mode override reaches the button inside the copy-block host.|
|`--cngx-copy-block-btn-copied-border`|`oklch(0.5 0.12 145)`|State / Copied|Border color of the copied-state button. Falls back to `--cngx-color-success`.|
|`--cngx-copy-block-btn-copied-color`|`oklch(0.5 0.12 145)`|State / Copied|Text color of the copied-state button. Falls back to `--cngx-color-success`. `inherits: true` so the :root dark-mode override reaches the button.|

## CngxDataGridAccordion

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-dga-row-py`|`0.5rem`|Layout|Block padding of the row summary, header and footer.|
|`--cngx-dga-row-px`|`0.75rem`|Layout|Inline padding at the leading and trailing edge of the rows.|
|`--cngx-dga-region-padding`|`0.75rem 1rem`|Layout|Padding of the expanded row region.|
|`--cngx-dga-col-gap`|`0.5rem`|Layout|Gap between grid columns.|
|`--cngx-dga-border-color`|`oklch(0.88 0.005 250)`|Surface|Colour of the row dividers and the grid frame lines.|
|`--cngx-dga-row-divider`|`none`|Surface|Border below each row. Set to `none` to drop the divider.|
|`--cngx-dga-min-width`|`0px`|Skin|Minimum inline size of the grid. Below it the host scrolls sideways instead of dropping columns.|
|`--cngx-dga-fs`|`0.875rem`|Skin|Font size of the row summary cells.|
|`--cngx-dga-surface-alt`|`oklch(0.97 0.003 250)`|Skin|Alternate surface the skins paint on zebra rows, detail regions, header and footer strips.|
|`--cngx-dga-surface-strong`|`var(
      --cngx-dga-surface-strong-mat,
      color-mix(in oklab, var(--cngx-color-surface, #fff) 90%, var(--cngx-color-text, #0f1320))
    )`|Skin|Stronger alternate surface the skins paint on the column head, footer and gutter strips.|
|`--cngx-dga-lead`|`1.5rem`|Skin|Width of the leading chevron track.|
|`--cngx-dga-head-fs`|`0.75rem`|Skin|Font size of the column head.|
|`--cngx-dga-columns`|`1fr`|Grid|The shared `grid-template-columns` template. Set on the group host via `[style.--cngx-dga-columns]`; header, every row summary, and footer read it, so all three align on one contract.|
|`--cngx-dga-col-sm`|`80px`|Grid|Fixed track width for a `col="sm"` column. Named sizes mirror the `size` vocabulary of `CngxTag` / `CngxIcon` / `CngxAvatar`; the group maps `col="sm"` to `var(--cngx-dga-col-sm)` when deriving the shared template.|
|`--cngx-dga-col-md`|`112px`|Grid|Fixed track width for a `col="md"` column.|
|`--cngx-dga-col-lg`|`160px`|Grid|Fixed track width for a `col="lg"` column.|
|`--cngx-dga-max-block-size`|`none`|Grid|Opt-in maximum block size. Unset (`none`) leaves the grid content-height; a length caps it, turning the host into a vertical scrollport that pins the column head (`data-grid-accordion.component.css`). The pinned head is gated by a style query on this token, so registering a resolvable `none` initial is what makes bounded vs unbounded distinguishable to that query.|
|`--cngx-dga-head-z`|`2`|Grid|Stacking order of the pinned column head over the rows scrolling beneath it (bounded mode only).|
|`--cngx-dga-head-bg`|``|Surface|Opaque fill behind the pinned column head so scrolling rows never show through (bounded mode only). Universal syntax with NO initial-value, so the use-site fallback to the foundation surface token stays live - a fixed colour initial would defeat it (reference_property_color_initial_defeats_fallback) and render a light head in dark mode. The unskinned base reads it as the head's fill; the content skins paint `.cngx-dga-header` background directly, so this token is the base default they may override, not one they currently set.|
|`--cngx-dga-foot-z`|`2`|Grid|Stacking order of the pinned footer over the rows scrolling beneath it (bounded mode only).|
|`--cngx-dga-foot-bg`|``|Surface|Opaque fill behind the pinned footer so scrolling rows never show through (bounded mode only). Universal syntax with NO initial-value, so the use-site fallback to the foundation surface token stays live - a fixed colour initial would defeat it (reference_property_color_initial_defeats_fallback). The unskinned base reads it as the footer's fill; the content skins paint `.cngx-dga-footer` background directly, so this token is the base default they may override, not one they currently set.|
|`--cngx-dga-head-scroll-pad`|``|Grid|Optional override for the block-start scroll padding that keeps keyboard focus below the pinned column head (WCAG 2.4.11). Unset, the host uses the measured `--cngx-dga-head-block-size`. Universal syntax with NO initial-value, so an unset override falls through to the measured value; a registered initial would never be "unset", so the use-site fallback would never fire.|
|`--cngx-dga-foot-scroll-pad`|``|Grid|Optional override for the block-end scroll padding that keeps keyboard focus above the pinned footer (WCAG 2.4.11). Unset, the host uses the measured `--cngx-dga-foot-block-size`. No initial-value, for the same reason as the head pad.|
|`--cngx-dga-head-block-size`|``|Grid|Measured border-box block size of the projected column head, bound by the host from a resize observer. Host-only: `inherits: false`, so a nested headerless grid never picks up an outer grid's band and a head resize never restyles the subtree. Only the host's own `scroll-padding-block` reads it, never a descendant. No initial-value, so an unmeasured head falls back to `0px` at the use site.|
|`--cngx-dga-foot-block-size`|``|Grid|Measured border-box block size of the projected footer, the foot counterpart of `--cngx-dga-head-block-size` (host-only, no initial-value).|
|`--cngx-dga-focus-clearance`|``|Grid|Extra room the scroll padding adds beyond the pinned bands so the focus ring, which paints outside the focused element, is never clipped by a band. The use-site default `4px` is the worst case: the 2px ring of `--cngx-dga-focus-ring` plus the 2px outward offset of the sort header. A consumer widening the ring raises this too.|
|`--cngx-dga-head-shadow`|``|Surface|Shadow cast by the pinned column head while rows are scrolled away above it (bounded mode only). This is only the default look: set it to `none` to turn it off, or key your own visual (a line that appears, a tonal head) on the public `data-scroll-block-start` host attribute. Universal syntax with NO initial-value, so the adaptive default at the use site (derived from `--cngx-color-text`) stays live; a fixed colour initial would defeat it.|
|`--cngx-dga-foot-shadow`|``|Surface|Shadow cast by the pinned footer while rows remain below it (bounded mode only). A swappable default like the head shadow: `none` turns it off, and the public `data-scroll-block-end` host attribute keys any replacement. No initial-value, for the same reason as the head shadow.|
|`--cngx-dga-edge-fade-size`|`24px`|Grid|Width of the inline edge fade shown while columns are hidden sideways. Also sets how far the inline scroll padding keeps a focused cell away from the edge. The fade is a default look keyed on the public `data-scroll-inline-start` / `data-scroll-inline-end` host attributes.|
|`--cngx-dga-edge-fade-min`|`0.35`|Grid|Mask opacity at the very edge of the inline fade. The fade never reaches full transparency, so overlay scrollbars and edge content stay visible.|

## CngxDataGridRow

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-accordion-twisty-display`|`none`|Layout|Display of the Track-B accordion skin's `::after` twisty on the row summary. Set to `none` because the row renders its own chevron.|

## CngxDelta

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-delta-gap`|`2px`|Layout|Gap between the arrow glyph and the delta magnitude.|
|`--cngx-delta-size`|`0.8125rem`|Typography|Font-size of the delta label.|
|`--cngx-delta-weight`|`500`|Typography|Font-weight of the delta label.|
|`--cngx-delta-neutral-color`|`oklch(0.36 0.02 290)`|Variant / Neutral|Colour of the `.cngx-delta--neutral` modifier - flat or polarity-disabled.|
|`--cngx-delta-positive-color`|`oklch(0.65 0.18 145)`|Variant / Positive|Colour of the `.cngx-delta--positive` modifier. Falls back to `--cngx-color-success`.|
|`--cngx-delta-negative-color`|`oklch(0.65 0.22 25)`|Variant / Negative|Colour of the `.cngx-delta--negative` modifier. Falls back to `--cngx-color-danger`.|

## CngxDeviationBar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back through the consumer-facing `--accent` and then to the foundation `--cngx-color-primary` (Ember).|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame. Registered with `inherits: true` deliberately: with `inherits: false` a value set on `:root` or any container resets to the initial value at every element boundary and never reaches the chart host, silently no-opping the documented consumer override.|
|`--cngx-chart-numeric-bidi`|`isolate`|Typography|`unicode-bidi` of every numeric chart label (axis ticks, legend, threshold and band labels). Set to `normal` to opt out of isolation.|
|`--cngx-deviation-positive`|`var(--cngx-chart-success, #1f9d55)`|Surface|Fill colour of a positive deviation.|
|`--cngx-deviation-negative`|`var(--cngx-chart-danger, #d2452f)`|Surface|Fill colour of a negative deviation.|

## CngxDgaFilterField

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-dga-filter-py`|`var(--cngx-space-sm, 8px)`|Layout|Block padding of the filter field.|
|`--cngx-dga-filter-px`|`var(--cngx-space-md, 16px)`|Layout|Inline padding of the filter field.|
|`--cngx-dga-filter-label-gap`|`var(--cngx-space-xs, 4px)`|Layout|Gap between the filter label and its input.|
|`--cngx-dga-filter-input-py`|`var(--cngx-space-sm, 8px)`|Layout|Block padding of the filter input.|
|`--cngx-dga-filter-input-px`|`var(--cngx-space-sm, 8px)`|Layout|Inline padding of the filter input.|

## CngxDialog

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-dialog-bg`|`oklch(1 0 0)`|Surface|Dialog surface color. Falls back through `--cngx-color-surface`.|
|`--cngx-dialog-color`|`currentColor`|Surface|Dialog text color. Defaults to `currentColor`.|
|`--cngx-dialog-shadow`|`0 8px 32px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand for the dialog. `inherits: true` so the :root dark-mode override reaches the open dialog element.|
|`--cngx-dialog-border`|`none`|Surface|Border shorthand of the dialog. `none` by default; brand themes or Material outlined variants set this to a 1px ring without forking the component CSS.|
|`--cngx-dialog-border-radius`|`8px`|Layout|Corner radius of the dialog.|
|`--cngx-dialog-padding`|`24px`|Layout|Padding shorthand inside the dialog.|
|`--cngx-dialog-max-width`|`560px`|Layout|Maximum inline size of the dialog. `<length-percentage>` so consumers (e.g. CngxBottomSheet) can override with `100%` without falling back to the initial-value via syntax rejection.|
|`--cngx-dialog-max-height`|`80vh`|Layout|Maximum block size of the dialog.|
|`--cngx-dialog-backdrop-bg`|`oklch(0 0 0 / 0.5)`|Surface|Background of the `::backdrop` pseudo-element. `inherits: true` so a consumer override on `dialog[cngxDialog]` reaches the `::backdrop` pseudo (pseudo-elements inherit from the originating element, but only when the registered property allows it).|
|`--cngx-dialog-backdrop-blur`|`0px`|Surface|Blur radius applied to the `::backdrop`. Zero by default; bump to apply a frosted-glass effect. `inherits: true` so the override cascades to the `::backdrop` pseudo.|
|`--cngx-dialog-backdrop-opacity`|`1`|Surface|Opacity of the `::backdrop`. `CngxDialogStack` uses this to suppress the inner backdrop while a parent dialog is also open (avoids stacked scrim). `inherits: true` is load-bearing - the directive sets this token inline on the dialog element, and the `::backdrop` pseudo only reads it if the registered property inherits from the originating element.|
|`--cngx-dialog-backdrop-transition`|`none`|Motion|Transition shorthand applied to the `::backdrop`. Default `none` keeps the snap-in behaviour `CngxDialogStack` depends on (toggling backdrop-opacity between nested dialogs must not animate, or the inner dialog open flashes through a half-opacity scrim). Single non-stacked dialogs can opt in to a fade by setting this to e.g. `opacity 150ms ease`. `inherits: true` so the override cascades to the `::backdrop` pseudo from the dialog host.|
|`--cngx-dialog-transition-duration`|`200ms`|Motion|Duration of the open / close transition. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-dialog-transition-easing`|`ease`|Motion|Easing curve of the open / close transition.|
|`--cngx-dialog-drag-cursor`|`grab`|State / Draggable|Cursor shown over the draggable variant while resting.|
|`--cngx-dialog-dragging-cursor`|`grabbing`|State / Draggable|Cursor shown over the draggable variant while dragging.|
|`--cngx-dialog-focus-outline`|`auto`|State / Focus|Focus-ring shorthand applied via `outline` on `:focus-visible` of the dialog host itself. Relevant when no autofocus target exists inside the dialog and AT focuses the `<dialog>` element directly. Default `auto` keeps the browser-native focus indicator.|

## CngxDialogDraggable

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-dialog-bg`|`oklch(1 0 0)`|Surface|Dialog surface color. Falls back through `--cngx-color-surface`.|
|`--cngx-dialog-color`|`currentColor`|Surface|Dialog text color. Defaults to `currentColor`.|
|`--cngx-dialog-shadow`|`0 8px 32px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand for the dialog. `inherits: true` so the :root dark-mode override reaches the open dialog element.|
|`--cngx-dialog-border`|`none`|Surface|Border shorthand of the dialog. `none` by default; brand themes or Material outlined variants set this to a 1px ring without forking the component CSS.|
|`--cngx-dialog-border-radius`|`8px`|Layout|Corner radius of the dialog.|
|`--cngx-dialog-padding`|`24px`|Layout|Padding shorthand inside the dialog.|
|`--cngx-dialog-max-width`|`560px`|Layout|Maximum inline size of the dialog. `<length-percentage>` so consumers (e.g. CngxBottomSheet) can override with `100%` without falling back to the initial-value via syntax rejection.|
|`--cngx-dialog-max-height`|`80vh`|Layout|Maximum block size of the dialog.|
|`--cngx-dialog-backdrop-bg`|`oklch(0 0 0 / 0.5)`|Surface|Background of the `::backdrop` pseudo-element. `inherits: true` so a consumer override on `dialog[cngxDialog]` reaches the `::backdrop` pseudo (pseudo-elements inherit from the originating element, but only when the registered property allows it).|
|`--cngx-dialog-backdrop-blur`|`0px`|Surface|Blur radius applied to the `::backdrop`. Zero by default; bump to apply a frosted-glass effect. `inherits: true` so the override cascades to the `::backdrop` pseudo.|
|`--cngx-dialog-backdrop-opacity`|`1`|Surface|Opacity of the `::backdrop`. `CngxDialogStack` uses this to suppress the inner backdrop while a parent dialog is also open (avoids stacked scrim). `inherits: true` is load-bearing - the directive sets this token inline on the dialog element, and the `::backdrop` pseudo only reads it if the registered property inherits from the originating element.|
|`--cngx-dialog-backdrop-transition`|`none`|Motion|Transition shorthand applied to the `::backdrop`. Default `none` keeps the snap-in behaviour `CngxDialogStack` depends on (toggling backdrop-opacity between nested dialogs must not animate, or the inner dialog open flashes through a half-opacity scrim). Single non-stacked dialogs can opt in to a fade by setting this to e.g. `opacity 150ms ease`. `inherits: true` so the override cascades to the `::backdrop` pseudo from the dialog host.|
|`--cngx-dialog-transition-duration`|`200ms`|Motion|Duration of the open / close transition. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-dialog-transition-easing`|`ease`|Motion|Easing curve of the open / close transition.|
|`--cngx-dialog-drag-cursor`|`grab`|State / Draggable|Cursor shown over the draggable variant while resting.|
|`--cngx-dialog-dragging-cursor`|`grabbing`|State / Draggable|Cursor shown over the draggable variant while dragging.|
|`--cngx-dialog-focus-outline`|`auto`|State / Focus|Focus-ring shorthand applied via `outline` on `:focus-visible` of the dialog host itself. Relevant when no autofocus target exists inside the dialog and AT focuses the `<dialog>` element directly. Default `auto` keeps the browser-native focus indicator.|

## CngxDivider

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-divider-thickness`|`1px`|Layout|Stroke thickness of the divider line. 1px reads as a hairline at the default zoom; bump to 2px for emphasis without going to a heavier shape.|
|`--cngx-divider-color`|`oklch(0.9 0.01 250)`|Surface|Stroke color. Falls back through `--cngx-color-border` so the divider tracks the foundation neutral instead of carrying its own tone.|
|`--cngx-divider-spacing`|`8px`|Layout|Breathing room around the divider - `margin-block` for horizontal, `margin-inline` for vertical. Defaults to `--cngx-space-sm`.|
|`--cngx-divider-inset-amount`|`16px`|Variant / Inset|Inset distance applied by the `.cngx-divider--inset` modifier - drops the line in from the start/end edge so it visually aligns with indented list content.|

## CngxDonut

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back through the consumer-facing `--accent` and then to the foundation `--cngx-color-primary` (Ember).|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame. Registered with `inherits: true` deliberately: with `inherits: false` a value set on `:root` or any container resets to the initial value at every element boundary and never reaches the chart host, silently no-opping the documented consumer override.|
|`--cngx-chart-numeric-bidi`|`isolate`|Typography|`unicode-bidi` of every numeric chart label (axis ticks, legend, threshold and band labels). Set to `normal` to opt out of isolation.|
|`--cngx-donut-color`|`var(--cngx-chart-primary, currentColor)`|Surface|Stroke colour of the donut value arc.|

## CngxDotStepper

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-step-refused-color`|``|State / Refused|Fill of a refused-commit marker (the commit action answered `false`). A refusal is no error, so it wears the rejection amber; a failed commit keeps `--cngx-step-errored-color`. Registered without an initial value, so the amber fallback applies until a theme sets it.|
|`--cngx-step-refused-text-color`|``|State / Refused|Text color of the aggregate line when every marked step is a refused commit. Defaults to the surrounding text colour: amber text would fall under the 4.5:1 text contrast.|
|`--cngx-dot-step-size`|`0.625rem`|Layout|Diameter of each dot.|
|`--cngx-dot-step-marked-size`|`1rem`|Layout|Diameter of a dot that carries an error or refused mark. Larger than `--cngx-dot-step-size`, so the mark inside stays legible.|
|`--cngx-dot-step-gap`|`0.5rem`|Layout|Gap between adjacent dots in the row.|
|`--cngx-dot-step-active-fill`|`oklch(0.66 0.19 50)`|State / Active|Fill of the active dot. Derives from `--cngx-step-active-fill`.|
|`--cngx-dot-step-completed-fill`|`oklch(0.5 0.15 145)`|State / Completed|Fill of a completed dot. Derives from `--cngx-step-completed-color`, then `--cngx-color-success`.|
|`--cngx-dot-step-upcoming-bg`|`color-mix(in srgb, currentColor 18%, transparent)`|State / Resting|Fill of an upcoming dot. Derives from `--cngx-step-indicator-bg`.|

## CngxEmptyState

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-empty-gap`|`16px`|Layout|Vertical gap between the icon, title, description, and actions. Falls back to `--cngx-space-md`.|
|`--cngx-empty-icon-size`|`48px`|Icon|Footprint of the default illustration: the archive inks at about this width, and the block it reserves keeps this height. Inherits, so a value set on the host reaches the icon.|
|`--cngx-empty-padding`|`48px`|Layout|Block padding around the entire empty state. Falls back to `--cngx-space-xl`.|
|`--cngx-empty-color`|`oklch(0.34 0.005 290)`|Surface|Default text color for the description slot.|
|`--cngx-empty-icon-color`|`oklch(0.34 0.005 290)`|Surface|Color of the default icon glyph (when no custom icon is projected).|
|`--cngx-empty-title-size`|`1.125rem`|Typography|Font-size of the title slot.|
|`--cngx-empty-title-weight`|`500`|Typography|Font-weight of the title slot.|
|`--cngx-empty-title-color`|`oklch(0.18 0.005 290)`|Typography|Text color of the title slot - slightly darker than the description for a clear hierarchy.|
|`--cngx-empty-desc-size`|`0.875rem`|Typography|Font-size of the description slot.|

## CngxError

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-label-font-size`|`0.8125rem`|Typography|Font size of the field label.|
|`--cngx-field-label-weight`|`500`|Typography|Font weight of the field label.|
|`--cngx-field-hint-font-size`|`0.8125rem`|Typography|Font size of the hint and of the error list.|
|`--cngx-field-label-gap`|`0.25rem`|Layout|Distance from the label to its control or field box, in a `cngx-form-field` that holds the label as a direct child. SET from `--cngx-space-xs` on the field, so a root `[data-density]` tracks it.|
|`--cngx-field-hint-gap`|`0.25rem`|Layout|Distance from the control or field box to the hint and between hint and error lines, in the same field stack. SET from `--cngx-space-xs`.|

## CngxFieldBox

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-border-width`|`1px`|Sizing|Border width of the field box on every side, in every skin (transparent where a skin paints none). The box height and the touch floor of the controls inside it are derived from it, so changing it keeps the box on its formula.|
|`--cngx-field-ring-width`|`2px`|Sizing|Width of the focus ring an outline or bare box draws around its main control.|
|`--cngx-field-ring-offset`|`3px`|Sizing|Distance between the box edge and its focus ring.|
|`--cngx-field-affix-gap`|`8px`|Layout|Gap between the prefix, control, and suffix in an affix row.|
|`--cngx-field-affix-divider`|`0px`|Layout|Width of an optional divider between an affix and the control: the inline-end edge of a prefix, the inline-start edge of a suffix. `0px` draws none. Any width also pads the affix by `--cngx-space-sm` so the divider does not touch the affix content. Set it on the box.|

## CngxFieldSkinHost

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-underline-size`|`2px`|Sizing|Thickness of the focus underline on the `fill` skin. `inherits: true` so a single `:root` override retunes every field.|

## CngxFileDrop

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-file-drop-border-width`|`2px`|Surface|Border width of the resting dropzone.|
|`--cngx-file-drop-border-color`|`oklch(0.8 0 0)`|Surface|Border color of the resting dropzone.|
|`--cngx-file-drop-radius`|`8px`|Layout|Corner radius. Defaults to `--cngx-radius-md`.|
|`--cngx-file-drop-padding`|`32px`|Layout|Padding shorthand. Defaults to `--cngx-space-xl`.|
|`--cngx-file-drop-transition`|`200ms ease`|Motion|Transition shorthand (`<time> <easing>`) applied to border and background changes between states. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-file-drop-active-border`|`currentColor`|State / Dragging|Border color applied while a drag is hovering. Defaults to `currentColor` so the dropzone picks up the inherited text color.|
|`--cngx-file-drop-active-bg`|`oklch(0 0 0 / 0.03)`|State / Dragging|Background tint applied while a drag is hovering.|
|`--cngx-file-drop-success-border`|`oklch(0.65 0.15 155)`|State / HasFiles|Border color applied once files have been dropped. Falls back through `--cngx-color-success`.|
|`--cngx-file-drop-uploading-opacity`|`0.6`|State / Uploading|Opacity multiplier applied while an upload is in flight.|

## CngxFilterBuilder

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-filter-builder-padding`|`0.5rem`|Layout|Padding shorthand around the outer builder container.|
|`--cngx-filter-builder-bg`|`transparent`|Surface|Background of the outer builder container.|
|`--cngx-filter-builder-fg`|`currentColor`|Surface|Foreground text color of the builder.|
|`--cngx-filter-builder-gap`|`0.5rem`|Layout|Gap between sibling rows / actions / logic-toggle items.|
|`--cngx-filter-builder-group-padding`|`0.5rem`|Layout|Padding shorthand inside each group container.|
|`--cngx-filter-builder-group-border`|`none`|Surface|Border shorthand of each group container. `inherits: true` so the :root delegating value reaches nested group containers. Default `none` - the builder renders on the page surface like the modern filter-bar reference class; set the token for a boxed look.|
|`--cngx-filter-builder-border-color`|`oklch(0.87 0 0)`|Surface|Border color of group containers and the action-button stroke. Falls back through `--cngx-color-border`. `inherits: true` so a :root override flows into the builder host.|
|`--cngx-filter-builder-radius`|`0.375rem`|Layout|Corner radius of group containers and action buttons.|
|`--cngx-filter-builder-indent`|`1.25rem`|Layout|Indent applied to nested (non-root) groups so the hierarchy reads visually.|
|`--cngx-filter-builder-rail`|`2px solid oklch(0.87 0 0)`|Surface|Left rail border shorthand for nested groups. `inherits: true` so the :root delegating value reaches nested rails.|
|`--cngx-filter-builder-negated-border-style`|`dashed`|Variant / Negated|Border-style applied to negated groups - dashed reads as "exclusion" without changing the color.|
|`--cngx-filter-builder-empty-padding`|`0.75rem`|Layout|Padding shorthand of the empty-state slot.|
|`--cngx-filter-builder-empty-fg`|`oklch(0.45 0 0)`|State / Empty|Text color of the empty-state slot - muted by default. `inherits: true` so the :root dark-mode override reaches the empty slot inside the builder host.|
|`--cngx-filter-builder-action-gap`|`0.25rem`|Layout|Gap between an action button's glyph and its label.|
|`--cngx-filter-builder-action-padding`|`0.25rem 0.625rem`|Layout|Padding shorthand of an action button.|
|`--cngx-filter-builder-action-font-size`|`0.875rem`|Typography|Font-size of an action button's label. Read at the button element, SET from the type scale at the builder host - `inherits: true` is load-bearing for that host-level SET to arrive.|
|`--cngx-filter-builder-action-fg`|`currentColor`|Surface|Text color of an action button.|
|`--cngx-filter-builder-action-bg`|`transparent`|Surface|Background of an action button at rest.|
|`--cngx-filter-builder-action-border-width`|`1px`|Surface|Border width of an action button.|
|`--cngx-filter-builder-action-border`|`oklch(0.82 0 0)`|Surface|Border color of an action button. `inherits: true` so a :root delegating value reaches the button inside the builder host.|
|`--cngx-filter-builder-action-radius`|`0.375rem`|Layout|Corner radius of an action button.|
|`--cngx-filter-builder-action-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint applied on hover / focus-visible of an action button. `inherits: true` so the :root dark-mode override (alpha-on-white in dark) reaches the button.|
|`--cngx-filter-builder-focus-outline`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand applied to action buttons.|
|`--cngx-filter-builder-focus-outline-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-filter-builder-action-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied to disabled action buttons.|
|`--cngx-filter-builder-action-remove-fg`|`oklch(0.46 0.18 25)`|Variant / Remove|Foreground color of the destructive remove button. Falls back through `--cngx-filter-builder-error-fg` and then `--cngx-color-danger-text`.|
|`--cngx-filter-builder-error-fg`|`oklch(0.46 0.18 25)`|State / Error|Error-tone foreground shared across the builder's error states. Falls back through `--cngx-color-danger-text`.|
|`--cngx-filter-builder-action-glyph-size`|`1em`|Layout|Font-size of the action-button glyph slot.|
|`--cngx-filter-builder-control-font-size`|`var(--cngx-font-size-sm)`|Typography|Font size of the builder host, inherited by its controls.|

## CngxFilterChips

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-filter-chips-gap`|`var(--cngx-space-sm, 8px)`|Layout|Gap between the filter chips, in both the row and the vertical layout.|

## CngxFilterExpressionRow

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-filter-builder-value-basis`|`128px`|Layout / Pill|Inline size of the value-editor segment inside the pill. Geometry token, deliberately not density-derived. `inherits: true` so one assignment at the builder root sizes every row in the tree.|
|`--cngx-filter-builder-value-max`|`320px`|Layout / Pill|Growth cap of the value-editor segment - keeps a long text value from ballooning the capsule.|
|`--cngx-filter-builder-action-padding-compact`|`var(--cngx-space-sm)`|Variant / Remove|Padding of the remove button at the end of the expression-row capsule.|

## CngxFilterRow

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-filter-builder-empty-row-opacity`|`0.85`|State / Empty|Opacity multiplier applied to the empty row variant - fades the placeholder slot without removing it from the layout.|
|`--cngx-filter-builder-action-padding-compact`|`var(--cngx-space-sm)`|Variant / Remove|Padding of the remove button at the end of the row capsule.|

## CngxFormErrors

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-form-errors-font-size`|`0.875rem`|Typography|Font-size of the error list. Falls back through `--cngx-font-size-sm`. `syntax: '*'` allows `rem`.|
|`--cngx-form-errors-color`|`oklch(0.6 0.18 25)`|Surface|Text color of the error list. Falls back through `--cngx-field-error-color` and then `--cngx-color-danger`.|

## CngxGoal

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-goal-fill`|`0%`|Layout|Attained fraction, as a `<percentage>`. The component binds this inline on the host from the clamped value (e.g. `73%`); it must inherit so the value reaches the descendant `.cngx-goal__fill` that consumes it (a `inherits: false` here would pin the fill to the `0%` initial). Authors normally leave it alone.|
|`--cngx-goal-height`|`8px`|Layout|Height of the track.|
|`--cngx-goal-radius`|`999px`|Layout|Corner radius of the track and fill.|
|`--cngx-goal-track-color`|`oklch(0.92 0.01 290)`|Surface|Colour of the unfilled track groove.|
|`--cngx-goal-fill-color`|`oklch(0.65 0.18 145)`|Surface|Colour of the attained fill. Falls back to `--cngx-color-success`.|

## CngxHint

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-label-font-size`|`0.8125rem`|Typography|Font size of the field label.|
|`--cngx-field-label-weight`|`500`|Typography|Font weight of the field label.|
|`--cngx-field-hint-font-size`|`0.8125rem`|Typography|Font size of the hint and of the error list.|
|`--cngx-field-label-gap`|`0.25rem`|Layout|Distance from the label to its control or field box, in a `cngx-form-field` that holds the label as a direct child. SET from `--cngx-space-xs` on the field, so a root `[data-density]` tracks it.|
|`--cngx-field-hint-gap`|`0.25rem`|Layout|Distance from the control or field box to the hint and between hint and error lines, in the same field stack. SET from `--cngx-space-xs`.|

## CngxIcon

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-icon-color`|`currentColor`|Surface|Text color of the icon glyph. Defaults to `currentColor` so the icon inherits its container's text color.|
|`--cngx-icon-size-xs`|`max(0.75em, 12px)`|Variant / Size|Size token for the `.cngx-icon--xs` variant.|
|`--cngx-icon-stroke-width-xs`|`2.5`|Variant / Size|Stroke width of outline glyphs in the `.cngx-icon--xs` variant, in grid units of the 24x24 viewBox. Thicker than the default 2 so the strokes keep about a pixel at the 12px floor. An icon with a 12-grid micro drawing shows that instead at 10 to 14px, and this token does not reach it.|
|`--cngx-icon-size-sm`|`1em`|Variant / Size|Size token for the `.cngx-icon--sm` variant.|
|`--cngx-icon-size-md`|`1.25em`|Variant / Size|Size token for the `.cngx-icon--md` variant (default).|
|`--cngx-icon-size-lg`|`1.5em`|Variant / Size|Size token for the `.cngx-icon--lg` variant.|
|`--cngx-icon-size-xl`|`2em`|Variant / Size|Size token for the `.cngx-icon--xl` variant.|
|`--cngx-icon-size`|`1.25em`|Layout|Active size of the icon - consumed by `font-size` on the host. Driven by the size-variant classes (`md` here) or set inline on the icon for one-off overrides.|

## CngxIconButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-padding-block`|`0.5rem`|Layout|Block padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-padding-inline`|`1rem`|Layout|Inline padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-gap`|`0.5rem`|Layout|Gap between the slots and the label.|
|`--cngx-button-font-size`|`1rem`|Typography|Font size. `md` reads the form-control font so the button shares the control line box.|
|`--cngx-button-radius`|`0.5rem`|Layout|Corner radius.|
|`--cngx-button-border-width`|`1px`|Layout|Border width on all four sides; transparent where the variant paints none, so every variant shares one box.|
|`--cngx-button-transition`|`150ms`|Motion|Transition duration for colour changes. Derives from the `--cngx-duration-fast` rung of the motion scale.|
|`--cngx-button-tone`|`currentColor`|Tone|Tone colour: the outline border, the hover wash, and the solid fill unless `--cngx-button-tone-fill` is set.|
|`--cngx-button-tone-text`|`currentColor`|Tone|Text colour on a transparent or tonal surface.|
|`--cngx-button-on-tone`|`Canvas`|Tone|Text colour on the solid tone fill.|
|`--cngx-button-tone-fill`|``|Tone|Solid fill colour. Set by the primary and danger tones to the strong palette rung their on-colour clears 4.5:1 against; unset, the solid fill falls back to `--cngx-button-tone`. Outline, secondary, ghost and link keep painting from `--cngx-button-tone`. Registered without an initial value so the fallback stays live.|
|`--cngx-button-spinner-size`|`1em`|Busy|Diameter of the busy spinner ring, and the box of a bare `svg` or `img` drawn by a `provideButtonSpinner` component.|
|`--cngx-button-spinner-thickness`|`2px`|Busy|Stroke width of the busy spinner ring. Inherits so a value set on the button reaches the ring inside the busy layer.|
|`--cngx-button-hover-shade`|`oklch(0 0 0)`|Tone|Colour a solid button's tone mixes towards on hover and press (by `--cngx-button-hover-layer` / `--cngx-button-pressed-layer`), so the fill darkens without a second tone token.|
|`--cngx-button-link-hover-thickness`|`2px`|Tone|Underline thickness of a `link` button on hover; at rest it keeps the font's own underline.|
|`--cngx-button-icon-size`|`1.25em`|Layout|Edge length of an `svg` or `img` in a start or end slot. Same rung as `--cngx-icon-size-md`, so a projected `cngx-icon` and a bare `svg` match. Inherits so a value set on the button reaches the slot glyph.|
|`--cngx-button-neutral-tint`|`5%`|Tone|Tint strength of a neutral `secondary` fill and its hover. Light text on a dark surface reads a small tint as almost nothing, so the dark scheme steps both up.|
|`--cngx-button-neutral-tint-hover`|`9%`|Tone|Hover tint strength of a neutral `secondary` fill.|
|`--cngx-button-hover-layer`|`12%`|State / Hover|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill on hover, a state layer. A theme maps it to its hover state-layer opacity (the Material bridge: `--mat-sys-hover-state-layer-opacity`).|
|`--cngx-button-pressed-layer`|`20%`|State / Pressed|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill while pressed, one step above `--cngx-button-hover-layer`. A theme maps it to its pressed state-layer opacity (the Material bridge: `--mat-sys-pressed-state-layer-opacity`).|
|`--cngx-button-pressed-wash`|`12%`|State / Pressed|Tone wash of a pressed `outline` or `ghost` button (hover takes 8%).|
|`--cngx-button-neutral-tint-pressed`|`13%`|State / Pressed|Pressed tint strength of a neutral `secondary` fill, one step above `--cngx-button-neutral-tint-hover`; the dark scheme steps it up.|
|`--cngx-button-secondary-bg-pressed`|``|State / Pressed|Pressed fill of a `secondary` button. Unset by default, so the pressed tone mix paints; a theme sets it next to `--cngx-button-secondary-bg-hover`.|
|`--cngx-button-secondary-bg`|``|Tone|Fill of a `secondary` button. Unset by default, so the fill is the tone mixed into transparency (the neutral tint for `neutral`, 12% otherwise). A theme sets it to paint a container colour instead (the Material bridge maps it to the `*-container` roles).|
|`--cngx-button-secondary-bg-hover`|``|Tone|Hover fill of a `secondary` button. Unset by default, so hover steps the tone mix up.|
|`--cngx-button-secondary-color`|``|Tone|Text colour of a `secondary` button. Unset by default, so the tone text colour paints.|

## CngxIconMenuButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-padding-block`|`0.5rem`|Layout|Block padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-padding-inline`|`1rem`|Layout|Inline padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-gap`|`0.5rem`|Layout|Gap between the slots and the label.|
|`--cngx-button-font-size`|`1rem`|Typography|Font size. `md` reads the form-control font so the button shares the control line box.|
|`--cngx-button-radius`|`0.5rem`|Layout|Corner radius.|
|`--cngx-button-border-width`|`1px`|Layout|Border width on all four sides; transparent where the variant paints none, so every variant shares one box.|
|`--cngx-button-transition`|`150ms`|Motion|Transition duration for colour changes. Derives from the `--cngx-duration-fast` rung of the motion scale.|
|`--cngx-button-tone`|`currentColor`|Tone|Tone colour: the outline border, the hover wash, and the solid fill unless `--cngx-button-tone-fill` is set.|
|`--cngx-button-tone-text`|`currentColor`|Tone|Text colour on a transparent or tonal surface.|
|`--cngx-button-on-tone`|`Canvas`|Tone|Text colour on the solid tone fill.|
|`--cngx-button-tone-fill`|``|Tone|Solid fill colour. Set by the primary and danger tones to the strong palette rung their on-colour clears 4.5:1 against; unset, the solid fill falls back to `--cngx-button-tone`. Outline, secondary, ghost and link keep painting from `--cngx-button-tone`. Registered without an initial value so the fallback stays live.|
|`--cngx-button-spinner-size`|`1em`|Busy|Diameter of the busy spinner ring, and the box of a bare `svg` or `img` drawn by a `provideButtonSpinner` component.|
|`--cngx-button-spinner-thickness`|`2px`|Busy|Stroke width of the busy spinner ring. Inherits so a value set on the button reaches the ring inside the busy layer.|
|`--cngx-button-hover-shade`|`oklch(0 0 0)`|Tone|Colour a solid button's tone mixes towards on hover and press (by `--cngx-button-hover-layer` / `--cngx-button-pressed-layer`), so the fill darkens without a second tone token.|
|`--cngx-button-link-hover-thickness`|`2px`|Tone|Underline thickness of a `link` button on hover; at rest it keeps the font's own underline.|
|`--cngx-button-icon-size`|`1.25em`|Layout|Edge length of an `svg` or `img` in a start or end slot. Same rung as `--cngx-icon-size-md`, so a projected `cngx-icon` and a bare `svg` match. Inherits so a value set on the button reaches the slot glyph.|
|`--cngx-button-neutral-tint`|`5%`|Tone|Tint strength of a neutral `secondary` fill and its hover. Light text on a dark surface reads a small tint as almost nothing, so the dark scheme steps both up.|
|`--cngx-button-neutral-tint-hover`|`9%`|Tone|Hover tint strength of a neutral `secondary` fill.|
|`--cngx-button-hover-layer`|`12%`|State / Hover|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill on hover, a state layer. A theme maps it to its hover state-layer opacity (the Material bridge: `--mat-sys-hover-state-layer-opacity`).|
|`--cngx-button-pressed-layer`|`20%`|State / Pressed|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill while pressed, one step above `--cngx-button-hover-layer`. A theme maps it to its pressed state-layer opacity (the Material bridge: `--mat-sys-pressed-state-layer-opacity`).|
|`--cngx-button-pressed-wash`|`12%`|State / Pressed|Tone wash of a pressed `outline` or `ghost` button (hover takes 8%).|
|`--cngx-button-neutral-tint-pressed`|`13%`|State / Pressed|Pressed tint strength of a neutral `secondary` fill, one step above `--cngx-button-neutral-tint-hover`; the dark scheme steps it up.|
|`--cngx-button-secondary-bg-pressed`|``|State / Pressed|Pressed fill of a `secondary` button. Unset by default, so the pressed tone mix paints; a theme sets it next to `--cngx-button-secondary-bg-hover`.|
|`--cngx-button-secondary-bg`|``|Tone|Fill of a `secondary` button. Unset by default, so the fill is the tone mixed into transparency (the neutral tint for `neutral`, 12% otherwise). A theme sets it to paint a container colour instead (the Material bridge maps it to the `*-container` roles).|
|`--cngx-button-secondary-bg-hover`|``|Tone|Hover fill of a `secondary` button. Unset by default, so hover steps the tone mix up.|
|`--cngx-button-secondary-color`|``|Tone|Text colour of a `secondary` button. Unset by default, so the tone text colour paints.|
|`--cngx-icon-size`|`1em`|Layout|Caret size, relative to the button font.|

## CngxIncrementalList

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-incremental-list-item-padding`|`var(--cngx-space-sm, 0.5rem)`|Layout|Block padding of each list item.|
|`--cngx-incremental-list-message-padding`|`var(--cngx-space-md, 1rem)`|Layout|Padding of the status messages and the error blocks.|
|`--cngx-incremental-list-error-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Gap between the error text and the retry button.|
|`--cngx-incremental-list-card-padding`|`var(--cngx-space-md, 1rem)`|Layout|Inline padding of the list in the `card` skin.|
|`--cngx-incremental-list-button-padding`|`var(--cngx-space-xs, 0.25rem) var(--cngx-space-md, 1rem)`|Layout|Padding of the retry button.|

## CngxLabel

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-required-color`|`oklch(0.6 0.18 25)`|State / Required|Color of the required-marker glyph next to the label. Falls back through `--cngx-field-error-color` and then `--cngx-color-danger`.|
|`--cngx-field-label-font-size`|`0.8125rem`|Typography|Font size of the field label.|
|`--cngx-field-label-weight`|`500`|Typography|Font weight of the field label.|
|`--cngx-field-hint-font-size`|`0.8125rem`|Typography|Font size of the hint and of the error list.|
|`--cngx-field-label-gap`|`0.25rem`|Layout|Distance from the label to its control or field box, in a `cngx-form-field` that holds the label as a direct child. SET from `--cngx-space-xs` on the field, so a root `[data-density]` tracks it.|
|`--cngx-field-hint-gap`|`0.25rem`|Layout|Distance from the control or field box to the hint and between hint and error lines, in the same field stack. SET from `--cngx-space-xs`.|

## CngxListbox

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-listbox-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outline of the listbox container when it takes keyboard focus. The container uses `aria-activedescendant`, so it carries focus while the highlighted option is signalled separately by the highlight bg.|
|`--cngx-listbox-focus-outline-width`|`2px`|State / Focus|Stroke width of the container focus ring.|
|`--cngx-listbox-focus-outline-offset`|`2px`|State / Focus|Distance from the container edge to the focus ring.|
|`--cngx-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background tint of the keyboard-highlighted option. Low-alpha primary so the highlight reads as an accent without competing with selected-state visuals.|
|`--cngx-option-selected-bg`|`oklch(0.66 0.19 50 / 0.18)`|State / Selected|Background of a selected option. Slightly higher alpha than the highlight tint so selection reads as committed state rather than transient cursor position.|
|`--cngx-listbox-padding`|`4px`|Layout|Padding shorthand inside the listbox container.|
|`--cngx-option-padding`|`6px 10px`|Layout|Padding shorthand on each option.|
|`--cngx-option-radius`|`4px`|Layout|Corner radius of each option.|

## CngxLoadingIndicator

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-loading-bar-height`|`3px`|Layout|Track height of the bar variant.|
|`--cngx-loading-bar-radius`|`0`|Layout|Corner radius of the bar variant.|
|`--cngx-loading-indicator-size`|`24px`|Layout|Diameter of the spinner ring.|
|`--cngx-loading-indicator-track`|`oklch(0 0 0 / 0.1)`|Surface|Track color of the spinner ring and the indeterminate bar.|
|`--cngx-loading-indicator-color`|`currentColor`|Surface|Stroke / fill color of the active indicator.|
|`--cngx-spin-duration`|`0.8s`|Motion|Spinner rotation duration.|
|`--cngx-spin-easing`|`linear`|Motion|Spinner easing curve.|
|`--cngx-bar-duration`|`1.5s`|Motion|Bar sweep duration.|
|`--cngx-bar-easing`|`ease-in-out`|Motion|Bar sweep easing curve.|
|`--cngx-pulse-duration`|`2s`|Motion|Opacity-pulse duration used as the reduced-motion fallback.|
|`--cngx-pulse-easing`|`ease-in-out`|Motion|Opacity-pulse easing curve.|

## CngxLoadingOverlay

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-loading-overlay-z-index`|`10`|Layout|Stacking-context order of the overlay above its content.|
|`--cngx-loading-overlay-backdrop-bg`|`oklch(1 0 0 / 0.5)`|Surface|Backdrop background - translucent white by default; override for dark themes.|
|`--cngx-loading-overlay-backdrop-opacity`|`1`|Surface|Backdrop opacity multiplier.|
|`--cngx-overlay-transition-duration`|`150ms`|Motion|Opacity-fade transition duration for the overlay show/hide. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-overlay-transition-easing`|`ease`|Motion|Easing curve of the overlay show/hide transition.|

## CngxMenu

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-menu-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outline of the menu container when it takes keyboard focus - standard 2px ring at the foundation-primary hue. The container uses `aria-activedescendant`, so it carries focus while the highlighted item is signalled separately by the highlight bg.|
|`--cngx-menu-focus-outline-width`|`2px`|State / Focus|Stroke width of the container focus ring.|
|`--cngx-menu-focus-outline-offset`|`2px`|State / Focus|Distance from the container edge to the focus ring.|
|`--cngx-menu-item-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background tint of the keyboard-highlighted item. Resolved at `:root` as `color-mix(in oklch, var(--cngx-color-primary) 10%, transparent)` so the tint tracks whichever primary the theme (cngx default, Material bridge, brand override) feeds. The `@property` initial-value below is the literal fallback used when neither the foundation token nor the `:root` declaration resolves.|
|`--cngx-menu-padding`|`4px`|Layout|Padding shorthand inside the menu container.|
|`--cngx-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each menu item.|
|`--cngx-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / suffix / kbd).|
|`--cngx-menu-item-radius`|`4px`|Layout|Corner radius of each menu item.|
|`--cngx-menu-item-checked-font-weight`|`600`|State / Checked|Font-weight applied to a checked menu item - emphasises committed state vs the transient highlight cursor.|
|`--cngx-menu-item-checked-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading check or dot indicator on a checked item. Tracks the foundation primary so the cue matches the highlight accent.|
|`--cngx-menu-item-icon-min-width`|`1.25rem`|Layout|Min-width reserved on the leading icon slot - keeps labels vertically aligned across rows when some items have icons and others don't.|
|`--cngx-menu-item-kbd-color`|`oklch(0.45 0 0)`|Surface|Color of the trailing keyboard-shortcut hint. Defaults to a muted neutral that reads as secondary info next to the label.|
|`--cngx-menu-separator-color`|`oklch(0.89 0 0)`|Surface|Color of the menu separator hairline. Tracks `--cngx-color-border`.|

## CngxMenuButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-padding-block`|`0.5rem`|Layout|Block padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-padding-inline`|`1rem`|Layout|Inline padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-gap`|`0.5rem`|Layout|Gap between the slots and the label.|
|`--cngx-button-font-size`|`1rem`|Typography|Font size. `md` reads the form-control font so the button shares the control line box.|
|`--cngx-button-radius`|`0.5rem`|Layout|Corner radius.|
|`--cngx-button-border-width`|`1px`|Layout|Border width on all four sides; transparent where the variant paints none, so every variant shares one box.|
|`--cngx-button-transition`|`150ms`|Motion|Transition duration for colour changes. Derives from the `--cngx-duration-fast` rung of the motion scale.|
|`--cngx-button-tone`|`currentColor`|Tone|Tone colour: the outline border, the hover wash, and the solid fill unless `--cngx-button-tone-fill` is set.|
|`--cngx-button-tone-text`|`currentColor`|Tone|Text colour on a transparent or tonal surface.|
|`--cngx-button-on-tone`|`Canvas`|Tone|Text colour on the solid tone fill.|
|`--cngx-button-tone-fill`|``|Tone|Solid fill colour. Set by the primary and danger tones to the strong palette rung their on-colour clears 4.5:1 against; unset, the solid fill falls back to `--cngx-button-tone`. Outline, secondary, ghost and link keep painting from `--cngx-button-tone`. Registered without an initial value so the fallback stays live.|
|`--cngx-button-spinner-size`|`1em`|Busy|Diameter of the busy spinner ring, and the box of a bare `svg` or `img` drawn by a `provideButtonSpinner` component.|
|`--cngx-button-spinner-thickness`|`2px`|Busy|Stroke width of the busy spinner ring. Inherits so a value set on the button reaches the ring inside the busy layer.|
|`--cngx-button-hover-shade`|`oklch(0 0 0)`|Tone|Colour a solid button's tone mixes towards on hover and press (by `--cngx-button-hover-layer` / `--cngx-button-pressed-layer`), so the fill darkens without a second tone token.|
|`--cngx-button-link-hover-thickness`|`2px`|Tone|Underline thickness of a `link` button on hover; at rest it keeps the font's own underline.|
|`--cngx-button-icon-size`|`1.25em`|Layout|Edge length of an `svg` or `img` in a start or end slot. Same rung as `--cngx-icon-size-md`, so a projected `cngx-icon` and a bare `svg` match. Inherits so a value set on the button reaches the slot glyph.|
|`--cngx-button-neutral-tint`|`5%`|Tone|Tint strength of a neutral `secondary` fill and its hover. Light text on a dark surface reads a small tint as almost nothing, so the dark scheme steps both up.|
|`--cngx-button-neutral-tint-hover`|`9%`|Tone|Hover tint strength of a neutral `secondary` fill.|
|`--cngx-button-hover-layer`|`12%`|State / Hover|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill on hover, a state layer. A theme maps it to its hover state-layer opacity (the Material bridge: `--mat-sys-hover-state-layer-opacity`).|
|`--cngx-button-pressed-layer`|`20%`|State / Pressed|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill while pressed, one step above `--cngx-button-hover-layer`. A theme maps it to its pressed state-layer opacity (the Material bridge: `--mat-sys-pressed-state-layer-opacity`).|
|`--cngx-button-pressed-wash`|`12%`|State / Pressed|Tone wash of a pressed `outline` or `ghost` button (hover takes 8%).|
|`--cngx-button-neutral-tint-pressed`|`13%`|State / Pressed|Pressed tint strength of a neutral `secondary` fill, one step above `--cngx-button-neutral-tint-hover`; the dark scheme steps it up.|
|`--cngx-button-secondary-bg-pressed`|``|State / Pressed|Pressed fill of a `secondary` button. Unset by default, so the pressed tone mix paints; a theme sets it next to `--cngx-button-secondary-bg-hover`.|
|`--cngx-button-secondary-bg`|``|Tone|Fill of a `secondary` button. Unset by default, so the fill is the tone mixed into transparency (the neutral tint for `neutral`, 12% otherwise). A theme sets it to paint a container colour instead (the Material bridge maps it to the `*-container` roles).|
|`--cngx-button-secondary-bg-hover`|``|Tone|Hover fill of a `secondary` button. Unset by default, so hover steps the tone mix up.|
|`--cngx-button-secondary-color`|``|Tone|Text colour of a `secondary` button. Unset by default, so the tone text colour paints.|
|`--cngx-icon-size`|`1em`|Layout|Caret size, relative to the button font.|

## CngxMenuItem

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-menu-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outline of the menu container when it takes keyboard focus - standard 2px ring at the foundation-primary hue. The container uses `aria-activedescendant`, so it carries focus while the highlighted item is signalled separately by the highlight bg.|
|`--cngx-menu-focus-outline-width`|`2px`|State / Focus|Stroke width of the container focus ring.|
|`--cngx-menu-focus-outline-offset`|`2px`|State / Focus|Distance from the container edge to the focus ring.|
|`--cngx-menu-item-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background tint of the keyboard-highlighted item. Resolved at `:root` as `color-mix(in oklch, var(--cngx-color-primary) 10%, transparent)` so the tint tracks whichever primary the theme (cngx default, Material bridge, brand override) feeds. The `@property` initial-value below is the literal fallback used when neither the foundation token nor the `:root` declaration resolves.|
|`--cngx-menu-padding`|`4px`|Layout|Padding shorthand inside the menu container.|
|`--cngx-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each menu item.|
|`--cngx-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / suffix / kbd).|
|`--cngx-menu-item-radius`|`4px`|Layout|Corner radius of each menu item.|
|`--cngx-menu-item-checked-font-weight`|`600`|State / Checked|Font-weight applied to a checked menu item - emphasises committed state vs the transient highlight cursor.|
|`--cngx-menu-item-checked-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading check or dot indicator on a checked item. Tracks the foundation primary so the cue matches the highlight accent.|
|`--cngx-menu-item-icon-min-width`|`1.25rem`|Layout|Min-width reserved on the leading icon slot - keeps labels vertically aligned across rows when some items have icons and others don't.|
|`--cngx-menu-item-kbd-color`|`oklch(0.45 0 0)`|Surface|Color of the trailing keyboard-shortcut hint. Defaults to a muted neutral that reads as secondary info next to the label.|
|`--cngx-menu-separator-color`|`oklch(0.89 0 0)`|Surface|Color of the menu separator hairline. Tracks `--cngx-color-border`.|

## CngxMenuItemCheckbox

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-menu-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outline of the menu container when it takes keyboard focus - standard 2px ring at the foundation-primary hue. The container uses `aria-activedescendant`, so it carries focus while the highlighted item is signalled separately by the highlight bg.|
|`--cngx-menu-focus-outline-width`|`2px`|State / Focus|Stroke width of the container focus ring.|
|`--cngx-menu-focus-outline-offset`|`2px`|State / Focus|Distance from the container edge to the focus ring.|
|`--cngx-menu-item-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background tint of the keyboard-highlighted item. Resolved at `:root` as `color-mix(in oklch, var(--cngx-color-primary) 10%, transparent)` so the tint tracks whichever primary the theme (cngx default, Material bridge, brand override) feeds. The `@property` initial-value below is the literal fallback used when neither the foundation token nor the `:root` declaration resolves.|
|`--cngx-menu-padding`|`4px`|Layout|Padding shorthand inside the menu container.|
|`--cngx-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each menu item.|
|`--cngx-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / suffix / kbd).|
|`--cngx-menu-item-radius`|`4px`|Layout|Corner radius of each menu item.|
|`--cngx-menu-item-checked-font-weight`|`600`|State / Checked|Font-weight applied to a checked menu item - emphasises committed state vs the transient highlight cursor.|
|`--cngx-menu-item-checked-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading check or dot indicator on a checked item. Tracks the foundation primary so the cue matches the highlight accent.|
|`--cngx-menu-item-icon-min-width`|`1.25rem`|Layout|Min-width reserved on the leading icon slot - keeps labels vertically aligned across rows when some items have icons and others don't.|
|`--cngx-menu-item-kbd-color`|`oklch(0.45 0 0)`|Surface|Color of the trailing keyboard-shortcut hint. Defaults to a muted neutral that reads as secondary info next to the label.|
|`--cngx-menu-separator-color`|`oklch(0.89 0 0)`|Surface|Color of the menu separator hairline. Tracks `--cngx-color-border`.|

## CngxMenuItemRadio

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-menu-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outline of the menu container when it takes keyboard focus - standard 2px ring at the foundation-primary hue. The container uses `aria-activedescendant`, so it carries focus while the highlighted item is signalled separately by the highlight bg.|
|`--cngx-menu-focus-outline-width`|`2px`|State / Focus|Stroke width of the container focus ring.|
|`--cngx-menu-focus-outline-offset`|`2px`|State / Focus|Distance from the container edge to the focus ring.|
|`--cngx-menu-item-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background tint of the keyboard-highlighted item. Resolved at `:root` as `color-mix(in oklch, var(--cngx-color-primary) 10%, transparent)` so the tint tracks whichever primary the theme (cngx default, Material bridge, brand override) feeds. The `@property` initial-value below is the literal fallback used when neither the foundation token nor the `:root` declaration resolves.|
|`--cngx-menu-padding`|`4px`|Layout|Padding shorthand inside the menu container.|
|`--cngx-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each menu item.|
|`--cngx-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / suffix / kbd).|
|`--cngx-menu-item-radius`|`4px`|Layout|Corner radius of each menu item.|
|`--cngx-menu-item-checked-font-weight`|`600`|State / Checked|Font-weight applied to a checked menu item - emphasises committed state vs the transient highlight cursor.|
|`--cngx-menu-item-checked-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading check or dot indicator on a checked item. Tracks the foundation primary so the cue matches the highlight accent.|
|`--cngx-menu-item-icon-min-width`|`1.25rem`|Layout|Min-width reserved on the leading icon slot - keeps labels vertically aligned across rows when some items have icons and others don't.|
|`--cngx-menu-item-kbd-color`|`oklch(0.45 0 0)`|Surface|Color of the trailing keyboard-shortcut hint. Defaults to a muted neutral that reads as secondary info next to the label.|
|`--cngx-menu-separator-color`|`oklch(0.89 0 0)`|Surface|Color of the menu separator hairline. Tracks `--cngx-color-border`.|

## CngxMenuItemSubmenu

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-menu-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outline of the menu container when it takes keyboard focus - standard 2px ring at the foundation-primary hue. The container uses `aria-activedescendant`, so it carries focus while the highlighted item is signalled separately by the highlight bg.|
|`--cngx-menu-focus-outline-width`|`2px`|State / Focus|Stroke width of the container focus ring.|
|`--cngx-menu-focus-outline-offset`|`2px`|State / Focus|Distance from the container edge to the focus ring.|
|`--cngx-menu-item-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background tint of the keyboard-highlighted item. Resolved at `:root` as `color-mix(in oklch, var(--cngx-color-primary) 10%, transparent)` so the tint tracks whichever primary the theme (cngx default, Material bridge, brand override) feeds. The `@property` initial-value below is the literal fallback used when neither the foundation token nor the `:root` declaration resolves.|
|`--cngx-menu-padding`|`4px`|Layout|Padding shorthand inside the menu container.|
|`--cngx-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each menu item.|
|`--cngx-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / suffix / kbd).|
|`--cngx-menu-item-radius`|`4px`|Layout|Corner radius of each menu item.|
|`--cngx-menu-item-checked-font-weight`|`600`|State / Checked|Font-weight applied to a checked menu item - emphasises committed state vs the transient highlight cursor.|
|`--cngx-menu-item-checked-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading check or dot indicator on a checked item. Tracks the foundation primary so the cue matches the highlight accent.|
|`--cngx-menu-item-icon-min-width`|`1.25rem`|Layout|Min-width reserved on the leading icon slot - keeps labels vertically aligned across rows when some items have icons and others don't.|
|`--cngx-menu-item-kbd-color`|`oklch(0.45 0 0)`|Surface|Color of the trailing keyboard-shortcut hint. Defaults to a muted neutral that reads as secondary info next to the label.|
|`--cngx-menu-separator-color`|`oklch(0.89 0 0)`|Surface|Color of the menu separator hairline. Tracks `--cngx-color-border`.|

## CngxMenuSeparator

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-menu-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outline of the menu container when it takes keyboard focus - standard 2px ring at the foundation-primary hue. The container uses `aria-activedescendant`, so it carries focus while the highlighted item is signalled separately by the highlight bg.|
|`--cngx-menu-focus-outline-width`|`2px`|State / Focus|Stroke width of the container focus ring.|
|`--cngx-menu-focus-outline-offset`|`2px`|State / Focus|Distance from the container edge to the focus ring.|
|`--cngx-menu-item-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background tint of the keyboard-highlighted item. Resolved at `:root` as `color-mix(in oklch, var(--cngx-color-primary) 10%, transparent)` so the tint tracks whichever primary the theme (cngx default, Material bridge, brand override) feeds. The `@property` initial-value below is the literal fallback used when neither the foundation token nor the `:root` declaration resolves.|
|`--cngx-menu-padding`|`4px`|Layout|Padding shorthand inside the menu container.|
|`--cngx-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each menu item.|
|`--cngx-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / suffix / kbd).|
|`--cngx-menu-item-radius`|`4px`|Layout|Corner radius of each menu item.|
|`--cngx-menu-item-checked-font-weight`|`600`|State / Checked|Font-weight applied to a checked menu item - emphasises committed state vs the transient highlight cursor.|
|`--cngx-menu-item-checked-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading check or dot indicator on a checked item. Tracks the foundation primary so the cue matches the highlight accent.|
|`--cngx-menu-item-icon-min-width`|`1.25rem`|Layout|Min-width reserved on the leading icon slot - keeps labels vertically aligned across rows when some items have icons and others don't.|
|`--cngx-menu-item-kbd-color`|`oklch(0.45 0 0)`|Surface|Color of the trailing keyboard-shortcut hint. Defaults to a muted neutral that reads as secondary info next to the label.|
|`--cngx-menu-separator-color`|`oklch(0.89 0 0)`|Surface|Color of the menu separator hairline. Tracks `--cngx-color-border`.|

## CngxMeta

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-meta-gap`|`var(--cngx-space-xs, 0.35em)`|Layout|Gap between the parts of a meta item.|

## CngxMetaList

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-meta-list-gap`|`var(--cngx-space-sm, 0.4rem) var(--cngx-space-md, 1.2rem)`|Layout|Row and column gap between the wrapped meta items.|

## CngxMetric

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-metric-gap`|`2px`|Layout|Gap between the value and the unit slot.|
|`--cngx-metric-value-size`|`1.75rem`|Typography|Font-size of the value slot.|
|`--cngx-metric-value-weight`|`600`|Typography|Font-weight of the value slot.|
|`--cngx-metric-value-color`|`oklch(0.2 0.01 290)`|Typography|Text color of the value slot.|
|`--cngx-metric-unit-size`|`0.875rem`|Typography|Font-size of the unit slot.|
|`--cngx-metric-unit-weight`|`400`|Typography|Font-weight of the unit slot.|
|`--cngx-metric-unit-color`|`oklch(0.36 0.02 290)`|Typography|Text color of the unit slot - muted by default.|

## CngxMiniArea

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back through the consumer-facing `--accent` and then to the foundation `--cngx-color-primary` (Ember).|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame. Registered with `inherits: true` deliberately: with `inherits: false` a value set on `:root` or any container resets to the initial value at every element boundary and never reaches the chart host, silently no-opping the documented consumer override.|
|`--cngx-chart-numeric-bidi`|`isolate`|Typography|`unicode-bidi` of every numeric chart label (axis ticks, legend, threshold and band labels). Set to `normal` to opt out of isolation.|
|`--cngx-area-fill`|`var(--cngx-mini-area-color, var(--cngx-chart-primary, currentColor))`|Surface|Fill colour of the area layer inside the mini area. Derived from --cngx-mini-area-color.|

## CngxMiniBar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back through the consumer-facing `--accent` and then to the foundation `--cngx-color-primary` (Ember).|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame. Registered with `inherits: true` deliberately: with `inherits: false` a value set on `:root` or any container resets to the initial value at every element boundary and never reaches the chart host, silently no-opping the documented consumer override.|
|`--cngx-chart-numeric-bidi`|`isolate`|Typography|`unicode-bidi` of every numeric chart label (axis ticks, legend, threshold and band labels). Set to `normal` to opt out of isolation.|
|`--cngx-mini-bar-color`|`var(--cngx-bar-color, var(--cngx-chart-primary, currentColor))`|Surface|Colour of the mini bar fill. Derived from --cngx-bar-color.|

## CngxMultiChipGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-multi-chip-group-gap`|`0.5rem`|Layout|Gap between chip children. Cascades through the single-select group's `--cngx-chip-group-gap` and then `--cngx-space-sm`.|

## CngxMultiSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel host (anchor-positioned, may sit outside the normal DOM flow).|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through `--cngx-color-surface`.|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value `currentColor` lets the panel inherit text color from its ancestor by default. Registering as `<color>` would forbid `currentColor` since `<color>` requires a computationally- independent value.|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the floating panel host.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-action-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the separator between the action region and the options: on the block-start side of a bottom action, the block-end side of a top action. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel. Set it to `none` to drop the separator.|
|`--cngx-select-action-padding`|`0.25rem`|Layout|Space between the action separator and the action content.|
|`--cngx-select-action-margin`|`0.25rem`|Layout|Space between the options and the action separator.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven, so dense rows stay compact) and composes into the touch-target floor via `max()`. A `0px` rather than `auto` default is deliberate: `auto` cannot be an argument to `max()`, and the floor needs to compose the row height against `--cngx-target-min`.|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a low-alpha tint of `--cngx-color-primary` so the highlight reads as brand-accented without competing with selection state.|
|`--cngx-select-option-active-indicator`|`oklch(0.5 0.2 275)`|State|Colour of the inline-start indicator bar on the keyboard-active row. The background tint alone is ~1.1:1 against the panel; this opaque bar carries the active affordance at >= 3:1. Delegates to the primary colour below, so it follows the scheme and a re-theme.|
|`--cngx-select-option-multi-selected-bg`|`transparent`|State / Selected|Background of a selected row in a multi-value panel whose selection indicator renders. Transparent by default: the checkbox carries the selection, so a mostly-selected panel does not turn into a solid block. Assign a colour to opt the fill back in. Single-value panels and rows with the indicator hidden keep `--cngx-option-selected-bg`.|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through `--cngx-color-primary`.|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant. Muted by default to mirror the placeholder token; the Material bridge maps it to `--mat-sys-on-surface-variant`. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks the same muted default as the caret so both trigger affordances read uniformly. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-caret-size`|`1.6em`|Layout|Font-size of the dropdown caret glyph shared across every variant. Read at the caret span (a trigger descendant), so `inherits: true` is load-bearing: with `inherits: false` the registered initial would always win at the caret and no consumer or composing organism could ever set the token (the inherits:false trap). The default glyph box never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a caret smaller than the 12px micro box.|
|`--cngx-select-clear-target-min`|`24px`|Layout|Fine-pointer hit-area floor of the clear button, on both axes. The 24px default meets WCAG 2.5.8 (AA); under the touch floor the larger `--cngx-target-min` wins. The trigger row keeps its height: the box hands back what it adds over the control line box. `inherits: true` so a trigger-level or ancestor override reaches the button.|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-skeleton-shimmer`|`oklch(0.2 0.01 250)`|State / Loading|Base colour the skeleton shimmer gradient is mixed from. Defaults from the foundation text colour, so the shimmer darkens a light panel and lightens a dark one in every scheme (OS, a `data-color-scheme` island, or a consumer light theme under OS dark) without a hardcoded dark-mode swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-option-spinner-track`|`oklch(0 0 0 / 0.15)`|State / Commit|Track (resting ring) colour of the per-option commit spinner. Defaults from the foundation text colour at a low alpha, so it reads on the panel in every scheme without a dark swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true` so the :root dark-mode override (alpha-on-white on dark) reaches the spinner inside the floating panel.|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to `--cngx-color-primary`.|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.46 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a reorderable chip wrap.|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-reorder-move-size`|`0.75em`|Layout|Size of the move-up / move-down glyph in the reorder list the panel shows under the touch floor: the box of the default triangles (still floored at the 0.75rem micro floor) and the font-size of a projected `*cngxMultiSelectMoveGlyph`. Read at the move button (a descendant of the select host), so `inherits: true` is load-bearing: with `inherits: false` a host-level override would never reach it.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the chip while it's being dragged.|
|`--cngx-select-chip-drag-bg`|`oklch(0.58 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Defaults track `--cngx-color-primary-strong` via the delegating entries below.|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state. Defaults track `--cngx-color-on-primary-strong`, which holds 4.5:1 on the drag background in both schemes.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to `--cngx-color-primary`.|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of every error surface. Falls back to `--cngx-color-danger`.|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a `box-shadow` so it composes with any consumer-supplied focus outline.|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-commit-error-hint-color`|`oklch(0.5 0.2 25)`|State / Commit|Text colour of the commit-error hint shown under a closed trigger. Defaults to the danger-text contrast tier so it clears 4.5:1 like the inline banner.|
|`--cngx-select-commit-error-hint-margin`|`0.25rem`|State / Commit|Block-start margin of the commit-error hint, set from the density scale.|
|`--cngx-select-reorder-list-max-block-size`|`40dvh`|Layout|Height cap of the sortable list of selected values that a reorderable select shows in its sheet under the touch floor. A longer selection scrolls inside the list, so the options below stay reachable.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|
|`--cngx-select-message-padding`|`var(--cngx-space-sm) var(--cngx-space-sm)`|Layout|Padding of the loading and empty message rows in the panel.|
|`--cngx-select-chip-fit-badge-reserve`|`5ch`|State / Overflow|Inline space a `chipOverflow: 'fit'` strip keeps free for the `+N` badge. The badge slot is exactly this wide and clips a wider badge; raise it for a projected `*cngxSelectChipOverflow` or a custom `chipOverflowBadge` formatter. Set it on the select, a container or `:root`. Never assigned by the library, so the `5ch` fallback (room for `+99`) resolves against the strip font.|
|`--cngx-multi-select-min-width`|`var(--cngx-select-min-width, 10rem)`|Layout|Preferred minimum inline size of the select. A standalone or toolbar select is at least this wide; a narrower cell shrinks it, as it does an input. Falls back to `--cngx-select-min-width`; see {@link --cngx-select-min-width} for why no `initial-value` is declared.|
|`--cngx-multi-select-gap`|`var(--cngx-select-gap, var(--cngx-space-sm, 0.5rem))`|Layout|Gap between the chip list, placeholder, caret, and clear button. Falls back to `--cngx-select-gap`; see {@link --cngx-select-gap} for why no `initial-value` is declared.|
|`--cngx-multi-select-padding`|`var(--cngx-select-padding, var(--cngx-space-sm, 0.5rem) var(--cngx-space-md, 0.75rem))`|Layout|Padding shorthand of the trigger. Falls back to `--cngx-select-padding`; see {@link --cngx-select-padding} for why no `initial-value` is declared.|
|`--cngx-multi-select-border`|`var(--cngx-select-border, 1px solid var(--cngx-color-border-strong))`|Surface|Border shorthand of the trigger. Falls back to `--cngx-select-border`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-multi-select-radius`|`var(--cngx-select-radius, var(--cngx-radius-md, 8px))`|Layout|Corner radius of the trigger. Falls back to `--cngx-select-radius`; see {@link --cngx-select-radius} for why no `initial-value` is declared.|
|`--cngx-multi-select-bg`|`var(--cngx-select-bg, transparent)`|Surface|Background of the trigger. Falls back to `--cngx-select-bg`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-multi-select-color`|`var(--cngx-select-color, inherit)`|Surface|Text color of the trigger. Falls back to `--cngx-select-color`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-multi-select-min-height`|`var(--cngx-select-min-height, 2.125rem)`|Layout|Minimum block size of the trigger - fits a single row of chips. Falls back to `--cngx-select-min-height`; see {@link --cngx-select-min-height} for why no `initial-value` is declared. The touch floor still lifts the trigger to `--cngx-target-min`.|
|`--cngx-multi-select-focus-outline`|`var(--cngx-select-focus-outline, 2px solid var(--cngx-color-primary))`|State / Focus|Focus-ring outline shorthand of the trigger. Falls back to `--cngx-select-focus-outline`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|

## CngxNavBadge

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxNavFooter

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxNavGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxNavGroupContent

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxNavHeader

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxNavIcon

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxNavLabel

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxNavLink

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxNavMark

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxNavName

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-nav-link-padding`|``|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-padding-inline`|``|Layout|Inline padding of a nav row, and the inline offset of the header, footer and section label past the row inset. One value, so a mark and a label stay at the row icon x and label x. The default row padding reads it; a container that SETs the `--cngx-nav-link-padding` shorthand builds it from this token to keep the slots aligned.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-inset`|`4px`|Layout|Inline inset of each nav row from the container edges. SET from `--cngx-space-xs` at the root; a container may SET its own.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-pressed-bg`|`oklch(0 0 0 / 0.06)`|State / Pressed|Background while a nav row is pressed (`:active`). Sits between the hover and the active fill; a pressed active row keeps the active-hover fill.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-hover-bg`|`oklch(0 0 0 / 0.1)`|State / Active|Background of the active nav link under the pointer. The strongest fill, so hovering the active row still answers.|
|`--cngx-nav-link-active-indicator-color`|`oklch(0.54 0.19 50)`|State / Active|Colour of the bar on the inline-start edge of the active nav link. SET from `--cngx-color-primary-text` (the 4.5:1 text rung), so it holds 3:1 on the active fills; `transparent` drops the bar for a fill-only look.|
|`--cngx-nav-link-active-indicator-size`|`3px`|State / Active|Inline size of the active indicator bar. SET from `--cngx-space-xs`, so it follows density; `0` drops the bar.|
|`--cngx-nav-link-active-indicator-inset`|`8px`|State / Active|Block-axis inset of the active indicator bar from the row's top and bottom edges. SET from `--cngx-space-sm`.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outer colour of the double keyboard focus ring on a nav row. SET from `--cngx-color-text`, so the ring stays apart from the active hue on every fill.|
|`--cngx-nav-link-focus-inner-color`|`oklch(0.97 0.005 250)`|State / Focus|Inner colour of the double keyboard focus ring, drawn inside the outer ring at the same width. SET from `--cngx-color-surface` (a sidenav SETs its own surface), so the outer ring reads against a band of the container surface on any fill.|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets pull the ring inside the link bounds so a fully-padded link doesn't shove its neighbours when focused.|
|`--cngx-nav-link-initial-size`|`0.875rem`|Typography|Font-size of the first-letter fallback drawn in the icon box of a row without `[cngxNavIcon]`.|
|`--cngx-nav-icon-size`|``|Layout|Inline and block size of the icon box at the start of every row. Unset by default (falls back to `1.25rem`).|
|`--cngx-nav-icon-gap`|``|Layout|Gap between the icon box and the row label. Unset by default (falls back to `--cngx-space-sm`, so it follows `[data-density]`).|
|`--cngx-nav-link-ink`|``|Surface|Ink of the icon and of the letter fallback, independent of the label text colour. Unset by default (falls back to `currentColor`).|
|`--cngx-nav-header-padding-block`|``|Layout|Block padding of the header. Unset by default (falls back to `--cngx-space-md`). The inline padding is derived from the row geometry, so the mark lines up with the row icons.|
|`--cngx-nav-header-bg`|`transparent`|Surface|Background of the header.|
|`--cngx-nav-header-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider under the header.|
|`--cngx-nav-header-font-size`|`0.875rem`|Typography|Font-size of the header.|
|`--cngx-nav-footer-padding-block`|``|Layout|Block padding of the footer. Unset by default (falls back to `--cngx-space-md`).|
|`--cngx-nav-footer-bg`|`transparent`|Surface|Background of the footer.|
|`--cngx-nav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Colour of the divider above the footer.|
|`--cngx-nav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer.|
|`--cngx-nav-label-color`|`currentColor`|Typography|Text colour of a section label.|
|`--cngx-nav-label-font-size`|`0.75rem`|Typography|Font-size of a section label.|
|`--cngx-nav-label-padding`|``|Layout|Padding shorthand of a section label. Unset by default: the label then aligns its text with the row text and follows `[data-density]`.|
|`--cngx-nav-badge-bg`|`oklch(0.58 0.19 50)`|Surface|Fill of a count badge and of a dot badge.|
|`--cngx-nav-badge-color`|`oklch(1 0 0)`|Surface|Text colour of a count badge.|
|`--cngx-nav-badge-font-size`|`0.75rem`|Typography|Font-size of a count or status badge.|
|`--cngx-nav-badge-dot-size`|`8px`|Layout|Diameter of a dot badge.|
|`--cngx-nav-chevron-size`|`6px`|Layout|Arm length of the group head chevron.|

## CngxOption

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-listbox-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outline of the listbox container when it takes keyboard focus. The container uses `aria-activedescendant`, so it carries focus while the highlighted option is signalled separately by the highlight bg.|
|`--cngx-listbox-focus-outline-width`|`2px`|State / Focus|Stroke width of the container focus ring.|
|`--cngx-listbox-focus-outline-offset`|`2px`|State / Focus|Distance from the container edge to the focus ring.|
|`--cngx-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background tint of the keyboard-highlighted option. Low-alpha primary so the highlight reads as an accent without competing with selected-state visuals.|
|`--cngx-option-selected-bg`|`oklch(0.66 0.19 50 / 0.18)`|State / Selected|Background of a selected option. Slightly higher alpha than the highlight tint so selection reads as committed state rather than transient cursor position.|
|`--cngx-listbox-padding`|`4px`|Layout|Padding shorthand inside the listbox container.|
|`--cngx-option-padding`|`6px 10px`|Layout|Padding shorthand on each option.|
|`--cngx-option-radius`|`4px`|Layout|Corner radius of each option.|

## CngxPaginator

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-paginator-button-padding`|`0 var(--cngx-space-sm)`|Layout|Padding of every paginator button.|
|`--cngx-paginator-goto-padding`|`0 var(--cngx-space-sm)`|Layout|Padding of the go-to-page input.|
|`--cngx-paginator-select-gap`|`var(--cngx-space-xs)`|Layout|Gap between the value and the caret in the select trigger.|
|`--cngx-paginator-overflow-gap`|`var(--cngx-space-xs)`|Popover|Gap between the cells of the ellipsis overflow grid.|
|`--cngx-paginator-alpha-gap`|`var(--cngx-space-sm)`|Layout|Gap between the chips of the alphabetical / category strip.|
|`--cngx-paginator-infinite-gap`|`var(--cngx-space-sm)`|Layout|Gap between the items of the infinite-scroll trigger row.|
|`--cngx-paginator-load-more-gap`|`var(--cngx-space-sm)`|Layout|Gap between the label and the count in the load-more trigger.|
|`--cngx-paginator-infinite-padding`|`var(--cngx-space-md)`|Layout|Padding of the infinite-scroll trigger row.|
|`--cngx-paginator-dot-pad`|`max(
      (var(--cngx-target-min, 0px) - var(--cngx-paginator-dot-size, 0.5rem)) / 2,
      0px
    )`|Layout|Hit padding around each dot, derived so the dot button reaches `--cngx-target-min`. `0px` while no touch-target floor is active.|
|`--cngx-paginator-dot-slot`|`calc(
      var(--cngx-paginator-dot-size, 0.5rem) + 2 * var(--cngx-paginator-dot-pad)
    )`|Layout|Layout size of one dot button (dot size plus hit padding). The windowed viewport clip and the track translate derive from it.|
|`--cngx-paginator-gap`|`0.25rem`|Layout|Gap between adjacent cells.|
|`--cngx-paginator-collapse`|`auto`|Layout|Set to `none` on the paginator or any ancestor to keep the full number row at every container width (opt out of the responsive collapse).|
|`--cngx-paginator-row-gap`|`12px`|Layout|Gap between adjacent segment rows on the host. Split from `--cngx-paginator-gap` (the inter-page gap) so the projected segments breathe while the page numerals stay tight.|
|`--cngx-paginator-button-size`|`36px`|Layout|Hit-target size (min-width and height) of every paginator button.|
|`--cngx-paginator-button-radius`|`8px`|Layout|Corner radius of a paginator button.|
|`--cngx-paginator-button-color`|`currentColor`|Surface|Resting button text colour.|
|`--cngx-paginator-button-bg`|`transparent`|Surface|Resting button background.|
|`--cngx-paginator-button-hover-bg`|`color-mix(in oklch, currentColor 10%, transparent)`|Surface|Hover background of a button.|
|`--cngx-paginator-button-border-color`|`transparent`|Surface|Border colour of a resting button.|
|`--cngx-paginator-current-bg`|`oklch(0.66 0.19 50)`|State / Active|Background of the active page button. Delegates to `--cngx-color-primary`.|
|`--cngx-paginator-current-color`|`oklch(1 0 0)`|State / Active|Text colour of the active page button (reads against the primary fill).|
|`--cngx-paginator-current-border-color`|`transparent`|State / Active|Border colour of the active page button.|
|`--cngx-paginator-focus-ring`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand.|
|`--cngx-paginator-track-bg`|`oklch(0.96 0 0)`|Skin|Muted track the page row sits in under the `segmented` skin. Derived from surface + border so it tracks the foundation light / dark scheme.|
|`--cngx-paginator-active-shadow`|`0 1px 2px oklch(0 0 0 / 0.06)`|Skin|Drop shadow that raises the active page off the track under the `segmented` skin.|
|`--cngx-paginator-indicator-thickness`|`2px`|Skin|Thickness of the `numbered` skin's active-page underline bar.|
|`--cngx-paginator-rail-color`|`oklch(0.88 0.005 250)`|Skin|Colour of the hairline rail the page row rode under the old `rail` skin.|
|`--cngx-paginator-rail-thickness`|`2px`|Skin|Thickness of the old `rail` skin's underline + position marker.|
|`--cngx-paginator-rail-knob-size`|`14px`|Skin|Diameter of the `rail` skin's position knob (the dot riding the fill edge).|
|`--cngx-paginator-rail-knob-bg`|`oklch(1 0 0)`|Skin|Fill of the `rail` skin's position knob. Defaults to the foundation surface.|
|`--cngx-paginator-rail-knob-border-color`|`oklch(0.66 0.19 50)`|Skin|Ring colour of the `rail` skin's position knob. Defaults to the primary.|
|`--cngx-paginator-bar-border-color`|`oklch(0.88 0.005 250)`|Skin|Border + divider colour of the enclosed `bar` skin.|
|`--cngx-paginator-bar-radius`|`6px`|Skin|Corner radius of the enclosed `bar` skin's outer box.|
|`--cngx-paginator-hover-scale`|`1`|Motion|Scale a button grows to on hover. Defaults to `1` (no grow) - the resting hover is the background tint; opt into a grow by raising this. Flattened to `1` under reduced motion.|
|`--cngx-paginator-press-scale`|`1`|Motion|Scale a button grows to while pressed. Defaults to `1` (no pop); opt in by raising this. Flattened to `1` under reduced motion.|
|`--cngx-paginator-motion-duration`|`200ms`|Motion|Duration of the hover / press / focus transitions. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-paginator-fade-duration`|`250ms`|Motion|Duration of the page-row crossfade while the host reports busy. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-paginator-busy-opacity`|`0.6`|State / Busy|Opacity the page row fades to while the host reports busy.|
|`--cngx-paginator-focus-halo`|`0 0 0 4px color-mix(in oklch, currentColor 18%, transparent)`|State / Focus|Soft halo painted behind the focus-visible outline.|
|`--cngx-paginator-dot-size`|`8px`|Skin|Diameter of a resting (full-size) dot in the `dots` indicator.|
|`--cngx-paginator-dot-gap`|`8px`|Skin|Gap between adjacent dots.|
|`--cngx-paginator-dot-color`|`oklch(0.7 0 0 / 0.35)`|Skin|Fill of an inactive dot.|
|`--cngx-paginator-dot-current-color`|`oklch(0.66 0.19 50)`|Skin|Fill of the active dot. Delegates to `--cngx-color-primary`.|
|`--cngx-paginator-panel-bg`|`Canvas`|Popover|Surface of the popover panel shared by the items-per-page / page-of-pages listbox segments and the ellipsis overflow menu.|
|`--cngx-paginator-panel-color`|`currentColor`|Popover|Text colour inside the popover panel.|
|`--cngx-paginator-panel-border-color`|`color-mix(in oklch, currentColor 20%, transparent)`|Popover|Border colour of the popover panel.|
|`--cngx-paginator-panel-radius`|`8px`|Popover|Corner radius of the popover panel.|
|`--cngx-paginator-panel-padding`|`0.25rem`|Popover|Inner padding of the popover panel.|
|`--cngx-paginator-panel-shadow`|`0 4px 12px rgb(0 0 0 / 0.15)`|Popover|Drop shadow lifting the popover panel off the page.|
|`--cngx-paginator-option-size`|`32px`|Popover|Minimum height of a popover row (page-size option / hidden-page item).|
|`--cngx-paginator-option-padding`|`0 0.75rem`|Popover|Inner padding of a popover row.|
|`--cngx-paginator-option-radius`|`4px`|Popover|Corner radius of a popover row.|
|`--cngx-paginator-option-hover-bg`|`color-mix(in oklch, currentColor 10%, transparent)`|Popover|Background of a hovered / keyboard-highlighted popover row. Shared by the listbox segments and the ellipsis overflow menu.|
|`--cngx-paginator-option-selected-bg`|`color-mix(in oklch, oklch(0.66 0.19 50) 14%, transparent)`|Popover|Background of the selected page-size row in the items-per-page panel.|
|`--cngx-paginator-option-selected-color`|`oklch(0.66 0.19 50)`|Popover|Text colour of the selected page-size row (reads as accent against the tint).|
|`--cngx-paginator-overflow-columns`|`5`|Popover|Column count of the ellipsis overflow grid panel.|
|`--cngx-paginator-overflow-cell-size`|`32px`|Popover|Cell size (column width + row min-height) of the ellipsis overflow grid.|

## CngxPaginatorAlpha

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-paginator-button-padding`|`0 var(--cngx-space-sm)`|Layout|Padding of every paginator button.|
|`--cngx-paginator-goto-padding`|`0 var(--cngx-space-sm)`|Layout|Padding of the go-to-page input.|
|`--cngx-paginator-select-gap`|`var(--cngx-space-xs)`|Layout|Gap between the value and the caret in the select trigger.|
|`--cngx-paginator-overflow-gap`|`var(--cngx-space-xs)`|Popover|Gap between the cells of the ellipsis overflow grid.|
|`--cngx-paginator-alpha-gap`|`var(--cngx-space-sm)`|Layout|Gap between the chips of the alphabetical / category strip.|
|`--cngx-paginator-infinite-gap`|`var(--cngx-space-sm)`|Layout|Gap between the items of the infinite-scroll trigger row.|
|`--cngx-paginator-load-more-gap`|`var(--cngx-space-sm)`|Layout|Gap between the label and the count in the load-more trigger.|
|`--cngx-paginator-infinite-padding`|`var(--cngx-space-md)`|Layout|Padding of the infinite-scroll trigger row.|
|`--cngx-paginator-dot-pad`|`max(
      (var(--cngx-target-min, 0px) - var(--cngx-paginator-dot-size, 0.5rem)) / 2,
      0px
    )`|Layout|Hit padding around each dot, derived so the dot button reaches `--cngx-target-min`. `0px` while no touch-target floor is active.|
|`--cngx-paginator-dot-slot`|`calc(
      var(--cngx-paginator-dot-size, 0.5rem) + 2 * var(--cngx-paginator-dot-pad)
    )`|Layout|Layout size of one dot button (dot size plus hit padding). The windowed viewport clip and the track translate derive from it.|

## CngxPanelToggle

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-padding-block`|`0.5rem`|Layout|Block padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-padding-inline`|`1rem`|Layout|Inline padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-gap`|`0.5rem`|Layout|Gap between the slots and the label.|
|`--cngx-button-font-size`|`1rem`|Typography|Font size. `md` reads the form-control font so the button shares the control line box.|
|`--cngx-button-radius`|`0.5rem`|Layout|Corner radius.|
|`--cngx-button-border-width`|`1px`|Layout|Border width on all four sides; transparent where the variant paints none, so every variant shares one box.|
|`--cngx-button-transition`|`150ms`|Motion|Transition duration for colour changes. Derives from the `--cngx-duration-fast` rung of the motion scale.|
|`--cngx-button-tone`|`currentColor`|Tone|Tone colour: the outline border, the hover wash, and the solid fill unless `--cngx-button-tone-fill` is set.|
|`--cngx-button-tone-text`|`currentColor`|Tone|Text colour on a transparent or tonal surface.|
|`--cngx-button-on-tone`|`Canvas`|Tone|Text colour on the solid tone fill.|
|`--cngx-button-tone-fill`|``|Tone|Solid fill colour. Set by the primary and danger tones to the strong palette rung their on-colour clears 4.5:1 against; unset, the solid fill falls back to `--cngx-button-tone`. Outline, secondary, ghost and link keep painting from `--cngx-button-tone`. Registered without an initial value so the fallback stays live.|
|`--cngx-button-spinner-size`|`1em`|Busy|Diameter of the busy spinner ring, and the box of a bare `svg` or `img` drawn by a `provideButtonSpinner` component.|
|`--cngx-button-spinner-thickness`|`2px`|Busy|Stroke width of the busy spinner ring. Inherits so a value set on the button reaches the ring inside the busy layer.|
|`--cngx-button-hover-shade`|`oklch(0 0 0)`|Tone|Colour a solid button's tone mixes towards on hover and press (by `--cngx-button-hover-layer` / `--cngx-button-pressed-layer`), so the fill darkens without a second tone token.|
|`--cngx-button-link-hover-thickness`|`2px`|Tone|Underline thickness of a `link` button on hover; at rest it keeps the font's own underline.|
|`--cngx-button-icon-size`|`1.25em`|Layout|Edge length of an `svg` or `img` in a start or end slot. Same rung as `--cngx-icon-size-md`, so a projected `cngx-icon` and a bare `svg` match. Inherits so a value set on the button reaches the slot glyph.|
|`--cngx-button-neutral-tint`|`5%`|Tone|Tint strength of a neutral `secondary` fill and its hover. Light text on a dark surface reads a small tint as almost nothing, so the dark scheme steps both up.|
|`--cngx-button-neutral-tint-hover`|`9%`|Tone|Hover tint strength of a neutral `secondary` fill.|
|`--cngx-button-hover-layer`|`12%`|State / Hover|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill on hover, a state layer. A theme maps it to its hover state-layer opacity (the Material bridge: `--mat-sys-hover-state-layer-opacity`).|
|`--cngx-button-pressed-layer`|`20%`|State / Pressed|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill while pressed, one step above `--cngx-button-hover-layer`. A theme maps it to its pressed state-layer opacity (the Material bridge: `--mat-sys-pressed-state-layer-opacity`).|
|`--cngx-button-pressed-wash`|`12%`|State / Pressed|Tone wash of a pressed `outline` or `ghost` button (hover takes 8%).|
|`--cngx-button-neutral-tint-pressed`|`13%`|State / Pressed|Pressed tint strength of a neutral `secondary` fill, one step above `--cngx-button-neutral-tint-hover`; the dark scheme steps it up.|
|`--cngx-button-secondary-bg-pressed`|``|State / Pressed|Pressed fill of a `secondary` button. Unset by default, so the pressed tone mix paints; a theme sets it next to `--cngx-button-secondary-bg-hover`.|
|`--cngx-button-secondary-bg`|``|Tone|Fill of a `secondary` button. Unset by default, so the fill is the tone mixed into transparency (the neutral tint for `neutral`, 12% otherwise). A theme sets it to paint a container colour instead (the Material bridge maps it to the `*-container` roles).|
|`--cngx-button-secondary-bg-hover`|``|Tone|Hover fill of a `secondary` button. Unset by default, so hover steps the tone mix up.|
|`--cngx-button-secondary-color`|``|Tone|Text colour of a `secondary` button. Unset by default, so the tone text colour paints.|

## CngxPasswordStrengthMeter

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-password-strength-meter-gap`|`var(--cngx-space-xs, 0.25rem)`|Layout|Gap between the four strength segments.|

## CngxPhoneInput

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-phone-input-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Gap between the country selector and the number input.|

## CngxPopoverAction

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-padding-block`|`0.5rem`|Layout|Block padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-padding-inline`|`1rem`|Layout|Inline padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-gap`|`0.5rem`|Layout|Gap between the slots and the label.|
|`--cngx-button-font-size`|`1rem`|Typography|Font size. `md` reads the form-control font so the button shares the control line box.|
|`--cngx-button-radius`|`0.5rem`|Layout|Corner radius.|
|`--cngx-button-border-width`|`1px`|Layout|Border width on all four sides; transparent where the variant paints none, so every variant shares one box.|
|`--cngx-button-transition`|`150ms`|Motion|Transition duration for colour changes. Derives from the `--cngx-duration-fast` rung of the motion scale.|
|`--cngx-button-tone`|`currentColor`|Tone|Tone colour: the outline border, the hover wash, and the solid fill unless `--cngx-button-tone-fill` is set.|
|`--cngx-button-tone-text`|`currentColor`|Tone|Text colour on a transparent or tonal surface.|
|`--cngx-button-on-tone`|`Canvas`|Tone|Text colour on the solid tone fill.|
|`--cngx-button-tone-fill`|``|Tone|Solid fill colour. Set by the primary and danger tones to the strong palette rung their on-colour clears 4.5:1 against; unset, the solid fill falls back to `--cngx-button-tone`. Outline, secondary, ghost and link keep painting from `--cngx-button-tone`. Registered without an initial value so the fallback stays live.|
|`--cngx-button-spinner-size`|`1em`|Busy|Diameter of the busy spinner ring, and the box of a bare `svg` or `img` drawn by a `provideButtonSpinner` component.|
|`--cngx-button-spinner-thickness`|`2px`|Busy|Stroke width of the busy spinner ring. Inherits so a value set on the button reaches the ring inside the busy layer.|
|`--cngx-button-hover-shade`|`oklch(0 0 0)`|Tone|Colour a solid button's tone mixes towards on hover and press (by `--cngx-button-hover-layer` / `--cngx-button-pressed-layer`), so the fill darkens without a second tone token.|
|`--cngx-button-link-hover-thickness`|`2px`|Tone|Underline thickness of a `link` button on hover; at rest it keeps the font's own underline.|
|`--cngx-button-icon-size`|`1.25em`|Layout|Edge length of an `svg` or `img` in a start or end slot. Same rung as `--cngx-icon-size-md`, so a projected `cngx-icon` and a bare `svg` match. Inherits so a value set on the button reaches the slot glyph.|
|`--cngx-button-neutral-tint`|`5%`|Tone|Tint strength of a neutral `secondary` fill and its hover. Light text on a dark surface reads a small tint as almost nothing, so the dark scheme steps both up.|
|`--cngx-button-neutral-tint-hover`|`9%`|Tone|Hover tint strength of a neutral `secondary` fill.|
|`--cngx-button-hover-layer`|`12%`|State / Hover|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill on hover, a state layer. A theme maps it to its hover state-layer opacity (the Material bridge: `--mat-sys-hover-state-layer-opacity`).|
|`--cngx-button-pressed-layer`|`20%`|State / Pressed|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill while pressed, one step above `--cngx-button-hover-layer`. A theme maps it to its pressed state-layer opacity (the Material bridge: `--mat-sys-pressed-state-layer-opacity`).|
|`--cngx-button-pressed-wash`|`12%`|State / Pressed|Tone wash of a pressed `outline` or `ghost` button (hover takes 8%).|
|`--cngx-button-neutral-tint-pressed`|`13%`|State / Pressed|Pressed tint strength of a neutral `secondary` fill, one step above `--cngx-button-neutral-tint-hover`; the dark scheme steps it up.|
|`--cngx-button-secondary-bg-pressed`|``|State / Pressed|Pressed fill of a `secondary` button. Unset by default, so the pressed tone mix paints; a theme sets it next to `--cngx-button-secondary-bg-hover`.|
|`--cngx-button-secondary-bg`|``|Tone|Fill of a `secondary` button. Unset by default, so the fill is the tone mixed into transparency (the neutral tint for `neutral`, 12% otherwise). A theme sets it to paint a container colour instead (the Material bridge maps it to the `*-container` roles).|
|`--cngx-button-secondary-bg-hover`|``|Tone|Hover fill of a `secondary` button. Unset by default, so hover steps the tone mix up.|
|`--cngx-button-secondary-color`|``|Tone|Text colour of a `secondary` button. Unset by default, so the tone text colour paints.|

## CngxPopoverDismiss

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-padding-block`|`0.5rem`|Layout|Block padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-padding-inline`|`1rem`|Layout|Inline padding. SET per size from `--cngx-space-*`.|
|`--cngx-button-gap`|`0.5rem`|Layout|Gap between the slots and the label.|
|`--cngx-button-font-size`|`1rem`|Typography|Font size. `md` reads the form-control font so the button shares the control line box.|
|`--cngx-button-radius`|`0.5rem`|Layout|Corner radius.|
|`--cngx-button-border-width`|`1px`|Layout|Border width on all four sides; transparent where the variant paints none, so every variant shares one box.|
|`--cngx-button-transition`|`150ms`|Motion|Transition duration for colour changes. Derives from the `--cngx-duration-fast` rung of the motion scale.|
|`--cngx-button-tone`|`currentColor`|Tone|Tone colour: the outline border, the hover wash, and the solid fill unless `--cngx-button-tone-fill` is set.|
|`--cngx-button-tone-text`|`currentColor`|Tone|Text colour on a transparent or tonal surface.|
|`--cngx-button-on-tone`|`Canvas`|Tone|Text colour on the solid tone fill.|
|`--cngx-button-tone-fill`|``|Tone|Solid fill colour. Set by the primary and danger tones to the strong palette rung their on-colour clears 4.5:1 against; unset, the solid fill falls back to `--cngx-button-tone`. Outline, secondary, ghost and link keep painting from `--cngx-button-tone`. Registered without an initial value so the fallback stays live.|
|`--cngx-button-spinner-size`|`1em`|Busy|Diameter of the busy spinner ring, and the box of a bare `svg` or `img` drawn by a `provideButtonSpinner` component.|
|`--cngx-button-spinner-thickness`|`2px`|Busy|Stroke width of the busy spinner ring. Inherits so a value set on the button reaches the ring inside the busy layer.|
|`--cngx-button-hover-shade`|`oklch(0 0 0)`|Tone|Colour a solid button's tone mixes towards on hover and press (by `--cngx-button-hover-layer` / `--cngx-button-pressed-layer`), so the fill darkens without a second tone token.|
|`--cngx-button-link-hover-thickness`|`2px`|Tone|Underline thickness of a `link` button on hover; at rest it keeps the font's own underline.|
|`--cngx-button-icon-size`|`1.25em`|Layout|Edge length of an `svg` or `img` in a start or end slot. Same rung as `--cngx-icon-size-md`, so a projected `cngx-icon` and a bare `svg` match. Inherits so a value set on the button reaches the slot glyph.|
|`--cngx-button-neutral-tint`|`5%`|Tone|Tint strength of a neutral `secondary` fill and its hover. Light text on a dark surface reads a small tint as almost nothing, so the dark scheme steps both up.|
|`--cngx-button-neutral-tint-hover`|`9%`|Tone|Hover tint strength of a neutral `secondary` fill.|
|`--cngx-button-hover-layer`|`12%`|State / Hover|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill on hover, a state layer. A theme maps it to its hover state-layer opacity (the Material bridge: `--mat-sys-hover-state-layer-opacity`).|
|`--cngx-button-pressed-layer`|`20%`|State / Pressed|Share of `--cngx-button-hover-shade` laid over a solid primary or danger fill while pressed, one step above `--cngx-button-hover-layer`. A theme maps it to its pressed state-layer opacity (the Material bridge: `--mat-sys-pressed-state-layer-opacity`).|
|`--cngx-button-pressed-wash`|`12%`|State / Pressed|Tone wash of a pressed `outline` or `ghost` button (hover takes 8%).|
|`--cngx-button-neutral-tint-pressed`|`13%`|State / Pressed|Pressed tint strength of a neutral `secondary` fill, one step above `--cngx-button-neutral-tint-hover`; the dark scheme steps it up.|
|`--cngx-button-secondary-bg-pressed`|``|State / Pressed|Pressed fill of a `secondary` button. Unset by default, so the pressed tone mix paints; a theme sets it next to `--cngx-button-secondary-bg-hover`.|
|`--cngx-button-secondary-bg`|``|Tone|Fill of a `secondary` button. Unset by default, so the fill is the tone mixed into transparency (the neutral tint for `neutral`, 12% otherwise). A theme sets it to paint a container colour instead (the Material bridge maps it to the `*-container` roles).|
|`--cngx-button-secondary-bg-hover`|``|Tone|Hover fill of a `secondary` button. Unset by default, so hover steps the tone mix up.|
|`--cngx-button-secondary-color`|``|Tone|Text colour of a `secondary` button. Unset by default, so the tone text colour paints.|

## CngxPopoverPanel

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-popover-panel-bg`|`oklch(1 0 0)`|Surface|Panel background. Falls back through `--cngx-color-surface`.|
|`--cngx-popover-panel-color`|`oklch(0.27 0.04 250)`|Surface|Panel text color. Falls back through `--cngx-color-text`.|
|`--cngx-popover-panel-border-radius`|`12px`|Layout|Corner radius of the panel.|
|`--cngx-popover-panel-padding`|`16px`|Layout|Padding shorthand applied inside the panel.|
|`--cngx-popover-panel-max-width`|`360px`|Layout|Maximum inline size - caps long content before the floater collides with viewport edges.|
|`--cngx-popover-panel-shadow`|`0 8px 24px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand for the panel. `inherits: true` so the :root dark-mode override reaches the open panel element.|
|`--cngx-popover-panel-border`|`1px solid oklch(0 0 0 / 0.08)`|Surface|Border shorthand for the panel.|
|`--cngx-popover-panel-arrow-size`|`8px`|Layout|Side length of the arrow square (the rotated 45° diamond - final arrow side reads as `size * sqrt(2)`).|
|`--cngx-popover-panel-close-size`|`28px`|Layout|Diameter of the optional close button in the header row.|
|`--cngx-popover-panel-close-offset`|`4px`|Layout|Inset of the corner-pinned close button from the panel's top / inline-end edges. The close is absolutely positioned in the top-right (top-left under RTL) corner, so this offset tucks it into the panel padding rather than leaving it in the header flow.|
|`--cngx-popover-panel-transition-duration`|`200ms`|Motion|Duration of the opacity + transform transition between the open states. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-popover-panel-transition-easing`|`cubic-bezier(0.4, 0, 0.2, 1)`|Motion|Easing curve of the open / close transition.|
|`--cngx-popover-panel-header-font-size`|`0.875rem`|Typography|Font-size of the optional header slot.|
|`--cngx-popover-panel-header-font-weight`|`600`|Typography|Font-weight of the optional header slot.|
|`--cngx-popover-panel-header-gap`|`8px`|Layout|Vertical gap between the header and the body slot.|
|`--cngx-popover-panel-footer-gap`|`8px`|Layout|Horizontal gap between footer actions.|
|`--cngx-popover-panel-footer-border-top`|`1px solid oklch(0 0 0 / 0.06)`|Surface|Border shorthand applied to the top of the footer - visually separates actions from the body.|
|`--cngx-popover-panel-footer-padding-top`|`12px`|Layout|Padding above the footer divider.|
|`--cngx-popover-panel-footer-margin-top`|`12px`|Layout|Margin above the footer divider - pulls the footer down off the body.|
|`--cngx-popover-panel-accent`|`transparent`|Variant / Accent|Accent surface for the semantic-variant rules (`.cngx-popover-panel--info` / `--success` / `--warning` / `--danger`). Each variant rule pins this token plus the matching accent-text token - child slots pick them up through `currentColor` and `var()` fallbacks.|
|`--cngx-popover-panel-accent-text`|`currentColor`|Variant / Accent|Text / outline color paired with the accent surface - used by focus rings and the variant border-left rule.|
|`--cngx-popover-panel-close-hover-bg`|`oklch(0 0 0 / 0.06)`|State / Hover|Hover wash on the optional close button. Light: 6% black wash; dark: 8% white wash. Both sit subtly on top of the panel surface without competing for attention.|

## CngxPopoverSheet

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-popover-sheet-max-block-size`|`80dvh`|Layout|Maximum block size of the `sheet` presentation. Room above it keeps the page visible behind the backdrop.|
|`--cngx-popover-sheet-radius`|`16px 16px 0 0`|Layout|Corner radius shorthand of the `sheet` presentation. Rounded top corners only, matching the bottom-anchored anatomy.|
|`--cngx-popover-sheet-padding`|`16px`|Layout|Padding inside the panel. SET from `--cngx-space-md` on the host, so density reaches it; the safe-area insets win where they are larger.|
|`--cngx-popover-sheet-header-gap`|`8px`|Layout|Gap between the items of the header row and below it. SET from `--cngx-space-sm`.|
|`--cngx-popover-sheet-handle-inline-size`|`40px`|Handle|Inline size of the decorative handle pill.|
|`--cngx-popover-sheet-handle-block-size`|`4px`|Handle|Block size of the decorative handle pill.|
|`--cngx-popover-sheet-handle-radius`|`2px`|Handle|Corner radius of the decorative handle pill.|
|`--cngx-popover-sheet-handle-margin`|`0 auto 16px`|Handle|Margin shorthand around the handle pill: centres it and pushes the header row down. SET from `--cngx-space-md` on the host.|
|`--cngx-popover-sheet-handle-color`|`oklch(0.8 0.005 250)`|Handle|Fill of the decorative handle pill. `inherits: true` so the root dark-mode value reaches the handle part.|
|`--cngx-popover-sheet-surface`|`oklch(1 0 0)`|Surface|Panel surface. SET from `--cngx-color-surface` on the host.|
|`--cngx-popover-sheet-color`|`oklch(0.2 0 0)`|Surface|Panel text colour. SET from `--cngx-color-text` on the host.|
|`--cngx-popover-sheet-shadow`|`0 8px 32px oklch(0 0 0 / 0.12)`|Surface|Drop shadow of the `sheet` presentation, the `CngxDialog` elevation. `inherits: true` so the dark-mode value set on the root reaches the host.|
|`--cngx-popover-sheet-backdrop`|`oklch(0 0 0 / 0.5)`|Surface|Dimming paint of the `sheet` `::backdrop`. Paint only: taps outside the panel are handled by the directive, not by the backdrop. `inherits: true` so the host value reaches the pseudo-element.|
|`--cngx-popover-sheet-duration`|`200ms`|Motion|Duration of the slide in and out. SET from `--cngx-duration-base`.|
|`--cngx-popover-sheet-easing`|`ease`|Motion|Easing curve of the slide in and out.|

## CngxPopoverSheetHeader

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-popover-sheet-max-block-size`|`80dvh`|Layout|Maximum block size of the `sheet` presentation. Room above it keeps the page visible behind the backdrop.|
|`--cngx-popover-sheet-radius`|`16px 16px 0 0`|Layout|Corner radius shorthand of the `sheet` presentation. Rounded top corners only, matching the bottom-anchored anatomy.|
|`--cngx-popover-sheet-padding`|`16px`|Layout|Padding inside the panel. SET from `--cngx-space-md` on the host, so density reaches it; the safe-area insets win where they are larger.|
|`--cngx-popover-sheet-header-gap`|`8px`|Layout|Gap between the items of the header row and below it. SET from `--cngx-space-sm`.|
|`--cngx-popover-sheet-handle-inline-size`|`40px`|Handle|Inline size of the decorative handle pill.|
|`--cngx-popover-sheet-handle-block-size`|`4px`|Handle|Block size of the decorative handle pill.|
|`--cngx-popover-sheet-handle-radius`|`2px`|Handle|Corner radius of the decorative handle pill.|
|`--cngx-popover-sheet-handle-margin`|`0 auto 16px`|Handle|Margin shorthand around the handle pill: centres it and pushes the header row down. SET from `--cngx-space-md` on the host.|
|`--cngx-popover-sheet-handle-color`|`oklch(0.8 0.005 250)`|Handle|Fill of the decorative handle pill. `inherits: true` so the root dark-mode value reaches the handle part.|
|`--cngx-popover-sheet-surface`|`oklch(1 0 0)`|Surface|Panel surface. SET from `--cngx-color-surface` on the host.|
|`--cngx-popover-sheet-color`|`oklch(0.2 0 0)`|Surface|Panel text colour. SET from `--cngx-color-text` on the host.|
|`--cngx-popover-sheet-shadow`|`0 8px 32px oklch(0 0 0 / 0.12)`|Surface|Drop shadow of the `sheet` presentation, the `CngxDialog` elevation. `inherits: true` so the dark-mode value set on the root reaches the host.|
|`--cngx-popover-sheet-backdrop`|`oklch(0 0 0 / 0.5)`|Surface|Dimming paint of the `sheet` `::backdrop`. Paint only: taps outside the panel are handled by the directive, not by the backdrop. `inherits: true` so the host value reaches the pseudo-element.|
|`--cngx-popover-sheet-duration`|`200ms`|Motion|Duration of the slide in and out. SET from `--cngx-duration-base`.|
|`--cngx-popover-sheet-easing`|`ease`|Motion|Easing curve of the slide in and out.|

## CngxPrefix

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-border-width`|`1px`|Sizing|Border width of the field box on every side, in every skin (transparent where a skin paints none). The box height and the touch floor of the controls inside it are derived from it, so changing it keeps the box on its formula.|
|`--cngx-field-ring-width`|`2px`|Sizing|Width of the focus ring an outline or bare box draws around its main control.|
|`--cngx-field-ring-offset`|`3px`|Sizing|Distance between the box edge and its focus ring.|
|`--cngx-field-affix-gap`|`8px`|Layout|Gap between the prefix, control, and suffix in an affix row.|
|`--cngx-field-affix-divider`|`0px`|Layout|Width of an optional divider between an affix and the control: the inline-end edge of a prefix, the inline-start edge of a suffix. `0px` draws none. Any width also pads the affix by `--cngx-space-sm` so the divider does not touch the affix content. Set it on the box.|

## CngxProgress

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-progress-label-gap`|`8px`|Layout|Gap between the progress track and the trailing label slot.|
|`--cngx-progress-height`|`4px`|Layout|Height of the linear track.|
|`--cngx-progress-track-color`|`oklch(0 0 0 / 0.1)`|Surface|Track color (the unfilled portion).|
|`--cngx-progress-border-radius`|`2px`|Layout|Corner radius of the linear track.|
|`--cngx-progress-color`|`currentColor`|Surface|Fill color of the progress indicator.|
|`--cngx-progress-transition-duration`|`300ms`|Motion|Duration of the width / dashoffset transition for the determinate fill. Derives from the `--cngx-duration-slow` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-progress-transition-easing`|`ease-out`|Motion|Easing curve of the determinate transition.|
|`--cngx-progress-indeterminate-duration`|`1.5s`|Motion|Duration of the indeterminate animation sweep.|
|`--cngx-progress-indeterminate-easing`|`ease-in-out`|Motion|Easing curve of the indeterminate animation.|
|`--cngx-progress-label-size`|`0.75rem`|Typography|Font-size of the linear-variant label.|
|`--cngx-progress-label-color`|`currentColor`|Typography|Color of the label slot.|
|`--cngx-progress-circle-size`|`48px`|Layout|Diameter of the circular ring variant.|
|`--cngx-progress-circle-label-size`|`0.625rem`|Typography|Font-size of the circular-variant centered label.|

## CngxProgressBarStepper

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-step-refused-color`|``|State / Refused|Fill of a refused-commit marker (the commit action answered `false`). A refusal is no error, so it wears the rejection amber; a failed commit keeps `--cngx-step-errored-color`. Registered without an initial value, so the amber fallback applies until a theme sets it.|
|`--cngx-step-refused-text-color`|``|State / Refused|Text color of the aggregate line when every marked step is a refused commit. Defaults to the surrounding text colour: amber text would fall under the 4.5:1 text contrast.|
|`--cngx-progress-bar-stepper-gap`|`var(--cngx-space-xs)`|Layout|Gap between the progress bar and the caption below it.|

## CngxRadio

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-radio-gap`|`0.5rem`|Layout|Gap between the indicator and the label slot.|
|`--cngx-radio-color`|`currentColor`|Surface|Text color of the host shell. Defaults to `currentColor`.|
|`--cngx-radio-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand. Matches the foundation reset's `:focus-visible` accent so the radio reads consistently with every other focusable atom in the library.|
|`--cngx-radio-focus-offset`|`3px`|State / Focus|Outline offset of the focus ring. Matches the foundation reset's `:focus-visible` offset so the ring breathes the same against the indicator + label as it does against any other atom.|
|`--cngx-radio-focus-radius`|`0.25rem`|State / Focus|Corner radius applied while focused.|

## CngxRadioGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-radio-group-gap`|`0.5rem`|Layout|Gap between radio children. Falls back to `--cngx-space-sm`.|

## CngxRadioIndicator

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-radio-indicator-size`|`1em`|Layout|Active size of the radio glyph. `inherits: true` is load-bearing - the inner `__circle` is a child of the host, and the size-variant classes (`--sm` / `--md` / `--lg`) set this token on the host. With `inherits: false` the child would only see the registered initial value, and the size variants would render identically.|
|`--cngx-radio-indicator-color`|`color-mix(in oklab, currentColor 55%, transparent)`|Surface|Colour of the unchecked ring. Defaults to a 55% mix of the container's text colour, a hairline that still clears 3:1 against the surface (WCAG 1.4.11). Registered, so the default is the initial value, not a read-site fallback.|
|`--cngx-radio-indicator-bg`|`transparent`|Surface|Background of the unchecked circle. Inherited so a host-level override reaches the `__circle` child that consumes it.|
|`--cngx-radio-indicator-border-width`|`1.5`|Surface|Stroke width of the ring, a unitless number in grid units of the 24x24 viewBox, so the ring scales with the indicator size. A length (`2px`) is invalid for this syntax and falls back to the initial value. Inherited so a host-level override reaches the `__circle`.|
|`--cngx-radio-indicator-checked-color`|`oklch(0.66 0.19 50)`|State / Checked|Color applied to the circle border and the inner dot when the radio is checked. Falls back to `--cngx-color-primary`.|
|`--cngx-radio-indicator-transition`|`fill 120ms ease,
      stroke 120ms ease,
      transform 120ms ease,
      opacity 120ms ease`|Motion|Transition shorthand for the ring paint, the dot scale and the check mark fade. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-radio-indicator-dot-scale`|`0.54`|State / Checked|Diameter of the checked dot as a fraction of the indicator size. Unitless, so the dot scales with every size variant.|
|`--cngx-radio-indicator-mark-color`|`var(--cngx-color-surface, oklch(1 0 0))`|Skin / Check|Stroke colour of the `check` skin's mark, drawn on the filled checked disc. The Material bridge maps it to on-primary.|
|`--cngx-radio-indicator-mark-scale`|`0.75`|Skin / Check|Scale of the `check` skin's mark about the indicator centre. The check path spans 14 of the 24 grid units, so 0.75 matches the checkbox glyph.|
|`--cngx-radio-indicator-mark-stroke-width`|`3`|Skin / Check|Stroke width of the `check` skin's mark in grid units, before `--cngx-radio-indicator-mark-scale`. Same as the checkbox glyph.|
|`--cngx-radio-indicator-tinted-dot-scale`|`0.42`|Skin / Tinted|Diameter of the `tinted` skin's checked dot as a fraction of the indicator size. The skin reads this instead of `--cngx-radio-indicator-dot-scale`, so the default dot keeps its size.|
|`--cngx-radio-indicator-size-sm`|`0.875em`|Variant / Size|Size token for the `.cngx-radio-indicator--sm` variant.|
|`--cngx-radio-indicator-size-md`|`1em`|Variant / Size|Size token for the `.cngx-radio-indicator--md` variant (default).|
|`--cngx-radio-indicator-size-lg`|`1.25em`|Variant / Size|Size token for the `.cngx-radio-indicator--lg` variant.|

## CngxRangeSlider

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-slider-value-gap`|`var(--cngx-space-xs, 0.25rem)`|Layout|Distance between the track and the combined value label.|
|`--cngx-slider-bubble-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Distance between the track and the value bubble.|
|`--cngx-slider-bubble-padding`|`var(--cngx-space-xs, 0.125rem) var(--cngx-space-sm, 0.4rem)`|Layout|Padding of the value bubble.|
|`--cngx-slider-fill-color`|`color-mix(in oklab, var(--cngx-color-text, oklch(0.2 0.01 250)) 38%, transparent)`|State|Colour of the fill band between the thumbs. The disabled state sets it to a muted text tint.|
|`--cngx-slider-thumb-border-color`|`color-mix(in oklab, var(--cngx-color-text, oklch(0.2 0.01 250)) 38%, transparent)`|State|Border colour of the thumb rings. The disabled state sets it to a muted text tint.|
|`--cngx-slider-track-color`|`color-mix(in oklab, var(--cngx-color-text, oklch(0.2 0.01 250)) 12%, transparent)`|State|Colour of the track outside the fill band. The disabled state sets it to a faint text tint.|

## CngxRangeSliderTrack

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-slider-track-size`|`4px`|Track|Thickness of the slider track (and fill).|
|`--cngx-slider-thumb-size`|`16px`|Thumb|Diameter of the thumb.|
|`--cngx-slider-thumb-border-width`|`2px`|Thumb|Thumb border stroke width.|
|`--cngx-slider-focus-ring-width`|`2px`|State / Focus|Focus-ring stroke width.|
|`--cngx-slider-length`|`144px`|Track|Length of a vertical slider (a vertical track has no intrinsic extent). Ignored in the default horizontal orientation.|

## CngxRating

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-rating-gap`|`var(--cngx-space-xs, 0.25rem)`|Layout|Gap of the host's column flex layout that holds the star row.|
|`--cngx-rating-item-gap`|`var(--cngx-space-xs, 0.125rem)`|Layout|Gap between the individual stars.|
|`--cngx-rating-item-padding`|`var(--cngx-space-xs, 0.125rem)`|Layout|Padding around each star button.|

## CngxRecyclerPlaceholder

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-recycler-placeholder-row-height`|`48px`|Layout|Repeat period of the ghost rows (px). Set inline by the directive from the recycler's `rowSizeHint`; the initial applies when no row height resolves. `inherits: true` so an ancestor mapping reaches the spacer that hosts it.|
|`--cngx-recycler-placeholder-band-height`|`20px`|Layout|Solid core height of the band within each row period; the remainder feathers into the gap between bands.|
|`--cngx-recycler-placeholder-inset`|`12px`|Layout|Horizontal inset of each band from the layer edges, so bands read as content lines rather than full-width blocks.|
|`--cngx-recycler-placeholder-radius`|`6px`|Surface|Corner softness of each band. Applied as the feather radius of the gradient edges via the band/gap split; kept as a token for tunability.|
|`--cngx-recycler-placeholder-color`|`oklch(0.55 0.02 260 / 0.1)`|Surface|Fill of the ghost bands. A low-alpha ink so the layer sits softly on any surface without a solid color of its own.|
|`--cngx-recycler-placeholder-shimmer-color`|`oklch(1 0 0 / 0.35)`|Motion|Highlight swept across the bands in shimmer mode.|
|`--cngx-recycler-placeholder-shimmer-duration`|`1.6s`|Motion|Duration of one shimmer sweep.|

## CngxReorderableMultiSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel host (anchor-positioned, may sit outside the normal DOM flow).|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through `--cngx-color-surface`.|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value `currentColor` lets the panel inherit text color from its ancestor by default. Registering as `<color>` would forbid `currentColor` since `<color>` requires a computationally- independent value.|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the floating panel host.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-action-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the separator between the action region and the options: on the block-start side of a bottom action, the block-end side of a top action. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel. Set it to `none` to drop the separator.|
|`--cngx-select-action-padding`|`0.25rem`|Layout|Space between the action separator and the action content.|
|`--cngx-select-action-margin`|`0.25rem`|Layout|Space between the options and the action separator.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven, so dense rows stay compact) and composes into the touch-target floor via `max()`. A `0px` rather than `auto` default is deliberate: `auto` cannot be an argument to `max()`, and the floor needs to compose the row height against `--cngx-target-min`.|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a low-alpha tint of `--cngx-color-primary` so the highlight reads as brand-accented without competing with selection state.|
|`--cngx-select-option-active-indicator`|`oklch(0.5 0.2 275)`|State|Colour of the inline-start indicator bar on the keyboard-active row. The background tint alone is ~1.1:1 against the panel; this opaque bar carries the active affordance at >= 3:1. Delegates to the primary colour below, so it follows the scheme and a re-theme.|
|`--cngx-select-option-multi-selected-bg`|`transparent`|State / Selected|Background of a selected row in a multi-value panel whose selection indicator renders. Transparent by default: the checkbox carries the selection, so a mostly-selected panel does not turn into a solid block. Assign a colour to opt the fill back in. Single-value panels and rows with the indicator hidden keep `--cngx-option-selected-bg`.|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through `--cngx-color-primary`.|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant. Muted by default to mirror the placeholder token; the Material bridge maps it to `--mat-sys-on-surface-variant`. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks the same muted default as the caret so both trigger affordances read uniformly. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-caret-size`|`1.6em`|Layout|Font-size of the dropdown caret glyph shared across every variant. Read at the caret span (a trigger descendant), so `inherits: true` is load-bearing: with `inherits: false` the registered initial would always win at the caret and no consumer or composing organism could ever set the token (the inherits:false trap). The default glyph box never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a caret smaller than the 12px micro box.|
|`--cngx-select-clear-target-min`|`24px`|Layout|Fine-pointer hit-area floor of the clear button, on both axes. The 24px default meets WCAG 2.5.8 (AA); under the touch floor the larger `--cngx-target-min` wins. The trigger row keeps its height: the box hands back what it adds over the control line box. `inherits: true` so a trigger-level or ancestor override reaches the button.|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-skeleton-shimmer`|`oklch(0.2 0.01 250)`|State / Loading|Base colour the skeleton shimmer gradient is mixed from. Defaults from the foundation text colour, so the shimmer darkens a light panel and lightens a dark one in every scheme (OS, a `data-color-scheme` island, or a consumer light theme under OS dark) without a hardcoded dark-mode swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-option-spinner-track`|`oklch(0 0 0 / 0.15)`|State / Commit|Track (resting ring) colour of the per-option commit spinner. Defaults from the foundation text colour at a low alpha, so it reads on the panel in every scheme without a dark swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true` so the :root dark-mode override (alpha-on-white on dark) reaches the spinner inside the floating panel.|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to `--cngx-color-primary`.|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.46 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a reorderable chip wrap.|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-reorder-move-size`|`0.75em`|Layout|Size of the move-up / move-down glyph in the reorder list the panel shows under the touch floor: the box of the default triangles (still floored at the 0.75rem micro floor) and the font-size of a projected `*cngxMultiSelectMoveGlyph`. Read at the move button (a descendant of the select host), so `inherits: true` is load-bearing: with `inherits: false` a host-level override would never reach it.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the chip while it's being dragged.|
|`--cngx-select-chip-drag-bg`|`oklch(0.58 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Defaults track `--cngx-color-primary-strong` via the delegating entries below.|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state. Defaults track `--cngx-color-on-primary-strong`, which holds 4.5:1 on the drag background in both schemes.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to `--cngx-color-primary`.|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of every error surface. Falls back to `--cngx-color-danger`.|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a `box-shadow` so it composes with any consumer-supplied focus outline.|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-commit-error-hint-color`|`oklch(0.5 0.2 25)`|State / Commit|Text colour of the commit-error hint shown under a closed trigger. Defaults to the danger-text contrast tier so it clears 4.5:1 like the inline banner.|
|`--cngx-select-commit-error-hint-margin`|`0.25rem`|State / Commit|Block-start margin of the commit-error hint, set from the density scale.|
|`--cngx-select-reorder-list-max-block-size`|`40dvh`|Layout|Height cap of the sortable list of selected values that a reorderable select shows in its sheet under the touch floor. A longer selection scrolls inside the list, so the options below stay reachable.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|
|`--cngx-select-message-padding`|`var(--cngx-space-sm) var(--cngx-space-sm)`|Layout|Padding of the loading and empty message rows in the panel.|
|`--cngx-select-chip-fit-badge-reserve`|`5ch`|State / Overflow|Inline space a `chipOverflow: 'fit'` strip keeps free for the `+N` badge. The badge slot is exactly this wide and clips a wider badge; raise it for a projected `*cngxSelectChipOverflow` or a custom `chipOverflowBadge` formatter. Set it on the select, a container or `:root`. Never assigned by the library, so the `5ch` fallback (room for `+99`) resolves against the strip font.|
|`--cngx-reorderable-multi-select-min-width`|`var(--cngx-multi-select-min-width, var(--cngx-select-min-width, 10rem))`|Layout|Preferred minimum inline size of the select. A standalone or toolbar select is at least this wide; a narrower cell shrinks it, as it does an input. Falls back to `--cngx-multi-select-min-width`, then `--cngx-select-min-width`; see {@link --cngx-select-min-width} for why no `initial-value` is declared.|
|`--cngx-reorderable-multi-select-gap`|`var(--cngx-multi-select-gap, var(--cngx-select-gap, var(--cngx-space-sm, 0.5rem)))`|Layout|Gap between the chip list, placeholder, caret, and clear button. Falls back to `--cngx-multi-select-gap`, then `--cngx-select-gap`; see {@link --cngx-select-gap} for why no `initial-value` is declared.|
|`--cngx-reorderable-multi-select-padding`|`var(--cngx-multi-select-padding, var(--cngx-select-padding, var(--cngx-space-sm, 0.375rem) var(--cngx-space-md, 0.5rem)))`|Layout|Padding shorthand of the trigger. Falls back to `--cngx-multi-select-padding`, then `--cngx-select-padding`; see {@link --cngx-select-padding} for why no `initial-value` is declared.|
|`--cngx-reorderable-multi-select-border`|`var(--cngx-multi-select-border, var(--cngx-select-border, 1px solid var(--cngx-color-border-strong)))`|Surface|Border shorthand of the trigger. Falls back to `--cngx-multi-select-border`, then `--cngx-select-border`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-reorderable-multi-select-radius`|`var(--cngx-multi-select-radius, var(--cngx-select-radius, var(--cngx-radius-md, 8px)))`|Layout|Corner radius of the trigger. Falls back to `--cngx-multi-select-radius`, then `--cngx-select-radius`; see {@link --cngx-select-radius} for why no `initial-value` is declared.|
|`--cngx-reorderable-multi-select-bg`|`var(--cngx-multi-select-bg, var(--cngx-select-bg, transparent))`|Surface|Background of the trigger. Falls back to `--cngx-multi-select-bg`, then `--cngx-select-bg`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-reorderable-multi-select-color`|`var(--cngx-multi-select-color, var(--cngx-select-color, inherit))`|Surface|Text color of the trigger. Falls back to `--cngx-multi-select-color`, then `--cngx-select-color`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-reorderable-multi-select-min-height`|`var(--cngx-multi-select-min-height, var(--cngx-select-min-height, 2.125rem))`|Layout|Minimum block size of the trigger. Falls back to `--cngx-multi-select-min-height`, then `--cngx-select-min-height`; see {@link --cngx-select-min-height} for why no `initial-value` is declared. The touch floor still lifts the trigger to `--cngx-target-min`.|
|`--cngx-reorderable-multi-select-focus-outline`|`var(--cngx-multi-select-focus-outline, var(--cngx-select-focus-outline, 2px solid var(--cngx-color-primary)))`|State / Focus|Focus-ring outline shorthand of the trigger. Falls back to `--cngx-multi-select-focus-outline`, then `--cngx-select-focus-outline`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|

## CngxRequired

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-required-color`|`oklch(0.6 0.18 25)`|State / Required|Color of the required-marker glyph. Falls back through `--cngx-field-error-color` and then `--cngx-color-danger`.|

## CngxRipple

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-ripple-color`|`currentColor`|Surface|Wave color. Defaults to `currentColor` so the ripple inherits the host's text color.|
|`--cngx-ripple-opacity`|`0.12`|Surface|Peak opacity of the wave at the start of the animation. Drops to zero by the end.|
|`--cngx-ripple-duration`|`0.5s`|Motion|Animation duration of the wave expansion.|

## CngxSegmentedProgress

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-segmented-progress-gap`|`var(--cngx-space-xs, 0.25rem)`|Layout|Gap between the progress segments.|

## CngxSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel host (anchor-positioned, may sit outside the normal DOM flow).|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through `--cngx-color-surface`.|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value `currentColor` lets the panel inherit text color from its ancestor by default. Registering as `<color>` would forbid `currentColor` since `<color>` requires a computationally- independent value.|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the floating panel host.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-action-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the separator between the action region and the options: on the block-start side of a bottom action, the block-end side of a top action. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel. Set it to `none` to drop the separator.|
|`--cngx-select-action-padding`|`0.25rem`|Layout|Space between the action separator and the action content.|
|`--cngx-select-action-margin`|`0.25rem`|Layout|Space between the options and the action separator.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven, so dense rows stay compact) and composes into the touch-target floor via `max()`. A `0px` rather than `auto` default is deliberate: `auto` cannot be an argument to `max()`, and the floor needs to compose the row height against `--cngx-target-min`.|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a low-alpha tint of `--cngx-color-primary` so the highlight reads as brand-accented without competing with selection state.|
|`--cngx-select-option-active-indicator`|`oklch(0.5 0.2 275)`|State|Colour of the inline-start indicator bar on the keyboard-active row. The background tint alone is ~1.1:1 against the panel; this opaque bar carries the active affordance at >= 3:1. Delegates to the primary colour below, so it follows the scheme and a re-theme.|
|`--cngx-select-option-multi-selected-bg`|`transparent`|State / Selected|Background of a selected row in a multi-value panel whose selection indicator renders. Transparent by default: the checkbox carries the selection, so a mostly-selected panel does not turn into a solid block. Assign a colour to opt the fill back in. Single-value panels and rows with the indicator hidden keep `--cngx-option-selected-bg`.|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through `--cngx-color-primary`.|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant. Muted by default to mirror the placeholder token; the Material bridge maps it to `--mat-sys-on-surface-variant`. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks the same muted default as the caret so both trigger affordances read uniformly. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-caret-size`|`1.6em`|Layout|Font-size of the dropdown caret glyph shared across every variant. Read at the caret span (a trigger descendant), so `inherits: true` is load-bearing: with `inherits: false` the registered initial would always win at the caret and no consumer or composing organism could ever set the token (the inherits:false trap). The default glyph box never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a caret smaller than the 12px micro box.|
|`--cngx-select-clear-target-min`|`24px`|Layout|Fine-pointer hit-area floor of the clear button, on both axes. The 24px default meets WCAG 2.5.8 (AA); under the touch floor the larger `--cngx-target-min` wins. The trigger row keeps its height: the box hands back what it adds over the control line box. `inherits: true` so a trigger-level or ancestor override reaches the button.|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-skeleton-shimmer`|`oklch(0.2 0.01 250)`|State / Loading|Base colour the skeleton shimmer gradient is mixed from. Defaults from the foundation text colour, so the shimmer darkens a light panel and lightens a dark one in every scheme (OS, a `data-color-scheme` island, or a consumer light theme under OS dark) without a hardcoded dark-mode swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-option-spinner-track`|`oklch(0 0 0 / 0.15)`|State / Commit|Track (resting ring) colour of the per-option commit spinner. Defaults from the foundation text colour at a low alpha, so it reads on the panel in every scheme without a dark swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true` so the :root dark-mode override (alpha-on-white on dark) reaches the spinner inside the floating panel.|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to `--cngx-color-primary`.|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.46 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a reorderable chip wrap.|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-reorder-move-size`|`0.75em`|Layout|Size of the move-up / move-down glyph in the reorder list the panel shows under the touch floor: the box of the default triangles (still floored at the 0.75rem micro floor) and the font-size of a projected `*cngxMultiSelectMoveGlyph`. Read at the move button (a descendant of the select host), so `inherits: true` is load-bearing: with `inherits: false` a host-level override would never reach it.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the chip while it's being dragged.|
|`--cngx-select-chip-drag-bg`|`oklch(0.58 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Defaults track `--cngx-color-primary-strong` via the delegating entries below.|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state. Defaults track `--cngx-color-on-primary-strong`, which holds 4.5:1 on the drag background in both schemes.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to `--cngx-color-primary`.|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of every error surface. Falls back to `--cngx-color-danger`.|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a `box-shadow` so it composes with any consumer-supplied focus outline.|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-commit-error-hint-color`|`oklch(0.5 0.2 25)`|State / Commit|Text colour of the commit-error hint shown under a closed trigger. Defaults to the danger-text contrast tier so it clears 4.5:1 like the inline banner.|
|`--cngx-select-commit-error-hint-margin`|`0.25rem`|State / Commit|Block-start margin of the commit-error hint, set from the density scale.|
|`--cngx-select-reorder-list-max-block-size`|`40dvh`|Layout|Height cap of the sortable list of selected values that a reorderable select shows in its sheet under the touch floor. A longer selection scrolls inside the list, so the options below stay reachable.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|
|`--cngx-select-message-padding`|`var(--cngx-space-sm) var(--cngx-space-sm)`|Layout|Padding of the loading and empty message rows in the panel.|
|`--cngx-select-chip-fit-badge-reserve`|`5ch`|State / Overflow|Inline space a `chipOverflow: 'fit'` strip keeps free for the `+N` badge. The badge slot is exactly this wide and clips a wider badge; raise it for a projected `*cngxSelectChipOverflow` or a custom `chipOverflowBadge` formatter. Set it on the select, a container or `:root`. Never assigned by the library, so the `5ch` fallback (room for `+99`) resolves against the strip font.|
|`--cngx-select-min-width`|`10rem`|Layout|Preferred minimum inline size of the select. A standalone or toolbar select is at least this wide; a narrower cell shrinks it, as it does an input. It is also the family fallback every variant's min-width token resolves through. No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback survives, and a value set on an ancestor reaches the host.|
|`--cngx-select-min-height`|`2.125rem`|Layout|Minimum block size of the trigger, and the family fallback every variant's min-height token resolves through. No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback survives, and a value set on the host or an ancestor reaches the trigger, a host descendant. The touch floor still lifts the trigger to `--cngx-target-min`.|
|`--cngx-select-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Gap between the label, caret, and clear button. It is also the family fallback every variant's gap token resolves through. No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback to the spacing scale survives, so a root `[data-density]` compacts it, and a value set on the host or an ancestor reaches the trigger.|
|`--cngx-select-padding`|`var(--cngx-space-sm, 0.5rem) var(--cngx-space-md, 0.75rem)`|Layout|Padding shorthand of the trigger. It is also the family fallback every variant's padding token resolves through. No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback to the spacing scale survives, so a root `[data-density]` compacts it, and a value set on the host or an ancestor reaches the trigger.|
|`--cngx-select-border`|`1px solid var(--cngx-color-border-strong)`|Surface|Border shorthand of the trigger, and the family fallback every variant's border token resolves through. No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback `1px solid var(--cngx-color-border-strong)` resolves on the trigger, so a scoped `--cngx-color-border-strong` swap reaches it, and a value set on an ancestor reaches the trigger. The strong rung keeps the control edge at 3:1 against its surface (WCAG 1.4.11).|
|`--cngx-select-radius`|`var(--cngx-radius-md, 8px)`|Layout|Corner radius of the trigger, and the family fallback every variant's radius token resolves through. No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback survives, and a value set on the host or an ancestor reaches the trigger.|
|`--cngx-select-bg`|`transparent`|Surface|Background of the trigger, and the family fallback every variant's background token resolves through. No `initial-value`: the universal syntax keeps the property guaranteed-invalid until set, so the use-site `var()` fallback to `transparent` survives. `inherits: true`, so a value set on an ancestor (or by the Material bridge on `html`) reaches the trigger.|
|`--cngx-select-color`|`inherit`|Surface|Text color of the trigger, and the family fallback every variant's color token resolves through. No `initial-value`, like {@link --cngx-select-bg}, so the use-site fallback to `inherit` survives and a value set on an ancestor reaches the trigger.|
|`--cngx-select-focus-outline`|`2px solid var(--cngx-color-primary)`|State / Focus|Focus-ring outline shorthand of the trigger, and the family fallback every variant's focus token resolves through. No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback `2px solid var(--cngx-color-primary)` resolves on the trigger, and a value set on an ancestor reaches the trigger.|
|`--cngx-select-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring, read by every variant's trigger and inner rings. No `initial-value`, like {@link --cngx-select-bg}: the use-site `var()` fallback to `2px` survives, and `inherits: true` lets a value set on an ancestor (or by the Material bridge on `html`) reach the trigger.|

## CngxSelectDivider

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-divider-margin`|`var(--cngx-space-xs) 0`|Layout|Block and inline margin around the divider rule.|

## CngxSelectOptgroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-optgroup-padding`|`var(--cngx-space-xs) var(--cngx-space-sm)`|Layout|Padding of the group header label.|

## CngxSelectOption

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-option-padding`|`var(--cngx-space-xs) var(--cngx-space-sm)`|Layout|Padding of the option row.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|

## CngxSelectSearch

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-search-padding`|`var(--cngx-space-sm)`|Layout|Padding around the search field, inside the divider.|
|`--cngx-select-search-input-padding`|`var(--cngx-space-xs) var(--cngx-space-sm)`|Layout|Padding inside the search input.|

## CngxSelectShell

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel host (anchor-positioned, may sit outside the normal DOM flow).|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through `--cngx-color-surface`.|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value `currentColor` lets the panel inherit text color from its ancestor by default. Registering as `<color>` would forbid `currentColor` since `<color>` requires a computationally- independent value.|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the floating panel host.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-action-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the separator between the action region and the options: on the block-start side of a bottom action, the block-end side of a top action. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel. Set it to `none` to drop the separator.|
|`--cngx-select-action-padding`|`0.25rem`|Layout|Space between the action separator and the action content.|
|`--cngx-select-action-margin`|`0.25rem`|Layout|Space between the options and the action separator.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven, so dense rows stay compact) and composes into the touch-target floor via `max()`. A `0px` rather than `auto` default is deliberate: `auto` cannot be an argument to `max()`, and the floor needs to compose the row height against `--cngx-target-min`.|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a low-alpha tint of `--cngx-color-primary` so the highlight reads as brand-accented without competing with selection state.|
|`--cngx-select-option-active-indicator`|`oklch(0.5 0.2 275)`|State|Colour of the inline-start indicator bar on the keyboard-active row. The background tint alone is ~1.1:1 against the panel; this opaque bar carries the active affordance at >= 3:1. Delegates to the primary colour below, so it follows the scheme and a re-theme.|
|`--cngx-select-option-multi-selected-bg`|`transparent`|State / Selected|Background of a selected row in a multi-value panel whose selection indicator renders. Transparent by default: the checkbox carries the selection, so a mostly-selected panel does not turn into a solid block. Assign a colour to opt the fill back in. Single-value panels and rows with the indicator hidden keep `--cngx-option-selected-bg`.|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through `--cngx-color-primary`.|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant. Muted by default to mirror the placeholder token; the Material bridge maps it to `--mat-sys-on-surface-variant`. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks the same muted default as the caret so both trigger affordances read uniformly. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-caret-size`|`1.6em`|Layout|Font-size of the dropdown caret glyph shared across every variant. Read at the caret span (a trigger descendant), so `inherits: true` is load-bearing: with `inherits: false` the registered initial would always win at the caret and no consumer or composing organism could ever set the token (the inherits:false trap). The default glyph box never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a caret smaller than the 12px micro box.|
|`--cngx-select-clear-target-min`|`24px`|Layout|Fine-pointer hit-area floor of the clear button, on both axes. The 24px default meets WCAG 2.5.8 (AA); under the touch floor the larger `--cngx-target-min` wins. The trigger row keeps its height: the box hands back what it adds over the control line box. `inherits: true` so a trigger-level or ancestor override reaches the button.|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-skeleton-shimmer`|`oklch(0.2 0.01 250)`|State / Loading|Base colour the skeleton shimmer gradient is mixed from. Defaults from the foundation text colour, so the shimmer darkens a light panel and lightens a dark one in every scheme (OS, a `data-color-scheme` island, or a consumer light theme under OS dark) without a hardcoded dark-mode swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-option-spinner-track`|`oklch(0 0 0 / 0.15)`|State / Commit|Track (resting ring) colour of the per-option commit spinner. Defaults from the foundation text colour at a low alpha, so it reads on the panel in every scheme without a dark swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true` so the :root dark-mode override (alpha-on-white on dark) reaches the spinner inside the floating panel.|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to `--cngx-color-primary`.|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.46 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a reorderable chip wrap.|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-reorder-move-size`|`0.75em`|Layout|Size of the move-up / move-down glyph in the reorder list the panel shows under the touch floor: the box of the default triangles (still floored at the 0.75rem micro floor) and the font-size of a projected `*cngxMultiSelectMoveGlyph`. Read at the move button (a descendant of the select host), so `inherits: true` is load-bearing: with `inherits: false` a host-level override would never reach it.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the chip while it's being dragged.|
|`--cngx-select-chip-drag-bg`|`oklch(0.58 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Defaults track `--cngx-color-primary-strong` via the delegating entries below.|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state. Defaults track `--cngx-color-on-primary-strong`, which holds 4.5:1 on the drag background in both schemes.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to `--cngx-color-primary`.|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of every error surface. Falls back to `--cngx-color-danger`.|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a `box-shadow` so it composes with any consumer-supplied focus outline.|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-commit-error-hint-color`|`oklch(0.5 0.2 25)`|State / Commit|Text colour of the commit-error hint shown under a closed trigger. Defaults to the danger-text contrast tier so it clears 4.5:1 like the inline banner.|
|`--cngx-select-commit-error-hint-margin`|`0.25rem`|State / Commit|Block-start margin of the commit-error hint, set from the density scale.|
|`--cngx-select-reorder-list-max-block-size`|`40dvh`|Layout|Height cap of the sortable list of selected values that a reorderable select shows in its sheet under the touch floor. A longer selection scrolls inside the list, so the options below stay reachable.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|
|`--cngx-select-message-padding`|`var(--cngx-space-sm) var(--cngx-space-sm)`|Layout|Padding of the loading and empty message rows in the panel.|
|`--cngx-select-chip-fit-badge-reserve`|`5ch`|State / Overflow|Inline space a `chipOverflow: 'fit'` strip keeps free for the `+N` badge. The badge slot is exactly this wide and clips a wider badge; raise it for a projected `*cngxSelectChipOverflow` or a custom `chipOverflowBadge` formatter. Set it on the select, a container or `:root`. Never assigned by the library, so the `5ch` fallback (room for `+99`) resolves against the strip font.|
|`--cngx-select-shell-min-width`|`var(--cngx-select-min-width, 10rem)`|Layout|Preferred minimum inline size of the select. A standalone or toolbar select is at least this wide; a narrower cell shrinks it, as it does an input. Falls back to `--cngx-select-min-width`; see {@link --cngx-select-min-width} for why no `initial-value` is declared.|
|`--cngx-select-shell-min-height`|`var(--cngx-select-min-height, 2.125rem)`|Layout|Minimum block size of the trigger. Falls back to `--cngx-select-min-height`; see {@link --cngx-select-min-height} for why no `initial-value` is declared. The touch floor still lifts the trigger to `--cngx-target-min`.|
|`--cngx-select-shell-gap`|`var(--cngx-select-gap, var(--cngx-space-sm, 0.5rem))`|Layout|Gap between the label, caret, and clear button. Falls back to `--cngx-select-gap`; see {@link --cngx-select-gap} for why no `initial-value` is declared.|
|`--cngx-select-shell-padding`|`var(--cngx-select-padding, var(--cngx-space-sm, 0.5rem) var(--cngx-space-md, 0.75rem))`|Layout|Padding shorthand of the trigger. Falls back to `--cngx-select-padding`; see {@link --cngx-select-padding} for why no `initial-value` is declared.|
|`--cngx-select-shell-border`|`var(--cngx-select-border, 1px solid var(--cngx-color-border-strong))`|Surface|Border shorthand of the trigger. Falls back to `--cngx-select-border`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-select-shell-radius`|`var(--cngx-select-radius, var(--cngx-radius-md, 8px))`|Layout|Corner radius of the trigger. Falls back to `--cngx-select-radius`; see {@link --cngx-select-radius} for why no `initial-value` is declared.|
|`--cngx-select-shell-bg`|`var(--cngx-select-bg, transparent)`|Surface|Background of the trigger. Falls back to `--cngx-select-bg`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-select-shell-color`|`var(--cngx-select-color, inherit)`|Surface|Text color of the trigger. Falls back to `--cngx-select-color`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-select-shell-focus-outline`|`var(--cngx-select-focus-outline, 2px solid var(--cngx-color-primary))`|State / Focus|Focus-ring outline shorthand of the trigger. Falls back to `--cngx-select-focus-outline`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-select-shell-focus-ring`|`oklch(0.66 0.19 50)`|State / Focus|Focus-ring color used on the clear button's focus state.|
|`--cngx-select-shell-label-gap`|`var(--cngx-space-xs)`|Layout|Gap inside the label slot (between glyph and text). No `initial-value`, like {@link --cngx-select-bg}: the use-site fallback to the spacing scale survives, so a root `[data-density]` compacts it, and a value set on the host or an ancestor reaches the label.|

## CngxSidenav

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-sidenav-width`|`280px`|Layout|Default open-width of the rail.|
|`--cngx-sidenav-bg`|`oklch(0.97 0.005 250)`|Surface|Background of the rail surface.|
|`--cngx-sidenav-color`|`currentColor`|Surface|Text color of the rail. Defaults to `currentColor` so it inherits from the page.|
|`--cngx-sidenav-transition-duration`|`0.25s`|Motion|Duration of the open / close / rail-peek transitions. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-sidenav-transition-easing`|`ease`|Motion|Easing curve of the open / close / rail-peek transitions.|
|`--cngx-sidenav-mini-width`|`56px`|Variant / Mini|Width of the collapsed rail (icon rail).|
|`--cngx-sidenav-expanded-shadow`|`4px 0 12px oklch(0 0 0 / 0.1)`|Variant / Mini|Drop-shadow applied while the collapsed rail peeks over content.|
|`--cngx-sidenav-border-width`|`1px`|Surface|Stroke width of the rail edge border.|
|`--cngx-sidenav-border-color`|`oklch(0.89 0 0)`|Surface|Stroke color of the rail edge border. Falls back through `--cngx-color-border`.|
|`--cngx-sidenav-padding`|`16px`|Layout|Block padding of the projected nav header and footer; the host SETs `--cngx-nav-header-padding-block` / `--cngx-nav-footer-padding-block` from it.|
|`--cngx-sidenav-resize-handle-width`|`4px`|Layout|Width of the drag-to-resize handle on the rail's edge.|
|`--cngx-sidenav-resize-handle-color`|`oklch(0.66 0.19 50)`|State / Resize|Color of the resize handle on hover / drag. Falls back to `--cngx-color-primary`.|
|`--cngx-sidenav-resize-handle-focus-outline-width`|`2px`|State / Resize|Width of the focus ring on the keyboard-focused resize separator.|
|`--cngx-sidenav-resize-handle-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Resize|Color of the focus ring on the keyboard-focused resize separator. Falls back to `--cngx-color-primary`, like the hover tint.|
|`--cngx-sidenav-resize-handle-focus-outline-offset`|`2px`|State / Resize|Outward offset of the resize separator's focus ring.|
|`--cngx-sidenav-backdrop-bg`|`oklch(0 0 0)`|State / Over|Background of the mobile backdrop scrim.|
|`--cngx-sidenav-overlay-shadow`|`4px 0 12px oklch(0 0 0 / 0.1)`|State / Over|Drop-shadow of an open overlay rail (the `compact` drawer and the full nav over the `medium` rail), so it reads as a layer over the content rather than a third column. Defaults to `--cngx-sidenav-expanded-shadow`.|
|`--cngx-sidenav-backdrop-opacity`|`0.5`|State / Over|Opacity of the mobile backdrop scrim.|

## CngxSidenavLayout

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-sidenav-width-class`|`compact`|Layout|Width class written on the rail: `compact` below 48rem, `medium` from 48rem, `expanded` from 64rem. In `auto` mode the sidenav is a drawer in `compact`, a rail with an overlay in `medium` and docked in `expanded`.|

## CngxSkeletonContainer

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-skeleton-bg`|`oklch(0.88 0 0)`|Surface|Base color of the shimmer gradient.|
|`--cngx-skeleton-shimmer-color`|`oklch(0.96 0 0)`|Surface|Highlight color that sweeps across the bone during the shimmer animation.|
|`--cngx-skeleton-radius`|`4px`|Layout|Corner radius of the bone.|
|`--cngx-skeleton-shimmer-duration`|`1.5s`|Motion|Duration of one shimmer sweep.|

## CngxSlider

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-slider-value-gap`|`var(--cngx-space-xs, 0.25rem)`|Layout|Distance between the track and the value label above the thumb.|
|`--cngx-slider-bubble-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Distance between the track and the discrete value bubble above the thumb.|
|`--cngx-slider-bubble-padding`|`var(--cngx-space-xs, 0.125rem) var(--cngx-space-sm, 0.4rem)`|Layout|Padding of the discrete value bubble.|
|`--cngx-slider-fill-color`|`color-mix(in oklab, var(--cngx-color-text, oklch(0.2 0.01 250)) 38%, transparent)`|State|Colour of the filled part of the track. The disabled state sets it to a muted text tint.|
|`--cngx-slider-thumb-border-color`|`color-mix(in oklab, var(--cngx-color-text, oklch(0.2 0.01 250)) 38%, transparent)`|State|Border colour of the thumb ring. The disabled state sets it to a muted text tint.|
|`--cngx-slider-track-color`|`color-mix(in oklab, var(--cngx-color-text, oklch(0.2 0.01 250)) 12%, transparent)`|State|Colour of the unfilled track. The disabled state sets it to a faint text tint.|

## CngxSliderTrack

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-slider-track-size`|`4px`|Track|Thickness of the slider track (and fill).|
|`--cngx-slider-thumb-size`|`16px`|Thumb|Diameter of the thumb.|
|`--cngx-slider-thumb-border-width`|`2px`|Thumb|Thumb border stroke width.|
|`--cngx-slider-focus-ring-width`|`2px`|State / Focus|Focus-ring stroke width.|
|`--cngx-slider-length`|`144px`|Track|Length of a vertical slider (a vertical track has no intrinsic extent). Ignored in the default horizontal orientation.|

## CngxSparkline

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back through the consumer-facing `--accent` and then to the foundation `--cngx-color-primary` (Ember).|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame. Registered with `inherits: true` deliberately: with `inherits: false` a value set on `:root` or any container resets to the initial value at every element boundary and never reaches the chart host, silently no-opping the documented consumer override.|
|`--cngx-chart-numeric-bidi`|`isolate`|Typography|`unicode-bidi` of every numeric chart label (axis ticks, legend, threshold and band labels). Set to `normal` to opt out of isolation.|
|`--cngx-line-color`|`var(--cngx-sparkline-color, var(--cngx-chart-primary, currentColor))`|Surface|Stroke colour of the sparkline line layer. Derived from --cngx-sparkline-color.|
|`--cngx-area-fill`|`var(--cngx-sparkline-color, var(--cngx-chart-primary, currentColor))`|Surface|Fill colour of the sparkline area layer. Derived from --cngx-sparkline-color.|

## CngxSpeakButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-speak-btn-size`|`36px`|Layout|Hit-target diameter of the button.|
|`--cngx-speak-btn-icon-size`|`16px`|Layout|Inner icon size.|
|`--cngx-speak-btn-radius`|`8px`|Layout|Corner radius.|
|`--cngx-speak-btn-border-width`|`1px`|Surface|Border width.|
|`--cngx-speak-btn-bg`|`oklch(1 0 0)`|Surface|Resting background. Falls back through `--cngx-color-surface`.|
|`--cngx-speak-btn-color`|`oklch(0.45 0 0)`|Surface|Resting icon color - muted.|
|`--cngx-speak-btn-transition`|`0.15s`|Motion|Transition duration for the state-color crossfade. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-speak-btn-active-color`|`oklch(0.72 0.18 70)`|State / Active|Accent color of the speaking / hover state. Warm orange by design - independent of `--cngx-color-primary`.|
|`--cngx-speak-btn-hover-bg`|`oklch(1 0 0)`|State / Hover|Background on hover.|
|`--cngx-speak-btn-speaking-color`|`oklch(1 0 0)`|State / Speaking|Icon color while actively speaking.|
|`--cngx-speak-btn-speaking-bg`|`oklch(0.72 0.18 70)`|State / Speaking|Background while actively speaking - filled with the orange accent for unmistakable feedback.|

## CngxStackedBar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back through the consumer-facing `--accent` and then to the foundation `--cngx-color-primary` (Ember).|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame. Registered with `inherits: true` deliberately: with `inherits: false` a value set on `:root` or any container resets to the initial value at every element boundary and never reaches the chart host, silently no-opping the documented consumer override.|
|`--cngx-chart-numeric-bidi`|`isolate`|Typography|`unicode-bidi` of every numeric chart label (axis ticks, legend, threshold and band labels). Set to `normal` to opt out of isolation.|

## CngxStat

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-stat-gap`|`2px`|Layout|Vertical gap between the label, value row, and caption.|
|`--cngx-stat-row-gap`|`8px`|Layout|Horizontal gap between the value and the delta on the value row.|

## CngxStatCard

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-stat-card-gap`|`var(--cngx-space-sm, 0.5rem)`|Layout|Gap between the rows of the stat body.|
|`--cngx-stat-card-row-gap`|`var(--cngx-space-xs, 0.25rem)`|Layout|Gap between items within a stat row and within the footer.|
|`--cngx-stat-card-viz-margin`|`var(--cngx-space-sm, 0.5rem)`|Layout|Space above the visualisation slot.|
|`--cngx-stat-card-footer-padding`|`var(--cngx-space-xs, 0.25rem)`|Layout|Block-start padding of the footer.|
|`--cngx-stat-card-refresh-inset`|`var(--cngx-space-sm, 0.5rem)`|Layout|Inset of the refresh indicator from the top and inline-end corner.|
|`--cngx-stat-card-body-min-height`|`6rem`|Layout|Minimum block size of the stat, spinner, error and empty bodies, so swapping between them does not resize the card.|
|`--cngx-stat-card-skeleton-base`|`var(
        --cngx-stat-card-skeleton-color,
        var(--cngx-skeleton-bg, var(--cngx-color-border, oklch(0.88 0.005 250)))
      )`|State|Fill of the skeleton bars and the base colour of their shimmer. Resolves from `--cngx-stat-card-skeleton-color`, then `--cngx-skeleton-bg`.|

## CngxStatus

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-status-gap`|`6px`|Layout|Gap between the tone dot and the status label.|
|`--cngx-status-dot-size`|`16px`|Layout|Diameter of the tone dot.|
|`--cngx-status-dot-fg`|`white`|Typography|Foreground colour of the tone glyph, over the coloured dot.|
|`--cngx-status-size`|`0.8125rem`|Typography|Font-size of the status label.|
|`--cngx-status-weight`|`500`|Typography|Font-weight of the status label.|
|`--cngx-status-success-color`|`oklch(0.65 0.18 145)`|Variant / Success|Colour of the `--success` tone dot. Falls back to `--cngx-color-success`.|
|`--cngx-status-warning-color`|`oklch(0.75 0.15 85)`|Variant / Warning|Colour of the `--warning` tone dot.|
|`--cngx-status-danger-color`|`oklch(0.65 0.22 25)`|Variant / Danger|Colour of the `--danger` tone dot. Falls back to `--cngx-color-danger`.|
|`--cngx-status-info-color`|`oklch(0.6 0.14 250)`|Variant / Info|Colour of the `--info` tone dot.|
|`--cngx-status-neutral-color`|`oklch(0.6 0.02 290)`|Variant / Neutral|Colour of the `--neutral` tone dot.|

## CngxStepper

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-step-gap`|`0.5rem`|Layout|Gap between adjacent steps and between a step's indicator / label / badge slots.|
|`--cngx-step-strip-padding`|`0.5rem 0`|Layout|Padding shorthand of the strip container.|
|`--cngx-step-padding`|`0.5rem 0.75rem`|Layout|Padding shorthand of an individual step button.|
|`--cngx-step-padding-inline`|`0.75rem`|Layout|Inline-axis padding of the step button - used by vertical orientation to combine with the group indent.|
|`--cngx-step-padding-compact`|`0.375rem 0.5rem`|Layout|Tightened panel padding for container-query collapse. Applied when `<cngx-stepper>` is rendered inside a container narrower than `48rem` (sidebar / card / dialog) regardless of viewport.|
|`--cngx-step-focus-ring`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand. Matches the cngx focus convention from `@cngx/core/theming/reset.css` - 2px solid primary ember.|
|`--cngx-step-focus-offset`|`3px`|State / Focus|Outline offset of the focus ring. Set to 3px so the ring sits outside the indicator disc rather than on its edge - keeps the ring readable against the filled active / completed / errored disc backgrounds.|
|`--cngx-step-indicator-size`|`1.75rem`|Layout|Diameter of the indicator disc.|
|`--cngx-step-group-font-weight`|`600`|Typography|Font-weight of the group header.|
|`--cngx-step-group-indent`|`0.5rem`|Layout|Inline-start indent applied to nested steps and group headers.|
|`--cngx-step-badge-size`|``|State / Error|Rendered size of the validation-error icon after the step label. Registered without an initial value, so the rule's `1rem` fallback (16px, the hand-hinted small tier) applies until a host sets it; it inherits so a host override reaches the glyph.|
|`--cngx-step-error-badge-color`|``|State / Error|Colour of the validation-error icon. Registered without an initial value, so the fallback to `--cngx-step-errored-color` (and on to `--cngx-color-danger`) applies until a theme sets it.|
|`--cngx-step-rejection-icon-size`|``|State / Rejected|Rendered size of the persistent-rejection icon (slashed circle refused, alert triangle failed). Registered without an initial value, so the rule's `1rem` fallback (16px, the small tier) applies until a host sets it. A failed commit paints it in `--cngx-step-errored-color`, a refused one in `--cngx-step-refused-color`.|
|`--cngx-step-rejection-tint`|`18%`|State / Rejected|Strength of the rejected-step surface: the share of the reason colour (errored red for a failed commit, refused amber for a refused one) mixed into transparent. Skins that draw no surface ignore it.|
|`--cngx-step-rejection-radius`|`0.5rem`|State / Rejected|Corner radius of the rejected-step surface in the classic and stripe-status-rich skins. The shaped skins (path-chevron, pill-segment, chips) keep their own step shape.|
|`--cngx-step-distance`|`0`|Layout / Density|Distance of a step from the active one (`abs(index - active)`). Published per-step as data under `density: 'auto'`; it raises the step's shrink priority so the furthest steps give up their label first. Set and consumed on the step element, so it does not inherit.|
|`--cngx-step-shrink-weight`|`20`|Layout / Density|Multiplier turning per-step distance into flex-shrink priority under `density: 'auto'`. The active step shrinks at priority 1, every other step at `1 + distance * weight`, so a high weight makes neighbours collapse to number-only before the active label gives any ground.|
|`--cngx-step-collapsed-min`|`3.25rem`|Layout / Density|Minimum width of a step under `density: 'auto'` - the floor a collapsing step shrinks to, kept wide enough to hold the indicator so a number-bearing step never clips its disc.|
|`--cngx-step-collapsed-label-min`|`2ch`|Layout / Density|Minimum label width for non-active steps on label-only skins (no number fallback) under `density: 'auto'`, so a collapsing label keeps a readable stub instead of vanishing.|
|`--cngx-step-active-label-min`|`4rem`|Layout / Density|Guaranteed minimum label width for the active step, regardless of step count or container width, so the active label stays readable.|
|`--cngx-step-active-label-max`|`60cqi`|Layout / Density|Maximum width of the active label, in container-query units, so a very long active label cannot eat the whole strip and squeeze the sequence out. It also bounds how far the strip reflows when navigating between steps. `cqi` is 1% of the stepper container, so `60cqi` caps the active label at 60% of the strip width; the remaining ~40% (minus the active step's own indicator + padding) is left for the other steps.|
|`--cngx-stepper-group-chip-padding`|`0.125rem 0.5rem`|Group chip|Padding shorthand of a group-header chip. `inherits: true` so a value set on `cngx-stepper` reaches the chip in the strip.|
|`--cngx-stepper-group-chip-border-width`|`1px`|Group chip|Border width of a group-header chip.|
|`--cngx-stepper-group-chip-radius`|`999px`|Group chip|Corner radius of a group-header chip (pill by default).|
|`--cngx-stepper-group-chip-font-size`|`0.8125em`|Group chip|Font-size of a group-header chip - smaller than the step labels so it reads as a tag, not a peer step.|
|`--cngx-stepper-group-chip-line-height`|`1.25`|Group chip|Line-height of a group-header chip; drives the chip's height together with the padding.|
|`--cngx-step-pill-vertical-padding-block`|`var(--cngx-space-md)`|Skin / pill-segment|Block padding of each step in the vertical pill-segment skin.|
|`--cngx-stepper-collapse`|`0`|Layout|Collapse flag read by the component from `.cngx-stepper::after`. `1` swaps to the configured compact variant, `0` keeps the classic strip. Set to `1` by the container query below `30rem`; override it on the same pseudo-element to move the breakpoint.|
|`--cngx-step-color`|`currentColor`|Surface|Default text color inherited by step labels.|
|`--cngx-step-bg`|`transparent`|Surface|Default background of the stepper root.|
|`--cngx-step-indicator-bg`|`color-mix(in srgb, currentColor 10%, transparent)`|State / Resting|Background of the indicator disc at rest - soft tint of the inherited text color via `color-mix`.|
|`--cngx-step-indicator-color`|`currentColor`|State / Resting|Glyph color inside the indicator disc.|
|`--cngx-step-indicator-font-size`|`0.85em`|Typography|Font-size of the indicator glyph. The default completed check never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a check smaller than the 12px micro box.|
|`--cngx-step-indicator-font-weight`|`600`|Typography|Font-weight of the indicator glyph.|
|`--cngx-step-indicator-active-color`|`oklch(1 0 0)`|State / Active|Glyph color used by the active / completed / errored states so the filled disc reads against bright surfaces.|
|`--cngx-step-indicator-disabled-bg`|`color-mix(in srgb, currentColor 5%, transparent)`|State / Disabled|Background of the disabled indicator disc.|
|`--cngx-step-completed-color`|`oklch(0.5 0.15 145)`|State / Completed|Background of the completed indicator disc. Falls back to `--cngx-color-success`.|
|`--cngx-step-errored-color`|`oklch(0.45 0.15 25)`|State / Error|Background of the errored indicator disc. Falls back to `--cngx-color-danger`.|
|`--cngx-step-refused-color`|``|State / Refused|Fill of a refused-commit marker (the commit action answered `false`) on the dots and the aggregate error line. A refusal is no error, so it wears the rejection amber; a failed commit keeps `--cngx-step-errored-color`. Registered without an initial value, so the amber fallback applies until a theme sets it.|
|`--cngx-step-refused-text-color`|``|State / Refused|Text color of the aggregate line when every marked step is a refused commit. Defaults to the surrounding text colour: amber text would fall under the 4.5:1 text contrast.|
|`--cngx-step-active-fill`|`oklch(0.66 0.19 50)`|State / Active|Resolved fill of the active indicator disc. Defaults to the cngx ember primary (matching `--cngx-color-primary`). Consumers override via `--cngx-step-active-fill` directly, or upstream via `--cngx-step-active-color` (the consuming rule's `var()` chain threads through both). Baked-in fallback matches the cngx primary so the un-themed disc fits the foundation palette.|
|`--cngx-step-hover-bg`|`color-mix(in srgb, currentColor 8%, transparent)`|State / Hover|Background tint applied on hover of an enabled step.|
|`--cngx-step-busy-spinner-size`|`0.875rem`|State / Pending|Diameter of the busy spinner ring next to the active step.|
|`--cngx-step-busy-spinner-color`|`currentColor`|State / Pending|Stroke color of the busy spinner ring.|
|`--cngx-stepper-group-chip-border`|`color-mix(in srgb, currentColor 22%, transparent)`|Group chip|Border color of a resting group-header chip. Defaults to a faint currentColor outline so the chip themes with the strip; the Material bridge maps it to `--mat-sys-outline-variant`.|
|`--cngx-stepper-group-chip-bg`|`color-mix(in srgb, currentColor 6%, transparent)`|Group chip|Background of a resting group-header chip.|
|`--cngx-stepper-group-chip-color`|`currentColor`|Group chip|Label color of a resting group-header chip. Tracks the inherited text color by default.|
|`--cngx-stepper-group-chip-active-border`|`var(--cngx-color-primary)`|Group chip|Border color of the active-branch chip (the group owning the current step). No `initial-value`: the universal syntax keeps the property guaranteed-invalid until set, so the CSS `var()` fallback chain to `--cngx-color-primary` survives - the same knob that colours the active step. The Material bridge maps it to `--mat-sys-primary`.|
|`--cngx-stepper-group-chip-active-bg`|`color-mix(in srgb, var(--cngx-color-primary) 14%, transparent)`|Group chip|Background of the active-branch chip. See {@link --cngx-stepper-group-chip-active-border} for why no `initial-value` is declared.|
|`--cngx-stepper-group-chip-active-color`|`var(--cngx-color-text)`|Group chip|Label color of the active-branch chip. Neutral text by default: the primary accent lives on the chip border and tint (primary as text misses 4.5:1 on the light tint), like the tab and nav-link active labels. The Material bridge maps it to `--mat-sys-primary`.|
|`--cngx-step-linear-dot-fill`|`oklch(0.66 0.19 50)`|Skin / linear-minimal|Fill of the active dot in the linear-minimal skin. Falls back to the canonical active-fill so Material consumers inherit primary tones without per-skin overrides.|
|`--cngx-step-status-pill-bg-upcoming`|`color-mix(in srgb, currentColor 6%, transparent)`|Skin / stripe-status-rich|Background of the status pill on the `stripe-status-rich` skin when the step is upcoming. Soft-neutral surface tone.|
|`--cngx-step-status-pill-bg-in-progress`|`oklch(0.66 0.19 50)`|Skin / stripe-status-rich|Background of the status pill while the step is active / in-progress.|
|`--cngx-step-status-pill-bg-done`|`oklch(0.5 0.15 145)`|Skin / stripe-status-rich|Background of the status pill once the step is completed.|
|`--cngx-step-status-pill-bg-errored`|`oklch(0.45 0.15 25)`|Skin / stripe-status-rich|Background of the status pill when the step is errored.|
|`--cngx-step-status-pill-color`|`oklch(1 0 0)`|Skin / stripe-status-rich|Text color of the status pill on the active / completed / errored states. Hits the filled pill background.|
|`--cngx-step-status-pill-padding`|`0.125rem 0.5rem`|Skin / stripe-status-rich|Padding shorthand of the status pill. Derived from the global scale at the unskinned `cngx-stepper` host (stepper-base.css) so a root `[data-density]` re-scales the pill; `inherits: true` lets that host SET reach this skin-scoped element. The 2px block keeps the pill compact, so it is half `--cngx-space-xs` rather than snapped to a rung.|
|`--cngx-step-chevron-tile-active`|`oklch(0.66 0.19 50)`|Skin / path-chevron|Fill of the chevron tile while the step is active on the `path-chevron` skin.|
|`--cngx-step-chevron-tile-completed`|`color-mix(in srgb, oklch(0.5 0.15 145) 80%, transparent)`|Skin / path-chevron|Fill of the chevron tile once the step is completed.|
|`--cngx-step-chevron-tile-errored`|`oklch(0.45 0.15 25)`|Skin / path-chevron|Fill of the chevron tile when the step is errored.|
|`--cngx-step-chevron-tile-upcoming-bg`|`color-mix(in srgb, currentColor 12%, transparent)`|Skin / path-chevron|Fill of the upcoming chevron tile - soft surface tint so the chevron silhouette stays visible without competing with the active state.|
|`--cngx-step-chevron-tile-color`|`oklch(1 0 0)`|Skin / path-chevron|Text color of the chevron tile in the filled (active / completed / errored) states.|
|`--cngx-step-pill-radius`|`999px`|Skin / pill-segment|Border-radius of the `pill-segment` skin container - rounds the entire rail rather than per-step.|
|`--cngx-step-pill-segment-rail-bg`|`color-mix(in srgb, currentColor 6%, transparent)`|Skin / pill-segment|Rail background of the `pill-segment` skin - soft surface tint the active card floats on top of. Inherits so the host-set value reaches the strip descendant that paints it.|
|`--cngx-step-pill-segment-fill-active`|`oklch(1 0 0)`|Skin / pill-segment|Active card surface on the `pill-segment` skin - rendered as a raised tile inside the rail (iOS-style segmented control). Inherits so the host-set value reaches the step descendant that paints it.|
|`--cngx-step-pill-segment-fill-completed`|`transparent`|Skin / pill-segment|Optional completed-segment tint. Unset by default - the green check disc carries the "done" cue, so the segment stays flat. Set this to wash completed segments with a tint. Inherits so the host-set value reaches the step descendant that paints it.|
|`--cngx-step-pill-segment-card-shadow`|`0 1px 2px color-mix(in srgb, currentColor 12%, transparent),
      0 1px 1px color-mix(in srgb, currentColor 8%, transparent)`|Skin / pill-segment|Shadow on the active card in the `pill-segment` skin. Inherits so the host-set value reaches the step descendant that paints it.|
|`--cngx-step-connector-color`|`color-mix(in srgb, currentColor 35%, transparent)`|Skin / classic|Muted color of an upcoming connector segment on the classic skin with `[connectors]` opted-in. Inherits so host-set overrides cascade to the `::before` segment painter.|
|`--cngx-step-connector-completed-color`|`oklch(0.5 0.15 145)`|Skin / classic|Accent color of a completed connector segment on the classic skin with `[connectors]` opted-in. Falls back to the canonical completed color so Material consumers inherit success tones without per-skin overrides.|
|`--cngx-step-connector-errored-color`|`oklch(0.55 0.18 25)`|Skin / classic|Errored color of a connector segment whose preceding step is in `data-state='error'`. Mirrors `--cngx-step-errored-color`.|
|`--cngx-step-connector-pending-color`|`oklch(0.66 0.19 50)`|Skin / classic|In-flight color of a connector segment whose preceding step is in `data-state='pending'`. Mirrors the active-state color so the rail reads as "progressing".|
|`--cngx-step-connector-inset`|`6px`|Skin / classic|Symmetric breathing room between each disc edge and the connector rail end on the classic skin with `[connectors]` opted-in. Inherits so host-set overrides cascade.|
|`--cngx-step-connector-width`|`2px`|Skin / classic|Thickness of the connector segment on the classic skin with `[connectors]` opted-in. Inherits so host-set overrides cascade.|
|`--cngx-step-chips-gap`|`0.5rem`|Skin / chips|Gap between the standalone pills of the `chips` skin.|
|`--cngx-step-chips-radius`|`999px`|Skin / chips|Corner radius of each pill in the `chips` skin (default fully round).|
|`--cngx-step-chips-padding-inline`|`0.875rem`|Skin / chips|Inline padding inside each pill in the `chips` skin.|
|`--cngx-step-chips-padding-block`|`0.4rem`|Skin / chips|Block padding inside each pill in the `chips` skin.|
|`--cngx-step-chips-bg`|`color-mix(in srgb, currentColor 8%, transparent)`|Skin / chips|Inactive pill surface in the `chips` skin - a soft neutral tint. Inherits so the host-set value reaches the step descendant.|
|`--cngx-step-chips-color`|`color-mix(in srgb, currentColor 65%, transparent)`|Skin / chips|Inactive pill label colour in the `chips` skin - muted vs the active fill. Inherits so the host-set value reaches the step descendant.|
|`--cngx-step-chips-color-active`|`oklch(1 0 0)`|Skin / chips|Active pill label colour in the `chips` skin - the contrast tone on the filled accent. Inherits so the host-set value reaches the step descendant. The fill itself follows `--cngx-color-primary`.|
|`--cngx-step-chips-bg-completed`|`color-mix(in srgb, oklch(0.5 0.15 145) 12%, transparent)`|Skin / chips|Completed chip surface in the `chips` skin - a soft success tint. Inherits so the host-set value reaches the step descendant.|
|`--cngx-step-chips-color-completed`|`oklch(0.5 0.15 145)`|Skin / chips|Completed chip label + check colour in the `chips` skin. Inherits so the host-set value reaches the step descendant.|
|`--cngx-step-breadcrumb-gap`|`0.5rem`|Skin / breadcrumb|Gap between breadcrumb items (and the chevron separator inset) in the `breadcrumb` skin.|
|`--cngx-step-breadcrumb-radius`|`6px`|Skin / breadcrumb|Corner radius of the active-item pill in the `breadcrumb` skin.|
|`--cngx-step-breadcrumb-color`|`color-mix(in srgb, currentColor 48%, transparent)`|Skin / breadcrumb|Upcoming-item label colour in the `breadcrumb` skin - muted vs the active / completed items. Inherits so the host value reaches the step descendant.|
|`--cngx-step-breadcrumb-color-active`|`color-mix(in srgb, currentColor 92%, transparent)`|Skin / breadcrumb|Active-item label colour in the `breadcrumb` skin - full strength. Inherits so the host value reaches the step descendant.|
|`--cngx-step-breadcrumb-color-completed`|`color-mix(in srgb, currentColor 82%, transparent)`|Skin / breadcrumb|Completed-item label colour in the `breadcrumb` skin. Inherits so the host value reaches the step descendant.|
|`--cngx-step-breadcrumb-fill-active`|`color-mix(in srgb, currentColor 9%, transparent)`|Skin / breadcrumb|Active-item pill surface in the `breadcrumb` skin - the soft tint behind the current breadcrumb label. Inherits so the host value reaches the step descendant.|
|`--cngx-step-breadcrumb-check-color`|`oklch(0.5 0.15 145)`|Skin / breadcrumb|Completed-item check colour in the `breadcrumb` skin. Inherits so the host value reaches the step descendant.|
|`--cngx-step-chevron-horizontal-notch`|`0.75rem`|Skin / path-chevron|Depth of the chevron arrow notch in horizontal orientation. The step's inline padding grows by the same amount to clear it.|

## CngxStepperFooter

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-stepper-footer-gap`|`0.75rem`|Layout|Gap between the three footer regions.|
|`--cngx-stepper-footer-region-gap`|`0.5rem`|Layout|Gap between controls within a single region.|
|`--cngx-stepper-footer-margin-block-start`|`1rem`|Layout|Space above the footer, separating it from the panel.|
|`--cngx-stepper-footer-padding-block`|`0.75rem`|Layout|Block-axis padding inside the footer row.|
|`--cngx-stepper-footer-padding-inline`|`0`|Layout|Inline-axis padding inside the footer row.|
|`--cngx-stepper-footer-border-width`|`1px`|Border|Width of the top divider rule.|
|`--cngx-stepper-footer-border-style`|`solid`|Border|Style of the top divider rule.|
|`--cngx-stepper-footer-border-color`|`#e0e0e0`|Border|Color of the top divider rule. The Material bridge maps this to `--mat-sys-outline-variant`. Registered `inherits: true` so an ancestor-level consumer assignment (e.g. on `:root`) reaches the footer host - `inherits: false` would pin the divider to the registered initial for every ancestor-set value.|
|`--cngx-stepper-footer-center-basis`|`auto`|Layout|Flex-basis of the center region.|
|`--cngx-stepper-footer-center-color`|`inherit`|Color|Text color of the center region. Unset it inherits the surrounding text color; the Material bridge maps it to `--mat-sys-on-surface-variant`.|

## CngxSuffix

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-border-width`|`1px`|Sizing|Border width of the field box on every side, in every skin (transparent where a skin paints none). The box height and the touch floor of the controls inside it are derived from it, so changing it keeps the box on its formula.|
|`--cngx-field-ring-width`|`2px`|Sizing|Width of the focus ring an outline or bare box draws around its main control.|
|`--cngx-field-ring-offset`|`3px`|Sizing|Distance between the box edge and its focus ring.|
|`--cngx-field-affix-gap`|`8px`|Layout|Gap between the prefix, control, and suffix in an affix row.|
|`--cngx-field-affix-divider`|`0px`|Layout|Width of an optional divider between an affix and the control: the inline-end edge of a prefix, the inline-start edge of a suffix. `0px` draws none. Any width also pads the affix by `--cngx-space-sm` so the divider does not touch the affix content. Set it on the box.|

## CngxTabGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-tab-gap`|`0.5rem`|Layout|Gap between adjacent tab buttons and between a tab's icon / label / badge slots.|
|`--cngx-tab-strip-padding`|`0.5rem 0`|Layout|Padding shorthand of the tab strip (outer container).|
|`--cngx-tab-strip-bg`|`transparent`|Surface|Background of the tab strip.|
|`--cngx-tab-padding`|`0.5rem 0.75rem`|Layout|Padding shorthand of an individual tab button.|
|`--cngx-tab-bg`|`transparent`|Surface|Background of an individual tab button.|
|`--cngx-tab-color`|`currentColor`|Surface|Text color of a resting tab button.|
|`--cngx-tab-active-color`|`currentColor`|State / Active|Text color of the active (selected) tab.|
|`--cngx-tab-active-indicator-color`|`oklch(0.66 0.19 50)`|State / Active|Underline color of the active tab - a 2px box-shadow inset stripe along the inline-end edge of the tab button. \ Falls back to `--cngx-color-primary` so the brand accent paints the selection indicator without competing with text contrast.|
|`--cngx-tab-active-indicator-width`|`2px`|State / Active|Thickness of the active-tab underline indicator.|
|`--cngx-tab-focus-ring`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand.|
|`--cngx-tab-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-tab-error-badge-color`|``|State / Error|Colour of the validation-error alert icon after the tab label. Registered without an initial value, so the fallback to `--cngx-color-danger` (and its dark-scheme value) applies until a theme sets it. `inherits: true` so a value set on the `cngx-tab-group` / `cngx-tab-nav` host (the Material bridge sets it there) reaches the descendant badge. The `<cngx-tab-nav>` error link reads it as its text colour.|
|`--cngx-tab-busy-spinner-size`|`1rem`|State / Busy|Diameter of the busy spinner shown while a tab's commit is pending.|
|`--cngx-tab-busy-spinner-color`|`currentColor`|State / Busy|Stroke color of the busy spinner.|
|`--cngx-tab-rejection-icon-size`|`1.15em`|State / Rejected|Rendered size of the persistent rejection icon (slashed circle refused, alert triangle failed), in `em` of the tab label font. The universal syntax keeps the `em` unresolved until the icon reads it, and it inherits so a host override reaches the glyph.|
|`--cngx-tab-rejection-icon-color`|``|State / Rejected|Colour of a failed tab (the commit action threw): its alert icon and the base of its tinted surface. Registered without an initial value, so the fallback to `--cngx-color-danger` (and its dark-scheme value) applies until a theme sets it.|
|`--cngx-tab-failed-text-color`|``|State / Rejected|Label colour of a failed tab under the colour-only `line` skin. Registered without an initial value, so the fallback to `--cngx-color-danger-text` (danger at the text-rung lightness, 4.5:1 on the page in both schemes) applies until a theme sets it.|
|`--cngx-tab-rejection-tint`|`18%`|State / Rejected|Strength of the rejected-tab surface: the share of the reason colour (danger red for a failed switch, refused amber for a refused one) mixed into transparent. The `contained`, `segmented`, `pill` and `pill-outline` skins tint the tab in their own shape; the colour-only `line` skin ignores it. The pulse peaks at twice the share.|
|`--cngx-tab-rejected-pulse-duration`|`600ms`|State / Rejected|Duration of the rejected-tab pulse animation.|
|`--cngx-tab-refused-color`|``|State / Refused|Colour of a refused tab (the commit action answered `false`): its slashed-circle icon and the base of its tinted surface. A refusal is no error, so it wears amber; a failed switch takes `--cngx-tab-rejection-icon-color`. Registered without an initial value, so the fallback applies until a theme sets it: `--cngx-color-warning` mixed 70% toward `--cngx-color-text`, which keeps the icon at 3:1 on the light page (the raw warning amber reads 2.5:1 there).|
|`--cngx-tab-refused-text-color`|``|State / Refused|Label colour of a refused tab under the colour-only `line` skin. Registered without an initial value, so the fallback applies until a theme sets it: `--cngx-color-warning` mixed 55% toward `--cngx-color-text`, 4.5:1 on the page in both schemes.|
|`--cngx-tab-affordance-size`|`1.25rem`|State / Dismissable|Hit-target size of a tab's close button and the add-tab button.|
|`--cngx-tab-affordance-radius`|`9999px`|State / Dismissable|Corner radius of the close / add affordance buttons. The default pill radius draws a circle on the square glyph buttons and a pill when the add button grows around a projected text label.|
|`--cngx-tab-affordance-hover-bg`|`color-mix(in oklch, currentColor 14%, transparent)`|State / Dismissable|Hover/focus fill of the close / add affordance buttons. Defaults to a translucent tint of the current text colour, so it adapts to any surface and either colour scheme without a 4-block.|
|`--cngx-tab-label-line-height`|`1.4`|Layout|Line height of the primary label line. Also drives the leading height the row-layout icon aligns to, so a stacked sub-label grows downward while the icon stays beside the primary label.|
|`--cngx-tab-sublabel-font-size`|`0.8125rem`|Layout|Font size of a tab's optional secondary label line. `inherits: true` so a consumer override set on the `cngx-tab-group` host cascades down to the `.cngx-tabs__sublabel` descendant - with `inherits: false` the host-level override is silently dropped.|
|`--cngx-tab-sublabel-color`|`color-mix(in oklab, currentColor 65%, transparent)`|Surface|Text color of a tab's optional secondary label line. Defaults to a translucent tint of the tab's own text colour so it reads as a muted second line on any surface and in either colour scheme.|
|`--cngx-tab-vertical-gap`|`var(--cngx-space-md)`|Layout|Gutter between the strip and the panel in vertical orientation.|
|`--cngx-tab-strip-border`|`1px solid oklch(0.87 0 0)`|Surface|Border shorthand of the tab strip's bottom (or inline-end for vertical orientation) edge. `inherits: true` so a themed value assigned on the host reaches the strip (the registered token's initial-value would otherwise win over any `var()` fallback).|
|`--cngx-tab-indicator-thickness`|`2px`|Surface|Thickness of the active-tab ink-bar indicator.|
|`--cngx-tab-transition-duration`|`0.15s`|Motion|Transition duration for color + border-color crossfade on hover / active changes. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-tab-hover-color`|`currentColor`|State / Hover|Text color of the hover state.|
|`--cngx-tab-badge-size`|`1.15em`|State / Error|Rendered size of the validation-error alert icon after the tab label, in `em` of the label font. The universal syntax keeps the `em` unresolved until the icon reads it, and it inherits so a host override reaches the glyph.|
|`--cngx-tab-radius`|`0.5rem`|Skin|Corner radius of the contained / pill skin surfaces. Ignored by the `line` skin. `inherits: true` so a host-level override cascades onto the tab buttons and panel.|
|`--cngx-tab-active-bg`|`oklch(1 0 0)`|Skin|Surface that the active tab fuses with under the `contained` skin (the panel surface) and the active-pill fill under the `pill` skin. Set from `--cngx-color-surface` / `--cngx-color-primary` via the per-skin `:scope` assignment.|
|`--cngx-tab-inactive-bg`|`oklch(0.97 0 0)`|Skin|Resting-tab surface under the `contained` skin - kept visibly set back from the active tab so tabs read as controls, not headings.|
|`--cngx-tab-surface-border-color`|`oklch(0.87 0 0)`|Skin|Border color of the contained skin's tab + panel box.|
|`--cngx-tab-surface-border-width`|`1px`|Skin|Border width of the contained skin's tab + panel box. Drives both the border and the negative overlap that fuses adjacent tabs and the active tab with the panel (via `calc(... * -1)`), so a thicker border keeps the seams aligned.|
|`--cngx-tab-pill-active-color`|`currentColor`|Skin|Text color of the active pill (paints against `--cngx-tab-active-bg`).|
|`--cngx-tab-pill-hover-bg`|`oklch(0.95 0 0)`|Skin|Resting-pill hover fill under the `pill` skin.|
|`--cngx-tab-segmented-track-bg`|`oklch(0.96 0 0)`|Skin|Muted track the tabs sit in under the `segmented` skin.|
|`--cngx-tab-segmented-hover-bg`|`oklch(0.93 0 0)`|Skin|Resting-tab hover fill under the `segmented` skin - a faint lift off the track, kept short of the raised active surface.|
|`--cngx-tab-segmented-active-shadow`|`0 1px 2px oklch(0 0 0 / 0.06)`|Skin|Drop shadow that raises the active tab off the track under the `segmented` skin.|
|`--cngx-tab-pill-outline-color`|`oklch(0.66 0.19 50)`|Skin|Accent color of the `pill-outline` skin - paints the active tab's text and border, and the resting-tab hover border.|
|`--cngx-tab-pill-outline-bg`|`color-mix(in oklch, oklch(0.66 0.19 50) 12%, transparent)`|Skin|Tinted fill behind the active tab under the `pill-outline` skin.|
|`--cngx-tab-pill-radius`|`100px`|Skin|Corner radius of the `pill` / `pill-outline` skins - a full pill shape by default. Overridable for a softer rounded-rectangle.|
|`--cngx-tab-contained-accent-color`|`oklch(0.66 0.19 50)`|Skin|Color of the `contained` skin's top (inline-start for vertical) accent bar under the active tab.|
|`--cngx-tab-contained-accent-thickness`|`3px`|Skin|Thickness of the `contained` skin's active-tab accent bar.|
|`--cngx-tab-pill-gap`|`var(--cngx-space-xs, 0.375rem)`|Skin|Gap between the pills under the `pill` and `pill-outline` skins.|
|`--cngx-tab-pill-strip-padding`|`var(--cngx-space-xs, 0.25rem)`|Skin|Padding around the pill row under the `pill` and `pill-outline` skins, so the active pill's focus ring is not clipped.|
|`--cngx-tab-segmented-gap`|`var(--cngx-space-xs, 0.25rem)`|Skin|Gap between the tabs inside the `segmented` track.|
|`--cngx-tab-segmented-track-padding`|`var(--cngx-space-xs, 0.25rem)`|Skin|Padding of the `segmented` track around its tabs.|

## CngxTabNav

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-tab-gap`|`0.5rem`|Layout|Gap between adjacent tab buttons and between a tab's icon / label / badge slots.|
|`--cngx-tab-strip-padding`|`0.5rem 0`|Layout|Padding shorthand of the tab strip (outer container).|
|`--cngx-tab-strip-bg`|`transparent`|Surface|Background of the tab strip.|
|`--cngx-tab-padding`|`0.5rem 0.75rem`|Layout|Padding shorthand of an individual tab button.|
|`--cngx-tab-bg`|`transparent`|Surface|Background of an individual tab button.|
|`--cngx-tab-color`|`currentColor`|Surface|Text color of a resting tab button.|
|`--cngx-tab-active-color`|`currentColor`|State / Active|Text color of the active (selected) tab.|
|`--cngx-tab-active-indicator-color`|`oklch(0.66 0.19 50)`|State / Active|Underline color of the active tab - a 2px box-shadow inset stripe along the inline-end edge of the tab button. \ Falls back to `--cngx-color-primary` so the brand accent paints the selection indicator without competing with text contrast.|
|`--cngx-tab-active-indicator-width`|`2px`|State / Active|Thickness of the active-tab underline indicator.|
|`--cngx-tab-focus-ring`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand.|
|`--cngx-tab-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-tab-error-badge-color`|``|State / Error|Colour of the validation-error alert icon after the tab label. Registered without an initial value, so the fallback to `--cngx-color-danger` (and its dark-scheme value) applies until a theme sets it. `inherits: true` so a value set on the `cngx-tab-group` / `cngx-tab-nav` host (the Material bridge sets it there) reaches the descendant badge. The `<cngx-tab-nav>` error link reads it as its text colour.|
|`--cngx-tab-busy-spinner-size`|`1rem`|State / Busy|Diameter of the busy spinner shown while a tab's commit is pending.|
|`--cngx-tab-busy-spinner-color`|`currentColor`|State / Busy|Stroke color of the busy spinner.|
|`--cngx-tab-rejection-icon-size`|`1.15em`|State / Rejected|Rendered size of the persistent rejection icon (slashed circle refused, alert triangle failed), in `em` of the tab label font. The universal syntax keeps the `em` unresolved until the icon reads it, and it inherits so a host override reaches the glyph.|
|`--cngx-tab-rejection-icon-color`|``|State / Rejected|Colour of a failed tab (the commit action threw): its alert icon and the base of its tinted surface. Registered without an initial value, so the fallback to `--cngx-color-danger` (and its dark-scheme value) applies until a theme sets it.|
|`--cngx-tab-failed-text-color`|``|State / Rejected|Label colour of a failed tab under the colour-only `line` skin. Registered without an initial value, so the fallback to `--cngx-color-danger-text` (danger at the text-rung lightness, 4.5:1 on the page in both schemes) applies until a theme sets it.|
|`--cngx-tab-rejection-tint`|`18%`|State / Rejected|Strength of the rejected-tab surface: the share of the reason colour (danger red for a failed switch, refused amber for a refused one) mixed into transparent. The `contained`, `segmented`, `pill` and `pill-outline` skins tint the tab in their own shape; the colour-only `line` skin ignores it. The pulse peaks at twice the share.|
|`--cngx-tab-rejected-pulse-duration`|`600ms`|State / Rejected|Duration of the rejected-tab pulse animation.|
|`--cngx-tab-refused-color`|``|State / Refused|Colour of a refused tab (the commit action answered `false`): its slashed-circle icon and the base of its tinted surface. A refusal is no error, so it wears amber; a failed switch takes `--cngx-tab-rejection-icon-color`. Registered without an initial value, so the fallback applies until a theme sets it: `--cngx-color-warning` mixed 70% toward `--cngx-color-text`, which keeps the icon at 3:1 on the light page (the raw warning amber reads 2.5:1 there).|
|`--cngx-tab-refused-text-color`|``|State / Refused|Label colour of a refused tab under the colour-only `line` skin. Registered without an initial value, so the fallback applies until a theme sets it: `--cngx-color-warning` mixed 55% toward `--cngx-color-text`, 4.5:1 on the page in both schemes.|
|`--cngx-tab-affordance-size`|`1.25rem`|State / Dismissable|Hit-target size of a tab's close button and the add-tab button.|
|`--cngx-tab-affordance-radius`|`9999px`|State / Dismissable|Corner radius of the close / add affordance buttons. The default pill radius draws a circle on the square glyph buttons and a pill when the add button grows around a projected text label.|
|`--cngx-tab-affordance-hover-bg`|`color-mix(in oklch, currentColor 14%, transparent)`|State / Dismissable|Hover/focus fill of the close / add affordance buttons. Defaults to a translucent tint of the current text colour, so it adapts to any surface and either colour scheme without a 4-block.|
|`--cngx-tab-label-line-height`|`1.4`|Layout|Line height of the primary label line. Also drives the leading height the row-layout icon aligns to, so a stacked sub-label grows downward while the icon stays beside the primary label.|
|`--cngx-tab-sublabel-font-size`|`0.8125rem`|Layout|Font size of a tab's optional secondary label line. `inherits: true` so a consumer override set on the `cngx-tab-group` host cascades down to the `.cngx-tabs__sublabel` descendant - with `inherits: false` the host-level override is silently dropped.|
|`--cngx-tab-sublabel-color`|`color-mix(in oklab, currentColor 65%, transparent)`|Surface|Text color of a tab's optional secondary label line. Defaults to a translucent tint of the tab's own text colour so it reads as a muted second line on any surface and in either colour scheme.|
|`--cngx-tab-vertical-gap`|`var(--cngx-space-md)`|Layout|Gutter between the strip and the panel in vertical orientation.|
|`--cngx-tab-affordance-gap`|`var(--cngx-space-xs)`|Layout|Gap between the items inside a tab link.|
|`--cngx-tab-active-bg`|`var(--cngx-color-primary, oklch(0.66 0.19 50))`|Skin|Surface that the active tab fuses with under the `contained` skin (the panel surface) and the active-pill fill under the `pill` skin. Set from `--cngx-color-surface` / `--cngx-color-primary` via the per-skin `:scope` assignment.|
|`--cngx-tab-pill-active-color`|`var(--cngx-color-on-primary, oklch(1 0 0))`|Skin|Text color of the active pill (paints against `--cngx-tab-active-bg`).|
|`--cngx-tab-pill-hover-bg`|`color-mix(
        in oklch,
        var(--cngx-color-primary, oklch(0.66 0.19 50)) 8%,
        transparent
      )`|Skin|Resting-pill hover fill under the `pill` skin.|
|`--cngx-tab-pill-outline-color`|`var(--cngx-color-primary, oklch(0.66 0.19 50))`|Skin|Accent color of the `pill-outline` skin - paints the active tab's text and border, and the resting-tab hover border.|
|`--cngx-tab-pill-outline-bg`|`color-mix(
        in oklch,
        var(--cngx-tab-pill-outline-color, oklch(0.66 0.19 50)) 12%,
        transparent
      )`|Skin|Tinted fill behind the active tab under the `pill-outline` skin.|
|`--cngx-tab-segmented-track-bg`|`color-mix(
        in oklch,
        var(--cngx-color-surface, oklch(1 0 0)),
        var(--cngx-color-border, oklch(0.88 0.005 250)) 25%
      )`|Skin|Muted track the tabs sit in under the `segmented` skin.|
|`--cngx-tab-segmented-hover-bg`|`color-mix(
        in oklch,
        var(--cngx-color-surface, oklch(1 0 0)),
        var(--cngx-color-border, oklch(0.88 0.005 250)) 45%
      )`|Skin|Resting-tab hover fill under the `segmented` skin - a faint lift off the track, kept short of the raised active surface.|
|`--cngx-tab-inactive-bg`|`color-mix(
        in oklch,
        var(--cngx-color-surface, oklch(1 0 0)),
        var(--cngx-color-border, oklch(0.88 0.005 250)) 25%
      )`|Skin|Resting-tab surface under the `contained` skin - kept visibly set back from the active tab so tabs read as controls, not headings.|
|`--cngx-tab-surface-border-color`|`var(--cngx-color-border, oklch(0.88 0.005 250))`|Skin|Border color of the contained skin's tab + panel box.|
|`--cngx-tab-contained-accent-color`|`var(--cngx-color-primary, oklch(0.66 0.19 50))`|Skin|Color of the `contained` skin's top (inline-start for vertical) accent bar under the active tab.|
|`--cngx-tab-segmented-active-shadow`|`0 1px 3px oklch(0 0 0 / 0.3)`|Skin|Drop shadow that raises the active tab off the track under the `segmented` skin.|

## CngxTabOverflow

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-tab-overflow-bg`|`transparent`|Surface|Background of the overflow wrapper. Falls back through `--cngx-tab-strip-bg`.|
|`--cngx-tab-overflow-button-bg`|`transparent`|Surface|Background of the trigger button.|
|`--cngx-tab-overflow-button-radius`|`0.25rem`|Layout|Corner radius of the trigger button.|
|`--cngx-tab-overflow-popover-min-width`|`12rem`|Layout|Minimum inline size of the popover panel.|
|`--cngx-tab-overflow-popover-max-height`|`16rem`|Layout|Maximum block size of the popover panel before vertical scrolling.|
|`--cngx-tab-overflow-popover-bg`|`oklch(1 0 0)`|Surface|Background of the popover panel. Falls back through `--cngx-color-surface`.|
|`--cngx-tab-overflow-popover-border`|`1px solid currentColor`|Surface|Border shorthand of the popover panel.|
|`--cngx-tab-overflow-popover-radius`|`0.25rem`|Layout|Corner radius of the popover panel.|
|`--cngx-tab-overflow-popover-padding`|`0.25rem 0`|Layout|Padding shorthand of the popover panel.|
|`--cngx-tab-overflow-item-padding`|`0.5rem 0.75rem`|Layout|Padding shorthand of each list item.|
|`--cngx-tab-overflow-item-hover-bg`|`oklch(0 0 0 / 0.05)`|State / Hover|Background of the item hover state.|
|`--cngx-tab-overflow-item-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the AD-active item - APG combobox pattern requires visible indication of the highlighted option.|
|`--cngx-tab-overflow-item-active-outline`|`2px solid currentColor`|State / Active|Outline shorthand applied to the AD-active item.|
|`--cngx-tab-overflow-item-active-outline-offset`|`-2px`|State / Active|Outline offset of the AD-active item.|

## CngxTag

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-tag-radius`|`4px`|Layout|Corner radius. Defaults to `--cngx-radius-sm` so tags read as gentle rectangles rather than pills.|
|`--cngx-tag-font-weight`|`500`|Typography|Font-weight of the tag label.|
|`--cngx-tag-bg`|`transparent`|Surface|Background. Defaults to transparent; variant + color combinations pin a concrete value through the `[data-color]` cascade.|
|`--cngx-tag-color`|`currentColor`|Surface|Text color. Defaults to `currentColor`.|
|`--cngx-tag-border`|`1px solid transparent`|Surface|Border shorthand. Variant + color combinations override per `[data-color]`.|
|`--cngx-tag-gap`|`4px`|Layout|Gap between the tag's internal slots (prefix / label / suffix).|
|`--cngx-tag-padding`|`2px 8px`|Layout|Padding shorthand of the default density.|
|`--cngx-tag-font-size`|`0.75rem`|Typography|Font-size of the default density.|
|`--cngx-tag-sm-padding`|`0 6px`|Variant / Density|Padding shorthand for the `.cngx-tag--sm` density.|
|`--cngx-tag-sm-font-size`|`0.6875rem`|Variant / Density|Font-size for the `.cngx-tag--sm` density.|
|`--cngx-tag-lg-padding`|`4px 10px`|Variant / Density|Padding shorthand for the `.cngx-tag--lg` density.|
|`--cngx-tag-lg-font-size`|`0.875rem`|Variant / Density|Font-size for the `.cngx-tag--lg` density.|
|`--cngx-tag-xl-padding`|`6px 12px`|Variant / Density|Padding shorthand for the `.cngx-tag--xl` density.|
|`--cngx-tag-xl-font-size`|`1rem`|Variant / Density|Font-size for the `.cngx-tag--xl` density.|
|`--cngx-tag-neutral-bg`|`oklch(0.92 0.005 250)`|Variant / Neutral|Filled background of the `[data-color=neutral]` variant.|
|`--cngx-tag-neutral-color`|`oklch(0.34 0.015 250)`|Variant / Neutral|Text color of the `[data-color=neutral]` variant.|
|`--cngx-tag-neutral-border`|`oklch(0.68 0.01 250)`|Variant / Neutral|Border color of the `[data-color=neutral]` variant.|
|`--cngx-tag-neutral-subtle-bg`|`oklch(0.96 0.005 250)`|Variant / Neutral|Subtle background of the `[data-color=neutral]` variant.|
|`--cngx-tag-success-bg`|`oklch(0.95 0.05 145)`|Variant / Success|Filled background of the `[data-color=success]` variant.|
|`--cngx-tag-success-color`|`oklch(0.4 0.1 160)`|Variant / Success|Text color of the `[data-color=success]` variant.|
|`--cngx-tag-success-border`|`oklch(0.65 0.15 155)`|Variant / Success|Border color of the `[data-color=success]` variant.|
|`--cngx-tag-success-subtle-bg`|`oklch(0.97 0.025 145)`|Variant / Success|Subtle background of the `[data-color=success]` variant.|
|`--cngx-tag-warning-bg`|`oklch(0.95 0.05 90)`|Variant / Warning|Filled background of the `[data-color=warning]` variant.|
|`--cngx-tag-warning-color`|`oklch(0.45 0.12 60)`|Variant / Warning|Text color of the `[data-color=warning]` variant.|
|`--cngx-tag-warning-border`|`oklch(0.72 0.18 70)`|Variant / Warning|Border color of the `[data-color=warning]` variant.|
|`--cngx-tag-warning-subtle-bg`|`oklch(0.98 0.02 90)`|Variant / Warning|Subtle background of the `[data-color=warning]` variant.|
|`--cngx-tag-error-bg`|`oklch(0.94 0.04 25)`|Variant / Error|Filled background of the `[data-color=error]` variant.|
|`--cngx-tag-error-color`|`oklch(0.4 0.15 25)`|Variant / Error|Text color of the `[data-color=error]` variant.|
|`--cngx-tag-error-border`|`oklch(0.65 0.22 25)`|Variant / Error|Border color of the `[data-color=error]` variant.|
|`--cngx-tag-error-subtle-bg`|`oklch(0.98 0.015 25)`|Variant / Error|Subtle background of the `[data-color=error]` variant.|
|`--cngx-tag-info-bg`|`oklch(0.93 0.04 240)`|Variant / Info|Filled background of the `[data-color=info]` variant.|
|`--cngx-tag-info-color`|`oklch(0.4 0.15 250)`|Variant / Info|Text color of the `[data-color=info]` variant.|
|`--cngx-tag-info-border`|`oklch(0.62 0.2 250)`|Variant / Info|Border color of the `[data-color=info]` variant.|
|`--cngx-tag-info-subtle-bg`|`oklch(0.97 0.025 240)`|Variant / Info|Subtle background of the `[data-color=info]` variant.|

## CngxTagGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-tag-group-stack-gap`|`8px`|Layout|Vertical gap between the three group zones (header / row / accessory). Drives the outer column stack.|
|`--cngx-tag-group-gap`|`8px`|Layout|Horizontal gap between tags in the row when no density modifier is applied. Falls back to `--cngx-space-sm`.|
|`--cngx-tag-group-gap-xs`|`4px`|Variant / Density|Horizontal gap for the `.cngx-tag-group--gap-xs` density modifier.|
|`--cngx-tag-group-gap-md`|`12px`|Variant / Density|Horizontal gap for the `.cngx-tag-group--gap-md` density modifier.|

## CngxTextStepper

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-step-refused-color`|``|State / Refused|Fill of a refused-commit marker (the commit action answered `false`). A refusal is no error, so it wears the rejection amber; a failed commit keeps `--cngx-step-errored-color`. Registered without an initial value, so the amber fallback applies until a theme sets it.|
|`--cngx-step-refused-text-color`|``|State / Refused|Text color of the aggregate line when every marked step is a refused commit. Defaults to the surrounding text colour: amber text would fall under the 4.5:1 text contrast.|
|`--cngx-text-step-gap`|`var(--cngx-space-sm)`|Layout|Column gap between the inline items of the readout row.|

## CngxTimeline

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-timeline-item-gap`|`16px`|Layout|Vertical gap between consecutive rows inside one group. SET from `--cngx-space-md`.|
|`--cngx-timeline-group-gap`|`24px`|Layout|Vertical gap between two groups. SET from `--cngx-space-lg`.|
|`--cngx-timeline-surface-padding`|`4px`|Layout|Padding around the organism's own surfaces - empty, error, refreshing tail. Distinct from `--cngx-timeline-content-padding`, which belongs to the row and is SET at the row host where the row can see it. SET from `--cngx-space-xs`.|
|`--cngx-timeline-skeleton-line-size`|`12px`|Layout|Height of one placeholder bar in the loading body. Deliberately outside the density scale and not SET from it: the bar is a fixed affordance, and the surrounding raster already compacts with `[data-density]`.|

## CngxTimelineConnector

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-timeline-rail-inset`|`6px`|Layout|Distance the rail is pulled back from the edge of the marker cell so it meets the marker's centre. Affordance geometry, deliberately outside the density scale - it tracks `--cngx-timeline-marker-size` instead, and a density swap that moved it would detach the rail from the dot.|
|`--cngx-timeline-marker-size`|`12px`|Layout|Diameter of the marker dot.|
|`--cngx-timeline-marker-glyph-size`|`60%`|Layout|Size of a bare `svg` glyph projected into the marker, as a share of the marker box. A percentage rather than a length so it tracks `--cngx-timeline-marker-size` on its own: `em` would resolve against the marker's pinned `font-size`, which is not the dot's size. Photos are not covered by this - an `img` or `picture` fills the dot edge to edge, because a cropped portrait wants no inset and a glyph does.|
|`--cngx-timeline-item-inline-size`|`192px`|Layout|Width of one row on the horizontal axis. Ignored in the vertical default, where a row takes the container's width. An affordance, not compactness, so it is deliberately outside the density scale. It exists because a horizontal run has no sensible content-derived width: flex would size every card to its longest word and the axis would read as a ragged queue. Override per instance for denser or wider cards.|
|`--cngx-timeline-connector-width`|`2px`|Layout|Thickness of the connector rail.|
|`--cngx-timeline-marker-ring-width`|`3px`|Layout|Width of the halo ring drawn around a marker in the `active` status.|
|`--cngx-timeline-connector-color`|`oklch(0.88 0.005 250)`|Surface|Colour of the connector rail in its default (unstated) status.|
|`--cngx-timeline-surface`|`oklch(1 0 0)`|Surface|Background the marker is punched out of, so a coloured rail passing behind the dot does not show through it.|
|`--cngx-timeline-marker-fg`|`oklch(1 0 0)`|Typography|Foreground colour of a glyph projected into the marker.|
|`--cngx-timeline-meta-size`|`0.8125rem`|Typography|Font size for secondary text across the family - timestamps, inline errors, date headers, the refreshing tail. Registered here rather than with either consumer, because the row and the organism both read it and a registration in one is out of scope for the other.|
|`--cngx-timeline-text-color`|`oklch(0.2 0.01 250)`|Typography|Primary text colour inside an item.|
|`--cngx-timeline-muted-color`|`oklch(0.5 0.01 250)`|Typography|Secondary text colour - timestamps, group headers, the refreshing tail.|
|`--cngx-timeline-done-color`|`oklch(0.6 0.15 145)`|Variant / Done|Marker and rail colour for the `done` status.|
|`--cngx-timeline-active-color`|`oklch(0.66 0.19 50)`|Variant / Active|Marker and rail colour for the `active` status.|
|`--cngx-timeline-upcoming-color`|`oklch(0.5 0.01 250)`|Variant / Upcoming|Marker and rail colour for the `upcoming` status. Pairs with a dashed rail, so the state survives a colour-blind reader.|
|`--cngx-timeline-rejected-color`|`oklch(0.6 0.18 25)`|Variant / Rejected|Marker and rail colour for the `rejected` status, and for an item whose own `[state]` failed.|
|`--cngx-timeline-pulse-duration`|`1.6s`|Motion|Period of the busy pulse on a marker. Set to `0s` to stop it without touching the rest of the family.|

## CngxTimelineItem

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-timeline-rail-inset`|`6px`|Layout|Distance the rail is pulled back from the edge of the marker cell so it meets the marker's centre. Affordance geometry, deliberately outside the density scale - it tracks `--cngx-timeline-marker-size` instead, and a density swap that moved it would detach the rail from the dot.|
|`--cngx-timeline-marker-size`|`12px`|Layout|Diameter of the marker dot.|
|`--cngx-timeline-marker-glyph-size`|`60%`|Layout|Size of a bare `svg` glyph projected into the marker, as a share of the marker box. A percentage rather than a length so it tracks `--cngx-timeline-marker-size` on its own: `em` would resolve against the marker's pinned `font-size`, which is not the dot's size. Photos are not covered by this - an `img` or `picture` fills the dot edge to edge, because a cropped portrait wants no inset and a glyph does.|
|`--cngx-timeline-item-inline-size`|`192px`|Layout|Width of one row on the horizontal axis. Ignored in the vertical default, where a row takes the container's width. An affordance, not compactness, so it is deliberately outside the density scale. It exists because a horizontal run has no sensible content-derived width: flex would size every card to its longest word and the axis would read as a ragged queue. Override per instance for denser or wider cards.|
|`--cngx-timeline-connector-width`|`2px`|Layout|Thickness of the connector rail.|
|`--cngx-timeline-marker-ring-width`|`3px`|Layout|Width of the halo ring drawn around a marker in the `active` status.|
|`--cngx-timeline-connector-color`|`oklch(0.88 0.005 250)`|Surface|Colour of the connector rail in its default (unstated) status.|
|`--cngx-timeline-surface`|`oklch(1 0 0)`|Surface|Background the marker is punched out of, so a coloured rail passing behind the dot does not show through it.|
|`--cngx-timeline-marker-fg`|`oklch(1 0 0)`|Typography|Foreground colour of a glyph projected into the marker.|
|`--cngx-timeline-meta-size`|`0.8125rem`|Typography|Font size for secondary text across the family - timestamps, inline errors, date headers, the refreshing tail. Registered here rather than with either consumer, because the row and the organism both read it and a registration in one is out of scope for the other.|
|`--cngx-timeline-text-color`|`oklch(0.2 0.01 250)`|Typography|Primary text colour inside an item.|
|`--cngx-timeline-muted-color`|`oklch(0.5 0.01 250)`|Typography|Secondary text colour - timestamps, group headers, the refreshing tail.|
|`--cngx-timeline-done-color`|`oklch(0.6 0.15 145)`|Variant / Done|Marker and rail colour for the `done` status.|
|`--cngx-timeline-active-color`|`oklch(0.66 0.19 50)`|Variant / Active|Marker and rail colour for the `active` status.|
|`--cngx-timeline-upcoming-color`|`oklch(0.5 0.01 250)`|Variant / Upcoming|Marker and rail colour for the `upcoming` status. Pairs with a dashed rail, so the state survives a colour-blind reader.|
|`--cngx-timeline-rejected-color`|`oklch(0.6 0.18 25)`|Variant / Rejected|Marker and rail colour for the `rejected` status, and for an item whose own `[state]` failed.|
|`--cngx-timeline-pulse-duration`|`1.6s`|Motion|Period of the busy pulse on a marker. Set to `0s` to stop it without touching the rest of the family.|
|`--cngx-timeline-gap`|`8px`|Layout|Column gap between the marker track and the content. SET from `--cngx-space-sm`.|
|`--cngx-timeline-row-gap`|`4px`|Layout|Row gap inside one item, between the timestamp and the body. SET from `--cngx-space-xs`.|
|`--cngx-timeline-content-padding`|`4px`|Layout|Padding around an item's projected body. SET from `--cngx-space-xs`.|

## CngxTimelineMarker

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-timeline-rail-inset`|`6px`|Layout|Distance the rail is pulled back from the edge of the marker cell so it meets the marker's centre. Affordance geometry, deliberately outside the density scale - it tracks `--cngx-timeline-marker-size` instead, and a density swap that moved it would detach the rail from the dot.|
|`--cngx-timeline-marker-size`|`12px`|Layout|Diameter of the marker dot.|
|`--cngx-timeline-marker-glyph-size`|`60%`|Layout|Size of a bare `svg` glyph projected into the marker, as a share of the marker box. A percentage rather than a length so it tracks `--cngx-timeline-marker-size` on its own: `em` would resolve against the marker's pinned `font-size`, which is not the dot's size. Photos are not covered by this - an `img` or `picture` fills the dot edge to edge, because a cropped portrait wants no inset and a glyph does.|
|`--cngx-timeline-item-inline-size`|`192px`|Layout|Width of one row on the horizontal axis. Ignored in the vertical default, where a row takes the container's width. An affordance, not compactness, so it is deliberately outside the density scale. It exists because a horizontal run has no sensible content-derived width: flex would size every card to its longest word and the axis would read as a ragged queue. Override per instance for denser or wider cards.|
|`--cngx-timeline-connector-width`|`2px`|Layout|Thickness of the connector rail.|
|`--cngx-timeline-marker-ring-width`|`3px`|Layout|Width of the halo ring drawn around a marker in the `active` status.|
|`--cngx-timeline-connector-color`|`oklch(0.88 0.005 250)`|Surface|Colour of the connector rail in its default (unstated) status.|
|`--cngx-timeline-surface`|`oklch(1 0 0)`|Surface|Background the marker is punched out of, so a coloured rail passing behind the dot does not show through it.|
|`--cngx-timeline-marker-fg`|`oklch(1 0 0)`|Typography|Foreground colour of a glyph projected into the marker.|
|`--cngx-timeline-meta-size`|`0.8125rem`|Typography|Font size for secondary text across the family - timestamps, inline errors, date headers, the refreshing tail. Registered here rather than with either consumer, because the row and the organism both read it and a registration in one is out of scope for the other.|
|`--cngx-timeline-text-color`|`oklch(0.2 0.01 250)`|Typography|Primary text colour inside an item.|
|`--cngx-timeline-muted-color`|`oklch(0.5 0.01 250)`|Typography|Secondary text colour - timestamps, group headers, the refreshing tail.|
|`--cngx-timeline-done-color`|`oklch(0.6 0.15 145)`|Variant / Done|Marker and rail colour for the `done` status.|
|`--cngx-timeline-active-color`|`oklch(0.66 0.19 50)`|Variant / Active|Marker and rail colour for the `active` status.|
|`--cngx-timeline-upcoming-color`|`oklch(0.5 0.01 250)`|Variant / Upcoming|Marker and rail colour for the `upcoming` status. Pairs with a dashed rail, so the state survives a colour-blind reader.|
|`--cngx-timeline-rejected-color`|`oklch(0.6 0.18 25)`|Variant / Rejected|Marker and rail colour for the `rejected` status, and for an item whose own `[state]` failed.|
|`--cngx-timeline-pulse-duration`|`1.6s`|Motion|Period of the busy pulse on a marker. Set to `0s` to stop it without touching the rest of the family.|

## CngxToastOutlet

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-feedback-info-bg`|`oklch(from var(--cngx-color-info, oklch(0.65 0.12 240)) 0.96 0.025 h)`|Severity|Background tint of info alerts and banners.|
|`--cngx-feedback-info-border`|`oklch(
      from var(--cngx-color-info, oklch(0.65 0.12 240)) 0.85 0.07 h
    )`|Severity|Border colour of info alerts and banners.|
|`--cngx-feedback-info-icon`|`color-mix(
      in oklab,
      var(--cngx-color-info, oklch(0.65 0.12 240)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the info severity icon in alerts and banners, and the info toast accent.|
|`--cngx-feedback-success-bg`|`oklch(
      from var(--cngx-color-success, oklch(0.6 0.15 145)) 0.96 0.04 h
    )`|Severity|Background tint of success alerts and banners.|
|`--cngx-feedback-success-border`|`oklch(
      from var(--cngx-color-success, oklch(0.6 0.15 145)) 0.85 0.1 h
    )`|Severity|Border colour of success alerts and banners.|
|`--cngx-feedback-success-icon`|`color-mix(
      in oklab,
      var(--cngx-color-success, oklch(0.6 0.15 145)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the success severity icon in alerts and banners, and the success toast accent.|
|`--cngx-feedback-warning-bg`|`oklch(
      from var(--cngx-color-warning, oklch(0.72 0.15 75)) 0.97 0.04 h
    )`|Severity|Background tint of warning alerts and banners.|
|`--cngx-feedback-warning-border`|`oklch(
      from var(--cngx-color-warning, oklch(0.72 0.15 75)) 0.86 0.1 h
    )`|Severity|Border colour of warning alerts and banners.|
|`--cngx-feedback-warning-icon`|`color-mix(
      in oklab,
      var(--cngx-color-warning, oklch(0.72 0.15 75)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the warning severity icon in alerts and banners, and the warning toast accent.|
|`--cngx-feedback-error-bg`|`oklch(from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.96 0.025 h)`|Severity|Background tint of error alerts and banners.|
|`--cngx-feedback-error-border`|`oklch(
      from var(--cngx-color-danger, oklch(0.6 0.18 25)) 0.85 0.08 h
    )`|Severity|Border colour of error alerts and banners.|
|`--cngx-feedback-error-icon`|`color-mix(
      in oklab,
      var(--cngx-color-danger, oklch(0.6 0.18 25)) 90%,
      var(--cngx-color-text, oklch(0.2 0.01 250))
    )`|Severity|Colour of the error severity icon in alerts and banners, and the error toast accent.|
|`--cngx-toast-z-index`|`9999`|Layout|Stacking-context order - high so toasts overlay dialogs / popovers.|
|`--cngx-toast-gap`|`8px`|Layout|Vertical gap between stacked toasts.|
|`--cngx-toast-outlet-padding`|`16px`|Layout|Outer padding around the toast outlet (viewport offset).|
|`--cngx-toast-max-width`|`420px`|Layout|Maximum inline size of each toast - caps long messages.|
|`--cngx-toast-inner-gap`|`10px`|Layout|Gap between icon, body, and dismiss button inside a toast.|
|`--cngx-toast-padding`|`12px 16px`|Layout|Padding shorthand inside each toast.|
|`--cngx-toast-border-radius`|`8px`|Layout|Corner radius of each toast.|
|`--cngx-toast-bg`|`oklch(1 0 0)`|Surface|Background of each toast.|
|`--cngx-toast-color`|`oklch(0.25 0.015 250)`|Surface|Text color of each toast.|
|`--cngx-toast-shadow`|`0 8px 24px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow of each toast.|
|`--cngx-toast-border`|`1px solid oklch(0 0 0 / 0.08)`|Surface|Border shorthand of each toast. The real border keeps the overlay edge visible under forced colors, where the shadow is dropped.|
|`--cngx-toast-enter-duration`|`200ms`|Motion|Duration of the enter animation. Derives from the `--cngx-duration-base` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-toast-enter-easing`|`ease-out`|Motion|Easing curve of the enter animation.|
|`--cngx-toast-accent`|`currentColor`|Surface|Severity accent the glyph and the action derive from. Set by each `.cngx-toast--{severity}` rule from `--cngx-toast-{severity}-accent`; theme the per-severity tokens, not this hook.|
|`--cngx-toast-info-accent`|`oklch(0.6 0.11 240)`|Variant / Info|Glyph and action accent of the info variant. Delegates to the shared `--cngx-feedback-info-icon` (`--cngx-color-info` mixed 90% into the text colour), the alert and banner glyph colour.|
|`--cngx-toast-success-accent`|`oklch(0.56 0.135 145)`|Variant / Success|Glyph and action accent of the success variant. Delegates to the shared `--cngx-feedback-success-icon` (`--cngx-color-success` mixed 90% into the text colour), the alert and banner glyph colour.|
|`--cngx-toast-warning-accent`|`oklch(0.67 0.135 75)`|Variant / Warning|Glyph and action accent of the warning variant. Delegates to the shared `--cngx-feedback-warning-icon` (`--cngx-color-warning` mixed 90% into the text colour), the alert and banner glyph colour.|
|`--cngx-toast-error-accent`|`oklch(0.56 0.16 25)`|Variant / Error|Glyph and action accent of the error variant. Delegates to the shared `--cngx-feedback-error-icon` (`--cngx-color-danger` mixed 90% into the text colour), the alert and banner glyph colour.|
|`--cngx-toast-icon-size`|`20px`|Layout|Default icon size when no custom icon is projected.|
|`--cngx-toast-font-size`|`0.875rem`|Typography|Font-size of the toast body text.|
|`--cngx-toast-line-height`|`1.5`|Typography|Line-height of the toast body text.|
|`--cngx-toast-title-font-weight`|`600`|Typography|Font-weight of the title slot.|
|`--cngx-toast-title-font-size`|`0.875rem`|Typography|Font-size of the title slot.|
|`--cngx-toast-title-color`|`currentColor`|Typography|Color of the title slot.|
|`--cngx-toast-description-max-lines`|`3`|Typography|Maximum number of lines for the description slot before truncation kicks in.|
|`--cngx-toast-description-font-size`|`0.8125rem`|Typography|Font-size of the description slot.|
|`--cngx-toast-description-color`|`oklch(0.5 0.01 250)`|Typography|Text color of the description slot.|
|`--cngx-toast-description-line-height`|`1.4`|Typography|Line-height of the description slot.|
|`--cngx-toast-actions-gap`|`8px`|Layout|Gap between the text block and the trailing action.|
|`--cngx-toast-action-padding`|`4px 8px`|State / Action|Padding shorthand of the action button.|
|`--cngx-toast-action-radius`|`4px`|State / Action|Corner radius of the action button.|
|`--cngx-toast-action-color`|`color-mix(in oklab, var(--cngx-toast-accent) 60%, var(--cngx-color-text))`|State / Action|Label and border color of the action button. Unset by default, so the use site derives it from `--cngx-toast-accent` mixed 60% into the text color: the pure accent misses 4.5:1 on the light surface. Pin it to `--cngx-toast-accent` to paint the action in the pure accent again (the Material 3 bridge does).|
|`--cngx-toast-action-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Action|Background tint applied on hover of the action button.|
|`--cngx-toast-action-weight`|`600`|Typography|Font-weight of the action button.|
|`--cngx-toast-action-size`|`0.8125rem`|Typography|Font-size of the action button.|
|`--cngx-toast-timer-height`|`2px`|Timer|Thickness of the countdown bar along the bottom inner edge of a timed toast. `0` turns the bar off.|
|`--cngx-toast-timer-color`|`var(--cngx-toast-accent)`|Timer|Colour of the countdown bar. Unregistered initial, so the use site falls back to the severity accent.|
|`--cngx-toast-timer-duration`|`0s`|Timer|Total run time of the current timer segment. Runtime value, set inline on each timed `.cngx-toast` by the outlet; read it, do not set it.|
|`--cngx-toast-timer-offset`|`0s`|Timer|Negative elapsed time of the current timer segment, used as `animation-delay` so a re-created timer element resumes where the clock stands. Runtime value, set inline on each timed `.cngx-toast` by the outlet; read it, do not set it.|

## CngxToc

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-toc-indent`|`var(--cngx-space-lg, 1rem)`|Layout|Inline indent of each nested list level.|
|`--cngx-toc-gap`|`var(--cngx-space-xs, 0.25rem)`|Layout|Gap between links in a list and above a nested list.|
|`--cngx-toc-link-pad-block`|`var(--cngx-space-xs, 0.25rem)`|Layout|Block padding of each link.|
|`--cngx-toc-link-pad-inline`|`var(--cngx-space-sm, 0.5rem)`|Layout|Inline padding of each link.|

## CngxToggle

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-toggle-gap`|`0.5rem`|Layout|Gap between the track and the label slot. Falls back to `--cngx-space-sm`.|
|`--cngx-toggle-color`|`currentColor`|Surface|Text color of the host shell. Defaults to `currentColor`.|
|`--cngx-toggle-focus-outline`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand.|
|`--cngx-toggle-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-toggle-focus-radius`|`0.25rem`|State / Focus|Corner radius applied while focused.|
|`--cngx-toggle-transition`|`150ms ease`|Motion|Transition duration + easing for the track/thumb animation. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-toggle-track-width`|`2.25rem`|Layout|Width of the track pill.|
|`--cngx-toggle-track-height`|`1.25rem`|Layout|Height of the track pill.|
|`--cngx-toggle-track-radius`|`9999px`|Layout|Corner radius of the track. Defaults to a full pill.|
|`--cngx-toggle-track-bg-off`|`oklch(0 0 0 / 0.25)`|State / Off|Background of the off-state track - neutral muted by default. `inherits: true` so the :root dark-mode override reaches the track inside the toggle host.|
|`--cngx-toggle-track-bg-on`|`oklch(0.66 0.19 50)`|State / On|Background of the on-state track. Falls back to `--cngx-color-primary`.|
|`--cngx-toggle-thumb-inset`|`0.125rem`|Layout|Inset of the thumb inside the track (resting position).|
|`--cngx-toggle-thumb-size`|`1rem`|Layout|Diameter of the circular thumb.|
|`--cngx-toggle-thumb-travel`|`1rem`|State / On|Horizontal translation applied to the thumb when checked.|
|`--cngx-toggle-thumb-bg`|`oklch(1 0 0)`|Surface|Background of the thumb.|
|`--cngx-toggle-thumb-shadow`|`0 1px 2px oklch(0 0 0 / 0.25)`|Surface|Drop-shadow applied to the thumb so it lifts off the track.|

## CngxTooltip

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-tooltip-bg`|`oklch(0.2 0.005 290)`|Surface|Tooltip surface color - defaults to a near-black charcoal.|
|`--cngx-tooltip-color`|`oklch(0.96 0.005 290)`|Surface|Tooltip text color - defaults to near-white to pair with the default charcoal surface.|
|`--cngx-tooltip-font-family`|`system-ui`|Typography|Font-family stack. Inherits `system-ui` from the foundation.|
|`--cngx-tooltip-font-size`|`0.75rem`|Typography|Font-size of the tooltip text.|
|`--cngx-tooltip-line-height`|`1rem`|Typography|Line-height of the tooltip text.|
|`--cngx-tooltip-font-weight`|`400`|Typography|Font-weight of the tooltip text.|
|`--cngx-tooltip-letter-spacing`|`0.033em`|Typography|Letter-spacing - a touch of tracking lifts legibility at the small font-size.|
|`--cngx-tooltip-padding-block`|`4px`|Layout|Block-axis padding.|
|`--cngx-tooltip-padding-inline`|`8px`|Layout|Inline-axis padding.|
|`--cngx-tooltip-border-radius`|`4px`|Layout|Corner radius.|
|`--cngx-tooltip-max-width`|`200px`|Layout|Maximum inline size - caps long tooltip content before it wraps into too narrow a column.|
|`--cngx-tooltip-transition-duration`|`150ms`|Motion|Duration of the open / close transition. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-tooltip-transition-easing`|`cubic-bezier(0.4, 0, 0.2, 1)`|Motion|Easing curve of the open / close transition.|

## CngxTreeSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel host (anchor-positioned, may sit outside the normal DOM flow).|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through `--cngx-color-surface`.|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value `currentColor` lets the panel inherit text color from its ancestor by default. Registering as `<color>` would forbid `currentColor` since `<color>` requires a computationally- independent value.|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the floating panel host.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-action-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the separator between the action region and the options: on the block-start side of a bottom action, the block-end side of a top action. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel. Set it to `none` to drop the separator.|
|`--cngx-select-action-padding`|`0.25rem`|Layout|Space between the action separator and the action content.|
|`--cngx-select-action-margin`|`0.25rem`|Layout|Space between the options and the action separator.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven, so dense rows stay compact) and composes into the touch-target floor via `max()`. A `0px` rather than `auto` default is deliberate: `auto` cannot be an argument to `max()`, and the floor needs to compose the row height against `--cngx-target-min`.|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a low-alpha tint of `--cngx-color-primary` so the highlight reads as brand-accented without competing with selection state.|
|`--cngx-select-option-active-indicator`|`oklch(0.5 0.2 275)`|State|Colour of the inline-start indicator bar on the keyboard-active row. The background tint alone is ~1.1:1 against the panel; this opaque bar carries the active affordance at >= 3:1. Delegates to the primary colour below, so it follows the scheme and a re-theme.|
|`--cngx-select-option-multi-selected-bg`|`transparent`|State / Selected|Background of a selected row in a multi-value panel whose selection indicator renders. Transparent by default: the checkbox carries the selection, so a mostly-selected panel does not turn into a solid block. Assign a colour to opt the fill back in. Single-value panels and rows with the indicator hidden keep `--cngx-option-selected-bg`.|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through `--cngx-color-primary`.|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant. Muted by default to mirror the placeholder token; the Material bridge maps it to `--mat-sys-on-surface-variant`. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks the same muted default as the caret so both trigger affordances read uniformly. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-caret-size`|`1.6em`|Layout|Font-size of the dropdown caret glyph shared across every variant. Read at the caret span (a trigger descendant), so `inherits: true` is load-bearing: with `inherits: false` the registered initial would always win at the caret and no consumer or composing organism could ever set the token (the inherits:false trap). The default glyph box never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a caret smaller than the 12px micro box.|
|`--cngx-select-clear-target-min`|`24px`|Layout|Fine-pointer hit-area floor of the clear button, on both axes. The 24px default meets WCAG 2.5.8 (AA); under the touch floor the larger `--cngx-target-min` wins. The trigger row keeps its height: the box hands back what it adds over the control line box. `inherits: true` so a trigger-level or ancestor override reaches the button.|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-skeleton-shimmer`|`oklch(0.2 0.01 250)`|State / Loading|Base colour the skeleton shimmer gradient is mixed from. Defaults from the foundation text colour, so the shimmer darkens a light panel and lightens a dark one in every scheme (OS, a `data-color-scheme` island, or a consumer light theme under OS dark) without a hardcoded dark-mode swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-option-spinner-track`|`oklch(0 0 0 / 0.15)`|State / Commit|Track (resting ring) colour of the per-option commit spinner. Defaults from the foundation text colour at a low alpha, so it reads on the panel in every scheme without a dark swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true` so the :root dark-mode override (alpha-on-white on dark) reaches the spinner inside the floating panel.|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to `--cngx-color-primary`.|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.46 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a reorderable chip wrap.|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-reorder-move-size`|`0.75em`|Layout|Size of the move-up / move-down glyph in the reorder list the panel shows under the touch floor: the box of the default triangles (still floored at the 0.75rem micro floor) and the font-size of a projected `*cngxMultiSelectMoveGlyph`. Read at the move button (a descendant of the select host), so `inherits: true` is load-bearing: with `inherits: false` a host-level override would never reach it.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the chip while it's being dragged.|
|`--cngx-select-chip-drag-bg`|`oklch(0.58 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Defaults track `--cngx-color-primary-strong` via the delegating entries below.|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state. Defaults track `--cngx-color-on-primary-strong`, which holds 4.5:1 on the drag background in both schemes.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to `--cngx-color-primary`.|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of every error surface. Falls back to `--cngx-color-danger`.|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a `box-shadow` so it composes with any consumer-supplied focus outline.|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-commit-error-hint-color`|`oklch(0.5 0.2 25)`|State / Commit|Text colour of the commit-error hint shown under a closed trigger. Defaults to the danger-text contrast tier so it clears 4.5:1 like the inline banner.|
|`--cngx-select-commit-error-hint-margin`|`0.25rem`|State / Commit|Block-start margin of the commit-error hint, set from the density scale.|
|`--cngx-select-reorder-list-max-block-size`|`40dvh`|Layout|Height cap of the sortable list of selected values that a reorderable select shows in its sheet under the touch floor. A longer selection scrolls inside the list, so the options below stay reachable.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|
|`--cngx-select-message-padding`|`var(--cngx-space-sm) var(--cngx-space-sm)`|Layout|Padding of the loading and empty message rows in the panel.|
|`--cngx-select-chip-fit-badge-reserve`|`5ch`|State / Overflow|Inline space a `chipOverflow: 'fit'` strip keeps free for the `+N` badge. The badge slot is exactly this wide and clips a wider badge; raise it for a projected `*cngxSelectChipOverflow` or a custom `chipOverflowBadge` formatter. Set it on the select, a container or `:root`. Never assigned by the library, so the `5ch` fallback (room for `+99`) resolves against the strip font.|
|`--cngx-tree-select-min-width`|`var(--cngx-select-min-width, 10rem)`|Layout|Preferred minimum inline size of the select. A standalone or toolbar select is at least this wide; a narrower cell shrinks it, as it does an input. Falls back to `--cngx-select-min-width`; see {@link --cngx-select-min-width} for why no `initial-value` is declared.|
|`--cngx-tree-select-trigger-gap`|`var(--cngx-select-gap, var(--cngx-space-sm, 0.5rem))`|Layout|Gap between the value summary, clear button, and caret. Falls back to `--cngx-select-gap`; see {@link --cngx-select-gap} for why no `initial-value` is declared.|
|`--cngx-tree-select-trigger-height`|`var(--cngx-select-min-height, 2.125rem)`|Layout|Minimum block size of the trigger. Falls back to `--cngx-select-min-height`; see {@link --cngx-select-min-height} for why no `initial-value` is declared. The touch floor still lifts the trigger to `--cngx-target-min`.|
|`--cngx-tree-select-trigger-padding`|`var(--cngx-select-padding, var(--cngx-space-sm, 0.25rem) var(--cngx-space-md, 0.5rem))`|Layout|Padding shorthand of the trigger. Falls back to `--cngx-select-padding`; see {@link --cngx-select-padding} for why no `initial-value` is declared.|
|`--cngx-tree-select-trigger-border`|`var(--cngx-select-border, 1px solid var(--cngx-color-border-strong))`|Surface|Border shorthand of the trigger. Falls back to `--cngx-select-border`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-tree-select-trigger-radius`|`var(--cngx-select-radius, var(--cngx-radius-md, 8px))`|Layout|Corner radius of the trigger. Falls back to `--cngx-select-radius`; see {@link --cngx-select-radius} for why no `initial-value` is declared.|
|`--cngx-tree-select-trigger-bg`|`var(--cngx-select-bg, transparent)`|Surface|Background of the trigger. Falls back to `--cngx-select-bg`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-tree-select-focus-ring`|`var(--cngx-select-focus-outline, 2px solid var(--cngx-color-primary))`|State / Focus|Focus-ring outline shorthand of the trigger (opaque, same ring as the sibling selects). Falls back to `--cngx-select-focus-outline`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-tree-select-clear-size`|`1.25rem`|State / Clear|Hit-target diameter of the clear-all button; the touch floor enlarges its hit area to `--cngx-target-min` (see `select-base.css`). No `initial-value`, like {@link --cngx-tree-select-trigger-bg}: the use-site fallback survives, and a value set on the host or an ancestor reaches the button.|
|`--cngx-tree-select-panel-min-inline-size`|`16rem`|Layout|Minimum inline size of the anchored tree panel. The panel is at least as wide as the trigger and never narrower than this, so indented rows keep room for their labels. Tree-only: the flat selects keep the anchor width. The sheet presentation owns its own width. Stands alone (no family fallback): `--cngx-select-panel-min-width` is the anchor width the panel also honours.|
|`--cngx-tree-select-panel-max-block-size`|`20rem`|Layout|Height cap of the anchored tree panel before it scrolls. Stands alone: the family `--cngx-select-panel-max-height` registers an `initial-value`, so a chain to it would never reach this default. The sheet presentation owns its own height.|
|`--cngx-tree-select-chip-remove-gap`|`0px`|Layout|Extra space between a trigger chip's label and its remove button, on top of the chip's inner gap. The remove button keeps its 24px hit box; this keeps that box off the label, so a click aimed at the trigger does not remove a value.|

## CngxTreetable

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-treetable-header-bg`|`oklch(0.98 0.005 250)`|Surface|Header row background.|
|`--cngx-treetable-header-border`|`oklch(0.92 0.005 250)`|Surface|Bottom border under the header row. Falls back through `--cngx-color-border`.|
|`--cngx-treetable-header-color`|`oklch(0.34 0.015 250)`|Surface|Header cell text color.|
|`--cngx-treetable-row-border`|`oklch(0.96 0.005 250)`|Surface|Between-rows border color. Falls back through `--cngx-color-border`.|
|`--cngx-treetable-row-hover-bg`|`oklch(0.97 0.015 250)`|State / Highlighted|Background of the keyboard-highlighted row.|
|`--cngx-treetable-row-selected-bg`|`oklch(0.95 0.025 250)`|State / Selected|Background of the selected row.|
|`--cngx-treetable-focus-ring`|`oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline color. Falls back through `--cngx-color-primary`.|
|`--cngx-treetable-muted-color`|`oklch(0.5 0.015 250)`|Surface|Muted text color used by the empty state and the toggle button.|
|`--cngx-treetable-cell-color`|`oklch(0.34 0.015 250)`|Surface|Body cell text color.|
|`--cngx-treetable-indent-size`|`1.5rem`|Layout|Indent step per tree depth level. Multiplied by `--cngx-row-depth` to compute total inline-start padding.|
|`--cngx-treetable-cell-padding-block`|`0.6rem`|Layout|Block-axis padding inside header and body cells.|
|`--cngx-treetable-cell-padding-inline`|`1rem`|Layout|Inline-axis padding inside header and body cells.|
|`--cngx-treetable-narrow-cell-padding-inline`|`0.25rem`|Layout|Compact inline padding applied to the expand and select utility columns (header + body).|
|`--cngx-treetable-empty-padding-block`|`2rem`|State / Empty|Block padding of the empty-state slot.|
|`--cngx-treetable-empty-padding-inline`|`1rem`|State / Empty|Inline padding of the empty-state slot.|
|`--cngx-treetable-toggle-padding`|`0.25rem`|Layout|Padding inside the expand/collapse toggle button.|
|`--cngx-treetable-toggle-radius`|`4px`|Layout|Corner radius of the expand/collapse toggle button.|
|`--cngx-treetable-header-border-width`|`2px`|Surface|Stroke width of the header bottom border.|
|`--cngx-treetable-row-border-width`|`1px`|Surface|Stroke width of the between-rows border.|
|`--cngx-treetable-focus-ring-width`|`2px`|State / Focus|Width of the row focus-ring outline.|
|`--cngx-treetable-font-size`|`0.875rem`|Typography|Default font-size of the table body.|
|`--cngx-treetable-header-font-weight`|`600`|Typography|Font-weight of header cells.|
|`--cngx-treetable-empty-font-size`|`0.875rem`|State / Empty|Font-size of the empty-state slot.|
|`--cngx-treetable-skeleton-line-size`|`12px`|State / Loading|Height of one skeleton placeholder line during a first load.|
|`--cngx-treetable-toggle-font-size`|`0.875rem`|Typography|Font-size of the toggle button glyph.|
|`--cngx-treetable-row-transition-duration`|`120ms`|Motion|Transition duration of the row background change. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-treetable-toggle-transition-duration`|`120ms`|Motion|Transition duration of the toggle button hover state. Derives from the `--cngx-duration-fast` rung of the motion scale; a `--cngx-duration-*` brand override re-times it library-wide.|
|`--cngx-treetable-narrow-breakpoint`|`768px`|Variant / Narrow|Documentation mirror of the narrow rung, for tooling that reads the token table. The live threshold is the literal inside the `@container cngx-treetable (max-inline-size: 48rem)` rule - a container condition cannot resolve `var()`, so setting this token changes nothing. Held as `768px`, the absolute equivalent of `48rem` at the default 16px root, because a registered `<length>` must carry a computationally-independent initial value: a relative unit makes the browser drop the whole `@property` rule, `inherits` flag included.|
|`--cngx-treetable-narrow-font-size`|`0.8125rem`|Variant / Narrow|Font-size below the narrow breakpoint.|
|`--cngx-treetable-narrow-header-padding-block`|`0.5rem`|Variant / Narrow|Header cell block padding below the narrow breakpoint.|
|`--cngx-treetable-narrow-header-padding-inline`|`0.625rem`|Variant / Narrow|Header cell inline padding below the narrow breakpoint.|
|`--cngx-treetable-narrow-cell-padding-block`|`0.875rem`|Variant / Narrow|Body cell block padding below the narrow breakpoint -bigger tap target.|
|`--cngx-treetable-narrow-cell-padding-inline-default`|`0.625rem`|Variant / Narrow|Default body cell inline padding below the narrow breakpoint.|
|`--cngx-treetable-narrow-utility-padding-inline`|`0.125rem`|Variant / Narrow|Compact inline padding for utility cells below the narrow breakpoint.|
|`--cngx-treetable-narrow-utility-padding-inline-large`|`0.875rem`|Variant / Narrow|Larger utility inline padding used by the first-data-cell below the narrow breakpoint.|
|`--cngx-treetable-narrow-indent-size`|`1.25rem`|Variant / Narrow|Indent step per depth level below the narrow breakpoint - reduced so deep trees still fit on narrow screens.|
|`--cngx-treetable-narrow-toggle-padding`|`0.5rem`|Variant / Narrow|Toggle button padding below the narrow breakpoint -bigger tap target (≥ 44 px combined).|
|`--cngx-treetable-narrow-toggle-font-size`|`1rem`|Variant / Narrow|Toggle button font-size below the narrow breakpoint.|

## CngxTrend

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-trend-gap`|`2px`|Layout|Gap between the arrow glyph and the trend label.|
|`--cngx-trend-size`|`0.8125rem`|Typography|Font-size of the trend label.|
|`--cngx-trend-weight`|`500`|Typography|Font-weight of the trend label.|
|`--cngx-trend-color`|`oklch(0.36 0.02 290)`|Surface|Neutral text color applied when no direction modifier is set.|
|`--cngx-trend-up-color`|`oklch(0.65 0.18 145)`|Variant / Up|Color of the `.cngx-trend--up` modifier. Falls back to `--cngx-color-success`.|
|`--cngx-trend-down-color`|`oklch(0.65 0.22 25)`|Variant / Down|Color of the `.cngx-trend--down` modifier. Falls back to `--cngx-color-danger`.|

## CngxTypeahead

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel host (anchor-positioned, may sit outside the normal DOM flow).|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through `--cngx-color-surface`.|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value `currentColor` lets the panel inherit text color from its ancestor by default. Registering as `<color>` would forbid `currentColor` since `<color>` requires a computationally- independent value.|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the floating panel host.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-action-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the separator between the action region and the options: on the block-start side of a bottom action, the block-end side of a top action. Falls back through `--cngx-color-border`. `inherits: true` so the :root delegating value reaches the floating panel. Set it to `none` to drop the separator.|
|`--cngx-select-action-padding`|`0.25rem`|Layout|Space between the action separator and the action content.|
|`--cngx-select-action-margin`|`0.25rem`|Layout|Space between the options and the action separator.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven, so dense rows stay compact) and composes into the touch-target floor via `max()`. A `0px` rather than `auto` default is deliberate: `auto` cannot be an argument to `max()`, and the floor needs to compose the row height against `--cngx-target-min`.|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a low-alpha tint of `--cngx-color-primary` so the highlight reads as brand-accented without competing with selection state.|
|`--cngx-select-option-active-indicator`|`oklch(0.5 0.2 275)`|State|Colour of the inline-start indicator bar on the keyboard-active row. The background tint alone is ~1.1:1 against the panel; this opaque bar carries the active affordance at >= 3:1. Delegates to the primary colour below, so it follows the scheme and a re-theme.|
|`--cngx-select-option-multi-selected-bg`|`transparent`|State / Selected|Background of a selected row in a multi-value panel whose selection indicator renders. Transparent by default: the checkbox carries the selection, so a mostly-selected panel does not turn into a solid block. Assign a colour to opt the fill back in. Single-value panels and rows with the indicator hidden keep `--cngx-option-selected-bg`.|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through `--cngx-color-primary`.|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant. Muted by default to mirror the placeholder token; the Material bridge maps it to `--mat-sys-on-surface-variant`. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks the same muted default as the caret so both trigger affordances read uniformly. `inherits: true` so a trigger-level override reaches the glyph element.|
|`--cngx-select-caret-size`|`1.6em`|Layout|Font-size of the dropdown caret glyph shared across every variant. Read at the caret span (a trigger descendant), so `inherits: true` is load-bearing: with `inherits: false` the registered initial would always win at the caret and no consumer or composing organism could ever set the token (the inherits:false trap). The default glyph box never drops below `--cngx-icon-svg-micro-floor` (12px); set that token to `0px` as well for a caret smaller than the 12px micro box.|
|`--cngx-select-clear-target-min`|`24px`|Layout|Fine-pointer hit-area floor of the clear button, on both axes. The 24px default meets WCAG 2.5.8 (AA); under the touch floor the larger `--cngx-target-min` wins. The trigger row keeps its height: the box hands back what it adds over the control line box. `inherits: true` so a trigger-level or ancestor override reaches the button.|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-skeleton-shimmer`|`oklch(0.2 0.01 250)`|State / Loading|Base colour the skeleton shimmer gradient is mixed from. Defaults from the foundation text colour, so the shimmer darkens a light panel and lightens a dark one in every scheme (OS, a `data-color-scheme` island, or a consumer light theme under OS dark) without a hardcoded dark-mode swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-option-spinner-track`|`oklch(0 0 0 / 0.15)`|State / Commit|Track (resting ring) colour of the per-option commit spinner. Defaults from the foundation text colour at a low alpha, so it reads on the panel in every scheme without a dark swap. The Material bridge sets it from `--mat-sys-on-surface`.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true` so the :root dark-mode override (alpha-on-white on dark) reaches the spinner inside the floating panel.|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to `--cngx-color-primary`.|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to `--cngx-color-primary`.|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.46 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a reorderable chip wrap.|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back to `--cngx-color-danger`.|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-reorder-move-size`|`0.75em`|Layout|Size of the move-up / move-down glyph in the reorder list the panel shows under the touch floor: the box of the default triangles (still floored at the 0.75rem micro floor) and the font-size of a projected `*cngxMultiSelectMoveGlyph`. Read at the move button (a descendant of the select host), so `inherits: true` is load-bearing: with `inherits: false` a host-level override would never reach it.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state. `inherits: true` so the :root dark-mode override (deeper shadow on dark) reaches the chip while it's being dragged.|
|`--cngx-select-chip-drag-bg`|`oklch(0.58 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Defaults track `--cngx-color-primary-strong` via the delegating entries below.|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state. Defaults track `--cngx-color-on-primary-strong`, which holds 4.5:1 on the drag background in both schemes.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to `--cngx-color-primary`.|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.46 0.18 25)`|State / Error|Text color of every error surface. Falls back to `--cngx-color-danger`.|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it. Defaults track `--cngx-color-danger` via the delegating :root entry below; registered as inheriting so that root value reaches the trigger.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a `box-shadow` so it composes with any consumer-supplied focus outline.|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-commit-error-hint-color`|`oklch(0.5 0.2 25)`|State / Commit|Text colour of the commit-error hint shown under a closed trigger. Defaults to the danger-text contrast tier so it clears 4.5:1 like the inline banner.|
|`--cngx-select-commit-error-hint-margin`|`0.25rem`|State / Commit|Block-start margin of the commit-error hint, set from the density scale.|
|`--cngx-select-reorder-list-max-block-size`|`40dvh`|Layout|Height cap of the sortable list of selected values that a reorderable select shows in its sheet under the touch floor. A longer selection scrolls inside the list, so the options below stay reachable.|
|`--cngx-option-gap`|`var(--cngx-space-sm)`|Layout|Gap between the parts of the option row, such as the check indicator and the label.|
|`--cngx-select-message-padding`|`var(--cngx-space-sm) var(--cngx-space-sm)`|Layout|Padding of the loading and empty message rows in the panel.|
|`--cngx-select-chip-fit-badge-reserve`|`5ch`|State / Overflow|Inline space a `chipOverflow: 'fit'` strip keeps free for the `+N` badge. The badge slot is exactly this wide and clips a wider badge; raise it for a projected `*cngxSelectChipOverflow` or a custom `chipOverflowBadge` formatter. Set it on the select, a container or `:root`. Never assigned by the library, so the `5ch` fallback (room for `+99`) resolves against the strip font.|
|`--cngx-typeahead-gap`|`var(--cngx-select-gap, var(--cngx-space-sm, 0.5rem))`|Layout|Gap between the input, clear button, and caret. Falls back to `--cngx-select-gap`; see {@link --cngx-select-gap} for why no `initial-value` is declared.|
|`--cngx-typeahead-min-height`|`var(--cngx-select-min-height, 2.125rem)`|Layout|Minimum block size of the trigger. Falls back to `--cngx-select-min-height`; see {@link --cngx-select-min-height} for why no `initial-value` is declared. The touch floor still lifts the trigger to `--cngx-target-min`.|
|`--cngx-typeahead-padding`|`var(--cngx-select-padding, var(--cngx-space-sm, 0) var(--cngx-space-md, 0.75rem))`|Layout|Padding shorthand of the trigger. Falls back to `--cngx-select-padding`; see {@link --cngx-select-padding} for why no `initial-value` is declared.|
|`--cngx-typeahead-border`|`var(--cngx-select-border, 1px solid var(--cngx-color-border-strong))`|Surface|Border shorthand of the trigger. Falls back to `--cngx-select-border`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|
|`--cngx-typeahead-radius`|`var(--cngx-select-radius, var(--cngx-radius-md, 8px))`|Layout|Corner radius of the trigger. Falls back to `--cngx-select-radius`; see {@link --cngx-select-radius} for why no `initial-value` is declared.|
|`--cngx-typeahead-bg`|`var(--cngx-select-bg, transparent)`|Surface|Background of the trigger. Falls back to `--cngx-select-bg`; see {@link --cngx-select-bg} for why no `initial-value` is declared.|

