# cngx theming tokens

Every cngx component themes through `--cngx-*` CSS custom properties with literal fallbacks. Set any token in your own stylesheet to override it; leave it unset to keep the default below. 1791 tokens across 84 components.

## CngxActionButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-action-btn-transition`|`0.2s ease`|Motion|Transition shorthand for background-color / color / border-color /|
|`--cngx-action-btn-radius`|`6px`|Layout|Corner radius of every variant.|
|`--cngx-action-btn-padding`|`8px 16px`|Layout|Vertical + horizontal padding shorthand. Both axes can be re-driven|
|`--cngx-action-btn-border`|`oklch(0.87 0 0)`|Surface|Border color of the base (non-variant) `.cngx-action-button` rule.|
|`--cngx-action-btn-bg`|`transparent`|Surface|Background of the base rule. Variants override.|
|`--cngx-action-btn-pending-opacity`|`0.7`|State / Pending|Opacity applied while `cngxAsyncClick` reports `pending`. Combined|
|`--cngx-action-btn-succeeded-bg`|`oklch(0.95 0.04 145)`|State / Succeeded|Background tint after a successful async commit.|
|`--cngx-action-btn-succeeded-color`|`oklch(0.5 0.15 145)`|State / Succeeded|Text color after a successful async commit.|
|`--cngx-action-btn-succeeded-border`|`oklch(0.5 0.15 145)`|State / Succeeded|Border color after a successful async commit.|
|`--cngx-action-btn-failed-bg`|`oklch(0.95 0.025 25)`|State / Failed|Background tint after a failed async commit.|
|`--cngx-action-btn-failed-color`|`oklch(0.45 0.15 25)`|State / Failed|Text color after a failed async commit.|
|`--cngx-action-btn-failed-border`|`oklch(0.45 0.15 25)`|State / Failed|Border color after a failed async commit.|
|`--cngx-action-btn-ghost-hover-bg`|`oklch(0 0 0 / 0.04)`|Variant / Ghost|Hover state-layer for the ghost variant - subtle tint so the button|
|`--cngx-action-btn-primary-bg`|`oklch(0.55 0.15 250)`|Variant / Primary|Background of the primary variant (filled).|
|`--cngx-action-btn-primary-color`|`oklch(1 0 0)`|Variant / Primary|Text color of the primary variant.|
|`--cngx-action-btn-secondary-bg`|`transparent`|Variant / Secondary|Background of the secondary variant (outlined). Defaults to|
|`--cngx-action-btn-secondary-color`|`oklch(0.55 0.15 250)`|Variant / Secondary|Text color of the secondary variant.|
|`--cngx-action-btn-secondary-border`|`oklch(0.55 0.005 290)`|Variant / Secondary|Border color of the secondary variant.|
|`--cngx-action-btn-ghost-color`|`oklch(0.34 0.005 290)`|Variant / Ghost|Text color of the ghost variant.|

## CngxActionMultiSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven,|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks|
|`--cngx-select-caret-size`|`1.25em`|Layout|Font-size of the dropdown caret glyph shared across every variant.|
|`--cngx-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled. Shared|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true`|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.6 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-bg`|`oklch(0.66 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Falls back|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.6 0.18 25)`|State / Error|Text color of every error surface. Falls back to|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-action-multi-select-min-width`|`12rem`|Layout|Minimum inline size of the trigger.|
|`--cngx-action-multi-select-gap`|`0.375rem`|Layout|Gap between the chip list, input, caret, and clear-all button.|
|`--cngx-action-multi-select-padding`|`0.25rem 0.375rem`|Layout|Padding shorthand of the trigger.|
|`--cngx-action-multi-select-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the trigger.|
|`--cngx-action-multi-select-radius`|`0.25rem`|Layout|Corner radius of the trigger.|
|`--cngx-action-multi-select-bg`|`transparent`|Surface|Background of the trigger.|
|`--cngx-action-multi-select-color`|`currentColor`|Surface|Text color of the trigger.|
|`--cngx-action-multi-select-min-height`|`2.25rem`|Layout|Minimum block size of the trigger.|
|`--cngx-action-multi-select-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand applied on `:focus-within`. Falls|
|`--cngx-action-multi-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled.|
|`--cngx-action-multi-select-input-flex-basis`|`4rem`|Layout|Flex basis of the inline input.|
|`--cngx-action-multi-select-input-min-width`|`4rem`|Layout|Minimum inline size of the inline input.|
|`--cngx-action-multi-select-clear-opacity`|`0.6`|State / Clear|Resting opacity of the clear-all button.|

## CngxActionSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven,|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks|
|`--cngx-select-caret-size`|`1.25em`|Layout|Font-size of the dropdown caret glyph shared across every variant.|
|`--cngx-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled. Shared|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true`|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.6 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-bg`|`oklch(0.66 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Falls back|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.6 0.18 25)`|State / Error|Text color of every error surface. Falls back to|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-action-select-gap`|`0.5rem`|Layout|Gap between the input, clear button, and caret.|
|`--cngx-action-select-min-height`|`2.25rem`|Layout|Minimum block size of the trigger.|
|`--cngx-action-select-padding`|`0 0.75rem`|Layout|Padding shorthand of the trigger.|
|`--cngx-action-select-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the trigger.|
|`--cngx-action-select-radius`|`0.25rem`|Layout|Corner radius of the trigger.|
|`--cngx-action-select-bg`|`oklch(1 0 0)`|Surface|Background of the trigger. Falls back through `--cngx-color-surface`.|

## CngxAlert

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-alert-gap`|`12px`|Layout|Gap between the icon, body, and dismiss button.|
|`--cngx-alert-padding`|`12px 16px`|Layout|Padding shorthand inside the alert.|
|`--cngx-alert-border-radius`|`8px`|Layout|Corner radius.|
|`--cngx-alert-border-color`|`transparent`|Surface|Border color - neutral by default; severity rules override.|
|`--cngx-alert-bg`|`oklch(0.98 0.005 250)`|Surface|Background - neutral by default; severity rules override.|
|`--cngx-alert-color`|`currentColor`|Surface|Text color - defaults to `currentColor`.|
|`--cngx-alert-info-bg`|`oklch(0.96 0.025 250)`|Variant / Info|Background tint of the info severity.|
|`--cngx-alert-info-border`|`oklch(0.85 0.07 250)`|Variant / Info|Border color of the info severity.|
|`--cngx-alert-info-icon`|`oklch(0.62 0.2 250)`|Variant / Info|Icon color of the info severity.|
|`--cngx-alert-success-bg`|`oklch(0.96 0.04 145)`|Variant / Success|Background tint of the success severity.|
|`--cngx-alert-success-border`|`oklch(0.85 0.1 145)`|Variant / Success|Border color of the success severity.|
|`--cngx-alert-success-icon`|`oklch(0.65 0.15 145)`|Variant / Success|Icon color of the success severity.|
|`--cngx-alert-warning-bg`|`oklch(0.97 0.04 80)`|Variant / Warning|Background tint of the warning severity.|
|`--cngx-alert-warning-border`|`oklch(0.86 0.1 80)`|Variant / Warning|Border color of the warning severity.|
|`--cngx-alert-warning-icon`|`oklch(0.72 0.18 70)`|Variant / Warning|Icon color of the warning severity.|
|`--cngx-alert-error-bg`|`oklch(0.96 0.025 25)`|Variant / Error|Background tint of the error severity.|
|`--cngx-alert-error-border`|`oklch(0.85 0.08 25)`|Variant / Error|Border color of the error severity.|
|`--cngx-alert-error-icon`|`oklch(0.62 0.22 25)`|Variant / Error|Icon color of the error severity.|
|`--cngx-alert-icon-color`|`currentColor`|Surface|Icon color override - defaults to `currentColor` and is pinned|
|`--cngx-alert-icon-size`|`20px`|Layout|Default icon size when no custom icon is projected.|
|`--cngx-alert-title-weight`|`600`|Typography|Font-weight of the title slot.|
|`--cngx-alert-title-gap`|`4px`|Layout|Gap between the title and the body text.|
|`--cngx-alert-collapse-duration`|`200ms`|Motion|Duration of the collapsed-state grid-row transition.|
|`--cngx-alert-collapsed-hover-bg`|`oklch(0 0 0 / 0.02)`|State / Collapsed|Background tint applied on hover of a collapsed alert.|
|`--cngx-alert-actions-gap`|`8px`|Layout|Gap above the actions slot.|
|`--cngx-alert-action-bg`|`transparent`|State / Action|Background of the projected action button. Defaults to|
|`--cngx-alert-action-radius`|`4px`|State / Action|Corner radius of the projected action button.|
|`--cngx-alert-action-padding`|`4px 10px`|State / Action|Padding shorthand of the projected action button.|
|`--cngx-alert-action-font-size`|`0.875rem`|State / Action|Font-size of the projected action button label.|
|`--cngx-alert-action-font-weight`|`600`|State / Action|Font-weight of the projected action button label.|
|`--cngx-alert-action-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Action|Background tint applied on hover of the projected action button.|
|`--cngx-alert-enter-duration`|`200ms`|Motion|Duration of the enter animation.|
|`--cngx-alert-exit-duration`|`150ms`|Motion|Duration of the exit animation.|
|`--cngx-alert-icon-pulse-duration`|`300ms`|Motion|Duration of the icon-pulse animation that fires on enter.|
|`--cngx-alert-enter-offset`|`8px`|Motion|Vertical offset the alert translates from while entering.|
|`--cngx-alert-exit-offset`|`8px`|Motion|Vertical offset the alert translates to while exiting.|

## CngxAlertStack

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-alert-stack-gap`|`8px`|Layout|Vertical gap between stacked alert items.|
|`--cngx-alert-stack-reserve-height`|`56px`|Layout|Minimum block-size reserved for the stack so layout doesn't|
|`--cngx-alert-stack-message-size`|`0.875rem`|Typography|Font-size of the per-item message text.|
|`--cngx-alert-stack-message-line-height`|`1.5`|Typography|Line-height of the per-item message text.|
|`--cngx-alert-stack-overflow-bg`|`transparent`|State / Overflow|Background of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-border`|`oklch(0.85 0.005 250)`|State / Overflow|Border color of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-padding`|`8px 16px`|State / Overflow|Padding shorthand of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-size`|`0.8125rem`|State / Overflow|Font-size of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-color`|`oklch(0.5 0.01 250)`|State / Overflow|Text color of the "show more" overflow button.|
|`--cngx-alert-stack-overflow-hover-bg`|`oklch(0.96 0.005 250)`|State / Overflow|Background tint on hover of the "show more" overflow button.|

## CngxAsyncContainer

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-async-container-refresh-z`|`5`|Layout|Stacking-context order of the refresh indicator overlay.|

## CngxAvatar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-avatar-size`|`2.5rem`|Layout|Active size of the avatar - consumed by the `:scope` rule and|
|`--cngx-avatar-font-size`|`1rem`|Typography|Active font-size of the initials block. Scaled in step with|
|`--cngx-avatar-bg`|`oklch(0.92 0.01 240)`|Surface|Background of the avatar plate. Defaults to the foundation|
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
|`--cngx-avatar-status-size`|`0.65em`|State / Status|Diameter of the status dot, expressed in `em` so it scales with|
|`--cngx-avatar-status-border`|`oklch(1 0 0)`|State / Status|Ring color around the status dot - defaults to the surface|
|`--cngx-avatar-status-bg`|`oklch(0.68 0.01 240)`|State / Status|Fallback background of the status dot when no state modifier|
|`--cngx-avatar-status-online`|`oklch(0.68 0.18 145)`|State / Status|Dot color for the `.cngx-avatar__status--online` modifier.|
|`--cngx-avatar-status-offline`|`oklch(0.68 0.01 240)`|State / Status|Dot color for the `.cngx-avatar__status--offline` modifier.|
|`--cngx-avatar-status-busy`|`oklch(0.62 0.22 25)`|State / Status|Dot color for the `.cngx-avatar__status--busy` modifier.|
|`--cngx-avatar-status-away`|`oklch(0.72 0.18 70)`|State / Status|Dot color for the `.cngx-avatar__status--away` modifier.|

## CngxBannerOutlet

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-banner-z-index`|`900`|Layout|Stacking-context order - sticky-top banner sits below modal|
|`--cngx-banner-gap`|`12px`|Layout|Gap between icon, body, action, and dismiss slots.|
|`--cngx-banner-padding`|`10px 16px`|Layout|Padding shorthand inside each banner.|
|`--cngx-banner-bg`|`oklch(0.98 0.005 250)`|Surface|Background - neutral by default; severity rules override.|
|`--cngx-banner-color`|`currentColor`|Surface|Text color - defaults to `currentColor`.|
|`--cngx-banner-border-color`|`transparent`|Surface|Border color - neutral by default; severity rules override.|
|`--cngx-banner-enter-duration`|`200ms`|Motion|Duration of the slide-down enter animation.|
|`--cngx-banner-enter-offset`|`100%`|Motion|Vertical offset the banner translates from while entering.|
|`--cngx-banner-info-bg`|`oklch(0.96 0.025 250)`|Variant / Info|Background tint of the info severity.|
|`--cngx-banner-info-border`|`oklch(0.85 0.07 250)`|Variant / Info|Border color of the info severity.|
|`--cngx-banner-info-icon`|`oklch(0.62 0.2 250)`|Variant / Info|Icon color of the info severity.|
|`--cngx-banner-success-bg`|`oklch(0.96 0.04 145)`|Variant / Success|Background tint of the success severity.|
|`--cngx-banner-success-border`|`oklch(0.85 0.1 145)`|Variant / Success|Border color of the success severity.|
|`--cngx-banner-success-icon`|`oklch(0.65 0.15 145)`|Variant / Success|Icon color of the success severity.|
|`--cngx-banner-warning-bg`|`oklch(0.97 0.04 80)`|Variant / Warning|Background tint of the warning severity.|
|`--cngx-banner-warning-border`|`oklch(0.86 0.1 80)`|Variant / Warning|Border color of the warning severity.|
|`--cngx-banner-warning-icon`|`oklch(0.72 0.18 70)`|Variant / Warning|Icon color of the warning severity.|
|`--cngx-banner-error-bg`|`oklch(0.96 0.025 25)`|Variant / Error|Background tint of the error severity.|
|`--cngx-banner-error-border`|`oklch(0.85 0.08 25)`|Variant / Error|Border color of the error severity.|
|`--cngx-banner-error-icon`|`oklch(0.62 0.22 25)`|Variant / Error|Icon color of the error severity.|
|`--cngx-banner-icon-color`|`currentColor`|Surface|Icon color override - defaults to `currentColor` and is pinned|
|`--cngx-banner-accent`|`currentColor`|Surface|Accent color used by the action button border / foreground.|
|`--cngx-banner-icon-size`|`20px`|Layout|Default icon size when no custom icon is projected.|
|`--cngx-banner-font-size`|`0.9375rem`|Typography|Font-size of the body message.|
|`--cngx-banner-line-height`|`1.5`|Typography|Line-height of the body message.|
|`--cngx-banner-error-font-size`|`0.875rem`|State / Error|Font-size of the inline-error sub-line.|
|`--cngx-banner-error-color`|`oklch(0.62 0.22 25)`|State / Error|Text color of the inline-error sub-line. Falls back to|
|`--cngx-banner-action-bg`|`transparent`|State / Action|Background of the action button.|
|`--cngx-banner-action-radius`|`4px`|State / Action|Corner radius of the action button.|
|`--cngx-banner-action-padding`|`4px 10px`|State / Action|Padding shorthand of the action button.|
|`--cngx-banner-action-min-size`|`44px`|State / Action|Minimum hit-target size of the action button (≥ 44 px).|
|`--cngx-banner-action-font-size`|`0.875rem`|State / Action|Font-size of the action button label.|
|`--cngx-banner-action-font-weight`|`600`|State / Action|Font-weight of the action button label.|
|`--cngx-banner-action-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Action|Background tint applied on hover of the action button.|
|`--cngx-banner-pending-opacity`|`0.85`|State / Pending|Opacity multiplier applied while the banner is pending.|

## CngxBreadcrumbBar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-breadcrumb-plain-link-decoration`|`none`||Link text-decoration under the `plain` skin (retints the shared link-decoration leaf token). @group Skin|
|`--cngx-breadcrumb-contained-padding`|`0.375rem 0.75rem`||Inline padding of the `contained` list surface. @group Skin|
|`--cngx-breadcrumb-contained-bg`|`#f4f4f5`||Surface fill of the `contained` list box (set adaptively from `--cngx-color-surface` in `:scope`). @group Skin|
|`--cngx-breadcrumb-contained-border`|`1px solid`||Border width + style of the `contained` box. @group Skin|
|`--cngx-breadcrumb-contained-border-color`|`#e4e4e7`||Border colour of the `contained` box (set adaptively from `--cngx-color-border` in `:scope`). @group Skin|
|`--cngx-breadcrumb-contained-radius`|`0.375rem`||Corner radius of the `contained` box. @group Skin|
|`--cngx-breadcrumb-pill-track-bg`|`oklch(0.97 0.005 250)`||Track fill of the segmented `pill` bar. @group Skin|
|`--cngx-breadcrumb-pill-track-border`|`oklch(0.88 0.005 250)`||Track border of the segmented `pill` bar. @group Skin|
|`--cngx-breadcrumb-pill-radius`|`999px`||Corner radius of the `pill` track and its segments. @group Skin|
|`--cngx-breadcrumb-pill-color`|`oklch(0.5 0.01 250)`||Resting segment label colour under the `pill` skin. @group Skin|
|`--cngx-breadcrumb-pill-hover-bg`|`oklch(0.95 0.03 50)`||Hover segment fill under the `pill` skin. @group Skin|
|`--cngx-breadcrumb-pill-hover-color`|`oklch(0.2 0.01 250)`||Hover segment label colour under the `pill` skin. @group Skin|
|`--cngx-breadcrumb-pill-active-bg`|`oklch(0.66 0.19 50)`||Active-segment fill under the `pill` skin. @group Skin|
|`--cngx-breadcrumb-pill-active-color`|`oklch(1 0 0)`||Active-segment label colour under the `pill` skin. @group Skin|
|`--cngx-breadcrumb-pill-font-size`|`0.875rem`||Segment font size under the `pill` skin. @group Skin|
|`--cngx-breadcrumb-ribbon-bg`|`oklch(0.97 0.005 250)`|||
|`--cngx-breadcrumb-ribbon-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-ribbon-hover-bg`|`oklch(0.95 0.03 50)`|||
|`--cngx-breadcrumb-ribbon-hover-color`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-ribbon-active-bg`|`oklch(0.66 0.19 50)`|||
|`--cngx-breadcrumb-ribbon-active-color`|`oklch(1 0 0)`|||
|`--cngx-breadcrumb-ribbon-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-ribbon-radius`|`4px`|||
|`--cngx-breadcrumb-editorial-accent`|`oklch(0.66 0.19 50)`|||
|`--cngx-breadcrumb-editorial-text`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-editorial-font-size`|`1rem`|||
|`--cngx-breadcrumb-header-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-header-hover-bg`|`oklch(0.97 0.005 250)`|||
|`--cngx-breadcrumb-header-text`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-header-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-header-leaf-font-size`|`1.125rem`|||
|`--cngx-breadcrumb-header-radius`|`4px`|||
|`--cngx-breadcrumb-metro-accent`|`oklch(0.66 0.19 50)`|||
|`--cngx-breadcrumb-metro-surface`|`oklch(1 0 0)`|||
|`--cngx-breadcrumb-metro-hover-dot`|`oklch(0.95 0.03 50)`|||
|`--cngx-breadcrumb-metro-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-metro-active-color`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-metro-rail`|`oklch(0.8 0.06 50)`|||
|`--cngx-breadcrumb-metro-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-toolbar-bg`|`oklch(1 0 0)`|||
|`--cngx-breadcrumb-toolbar-border-strong`|`oklch(0.78 0.01 250)`|||
|`--cngx-breadcrumb-toolbar-cell-border`|`oklch(0.88 0.005 250)`|||
|`--cngx-breadcrumb-toolbar-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-toolbar-hover-bg`|`oklch(0.97 0.005 250)`|||
|`--cngx-breadcrumb-toolbar-hover-color`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-toolbar-active-bg`|`oklch(0.95 0.03 50)`|||
|`--cngx-breadcrumb-toolbar-active-color`|`oklch(0.66 0.19 50)`|||
|`--cngx-breadcrumb-toolbar-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-toolbar-radius`|`4px`|||
|`--cngx-breadcrumb-chips-bg`|`oklch(1 0 0)`|||
|`--cngx-breadcrumb-chips-border`|`oklch(0.88 0.005 250)`|||
|`--cngx-breadcrumb-chips-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-chips-hover-border`|`oklch(0.78 0.01 250)`|||
|`--cngx-breadcrumb-chips-hover-bg`|`oklch(0.97 0.005 250)`|||
|`--cngx-breadcrumb-chips-hover-color`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-chips-active-bg`|`oklch(0.95 0.03 50)`|||
|`--cngx-breadcrumb-chips-active-border`|`oklch(0.82 0.08 50)`|||
|`--cngx-breadcrumb-chips-active-color`|`oklch(0.66 0.19 50)`|||
|`--cngx-breadcrumb-chips-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-chips-radius`|`999px`|||
|`--cngx-breadcrumb-path-track-bg`|`oklch(0.97 0.005 250)`|||
|`--cngx-breadcrumb-path-track-border`|`oklch(0.88 0.005 250)`|||
|`--cngx-breadcrumb-path-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-path-hover-bg`|`oklch(1 0 0)`|||
|`--cngx-breadcrumb-path-hover-color`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-path-active-color`|`oklch(0.66 0.19 50)`|||
|`--cngx-breadcrumb-path-sep-color`|`oklch(0.72 0.01 250)`|||
|`--cngx-breadcrumb-path-radius`|`8px`|||
|`--cngx-breadcrumb-path-link-radius`|`4px`|||
|`--cngx-breadcrumb-path-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-iconlabel-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-iconlabel-hover-bg`|`oklch(0.97 0.005 250)`|||
|`--cngx-breadcrumb-iconlabel-hover-color`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-iconlabel-active-bg`|`oklch(0.95 0.03 50)`|||
|`--cngx-breadcrumb-iconlabel-active-color`|`oklch(0.66 0.19 50)`|||
|`--cngx-breadcrumb-iconlabel-radius`|`999px`|||
|`--cngx-breadcrumb-iconlabel-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-icononly-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-icononly-hover-bg`|`oklch(0.97 0.005 250)`|||
|`--cngx-breadcrumb-icononly-hover-color`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-icononly-active-bg`|`oklch(0.66 0.19 50)`|||
|`--cngx-breadcrumb-icononly-active-color`|`oklch(1 0 0)`|||
|`--cngx-breadcrumb-icononly-tip-bg`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-icononly-tip-color`|`oklch(1 0 0)`|||
|`--cngx-breadcrumb-icononly-radius`|`4px`|||
|`--cngx-breadcrumb-icononly-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-shell-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-shell-hover-bg`|`oklch(0.97 0.005 250)`|||
|`--cngx-breadcrumb-shell-text`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-shell-mark-bg`|`oklch(0.66 0.19 50)`|||
|`--cngx-breadcrumb-shell-mark-color`|`oklch(1 0 0)`|||
|`--cngx-breadcrumb-shell-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-shell-radius`|`4px`|||
|`--cngx-breadcrumb-record-color`|`oklch(0.5 0.01 250)`|||
|`--cngx-breadcrumb-record-hover-bg`|`oklch(0.97 0.005 250)`|||
|`--cngx-breadcrumb-record-text`|`oklch(0.2 0.01 250)`|||
|`--cngx-breadcrumb-record-chip-bg`|`oklch(1 0 0)`|||
|`--cngx-breadcrumb-record-chip-border`|`oklch(0.78 0.01 250)`|||
|`--cngx-breadcrumb-record-status`|`oklch(0.7 0.17 145)`|||
|`--cngx-breadcrumb-record-font-size`|`0.875rem`|||
|`--cngx-breadcrumb-record-radius`|`4px`|||
|`--cngx-breadcrumb-record-chip-radius`|`999px`|||

## CngxBullet

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame.|

## CngxButtonMultiToggleGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-toggle-group-gap`|`0`|Layout|Gap between toggle children. Zero by default so the buttons|
|`--cngx-button-toggle-group-radius`|`0.375rem`|Layout|Corner radius of the group container. Defaults to `--cngx-radius-md`.|

## CngxButtonToggleGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-button-toggle-group-gap`|`0`|Layout|Gap between toggle children. Zero by default so the buttons|
|`--cngx-button-toggle-group-radius`|`0.375rem`|Layout|Corner radius of the group container. Defaults to `--cngx-radius-md`.|

## CngxCard

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-card-radius`|`12px`|Layout|Corner radius. Defaults to `--cngx-radius-lg`.|
|`--cngx-card-bg`|`oklch(1 0 0)`|Surface|Card surface color. Falls back through `--cngx-color-surface`.|
|`--cngx-card-color`|`oklch(0.2 0.01 290)`|Surface|Card text color. Falls back through `--cngx-color-text`.|
|`--cngx-card-border`|`1px solid oklch(0.81 0.005 250)`|Surface|Border shorthand. Falls back through `--cngx-color-border`.|
|`--cngx-card-min-width`|`120px`|Layout|Minimum inline size of the card so empty cards still read as a|
|`--cngx-card-hover-shadow`|`0 2px 8px 0 oklch(0 0 0 / 0.12)`|State / Hover|Drop-shadow applied on hover for `.cngx-card--interactive`.|
|`--cngx-card-active-opacity`|`0.88`|State / Active|Opacity multiplier applied on touch-active. Only fires under|
|`--cngx-card-focus-width`|`2px`|State / Focus|Focus-ring width.|
|`--cngx-card-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-card-focus-color`|`oklch(0.66 0.19 50)`|State / Focus|Focus-ring color. Falls back to `--cngx-color-primary`.|
|`--cngx-card-selected-border`|`oklch(0.66 0.19 50)`|State / Selected|Border color of the selected state and the inset selection bar.|
|`--cngx-card-selected-bg`|`oklch(0.96 0.04 50)`|State / Selected|Background of the selected state. The runtime fallback uses|
|`--cngx-card-selected-bar-width`|`3px`|State / Selected|Width of the inset selection bar drawn via `::before` - provides|
|`--cngx-card-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied by `.cngx-card--disabled`.|
|`--cngx-card-loading-shimmer`|`oklch(1 0 0 / 0.4)`|State / Loading|Shimmer band color for the loading overlay gradient.|
|`--cngx-card-loading-overlay`|`oklch(1 0 0 / 0.3)`|State / Loading|Static overlay shown when `prefers-reduced-motion` suppresses|
|`--cngx-card-title-size`|`1rem`|Typography|Font-size of the title slot.|
|`--cngx-card-title-weight`|`600`|Typography|Font-weight of the title slot.|
|`--cngx-card-title-color`|`oklch(0.2 0.01 290)`|Typography|Text color of the title slot.|
|`--cngx-card-subtitle-size`|`0.8125rem`|Typography|Font-size of the subtitle slot.|
|`--cngx-card-subtitle-weight`|`400`|Typography|Font-weight of the subtitle slot.|
|`--cngx-card-subtitle-color`|`oklch(0.36 0.02 290)`|Typography|Text color of the subtitle slot - muted by default.|
|`--cngx-card-divider`|`oklch(0.81 0.005 250)`|Surface|Border color of the actions divider.|
|`--cngx-card-accent-width`|`3px`|Variant / Accent|Width of the top accent stripe applied by `.cngx-card--accent`.|
|`--cngx-card-accent-color`|`transparent`|Variant / Accent|Color of the top accent stripe. Per-variant rules set it to the|
|`--cngx-card-accent-info-bg`|`oklch(0.97 0.03 250)`|Variant / Accent|Tinted background for `.cngx-card--accent-info`. The runtime|
|`--cngx-card-accent-success-bg`|`oklch(0.97 0.04 145)`|Variant / Accent|Tinted background for `.cngx-card--accent-success`.|
|`--cngx-card-accent-warning-bg`|`oklch(0.97 0.04 75)`|Variant / Accent|Tinted background for `.cngx-card--accent-warning`.|
|`--cngx-card-accent-danger-bg`|`oklch(0.97 0.03 25)`|Variant / Accent|Tinted background for `.cngx-card--accent-danger`.|
|`--cngx-card-badge-offset`|`-6px`|Layout|Offset of the badge slot from the card corners (negative pulls|
|`--cngx-card-badge-size-sm`|`10px`|Sizing|Diameter (and minimum width) of the badge pill at the `sm` size.|
|`--cngx-card-badge-size-md`|`22px`|Sizing|Diameter (and minimum width) of the badge pill at the `md` size.|
|`--cngx-card-badge-size-lg`|`28px`|Sizing|Diameter (and minimum width) of the badge pill at the `lg` size.|
|`--cngx-card-badge-padding-inline`|`5px`|Sizing|Inline padding around content-bearing badges. Zeroed by the|
|`--cngx-card-badge-font-size-sm`|`0.625rem`|Sizing|Font-size at the `sm` size.|
|`--cngx-card-badge-font-size-md`|`0.7rem`|Sizing|Font-size at the `md` size.|
|`--cngx-card-badge-font-size-lg`|`0.8125rem`|Sizing|Font-size at the `lg` size.|
|`--cngx-card-badge-radius`|`999px`|Sizing|Corner radius. Defaults to the pill radius via `--cngx-radius-pill`|
|`--cngx-card-badge-border`|`2px solid oklch(1 0 0)`|Surface|Ring around the badge - contrasts the pill against the card|
|`--cngx-card-badge-primary-bg`|`oklch(0.66 0.19 50)`|Variant / Primary|Background of the `primary` intent. Falls back through|
|`--cngx-card-badge-primary-color`|`oklch(1 0 0)`|Variant / Primary|Text colour of the `primary` intent.|
|`--cngx-card-badge-danger-bg`|`oklch(0.62 0.22 25)`|Variant / Danger|Background of the `danger` intent. Falls back through|
|`--cngx-card-badge-danger-color`|`oklch(1 0 0)`|Variant / Danger|Text colour of the `danger` intent.|
|`--cngx-card-badge-warning-bg`|`oklch(0.72 0.18 70)`|Variant / Warning|Background of the `warning` intent. Falls back through|
|`--cngx-card-badge-warning-color`|`oklch(0.2 0.01 250)`|Variant / Warning|Text colour of the `warning` intent.|
|`--cngx-card-badge-success-bg`|`oklch(0.6 0.15 145)`|Variant / Success|Background of the `success` intent. No `CngxBadge` analogue -|
|`--cngx-card-badge-success-color`|`oklch(1 0 0)`|Variant / Success|Text colour of the `success` intent.|
|`--cngx-card-badge-neutral-bg`|`oklch(0.68 0.01 240)`|Variant / Neutral|Background of the `neutral` intent. Falls back through|
|`--cngx-card-badge-neutral-color`|`oklch(1 0 0)`|Variant / Neutral|Text colour of the `neutral` intent.|

## CngxCardGrid

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-card-grid-min`|`280px`|Layout|Minimum inline size of a single grid cell - `auto-fill` packs as|
|`--cngx-card-grid-gap`|`16px`|Layout|Gap between grid cells. Density modifiers re-pin this and the|

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
|`--cngx-field-char-count-font-size`|`0.75rem`|Typography|Font-size of the counter text. Falls back through|
|`--cngx-field-char-count-color`|`oklch(0.45 0 0)`|Surface|Text color while under the limit. Falls back through|
|`--cngx-field-char-count-over-color`|`oklch(0.55 0.21 27)`|State / Over|Text color once the count exceeds the limit. Falls back through|

## CngxChart

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame.|

## CngxCheckbox

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-checkbox-gap`|`0.5rem`|Layout|Gap between the indicator and the label slot. Falls back to|
|`--cngx-checkbox-sibling-gap`|`1rem`|Layout|Horizontal spacing between adjacent inline `<cngx-checkbox>`|
|`--cngx-checkbox-focus-outline`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand applied via `outline` on the host.|
|`--cngx-checkbox-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-checkbox-focus-radius`|`0.25rem`|State / Focus|Corner radius applied while focused - keeps the ring rounded|

## CngxCheckboxGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-checkbox-group-gap`|`0.5rem`|Layout|Gap between checkbox children. Falls back to `--cngx-space-sm`.|

## CngxCheckboxIndicator

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-checkbox-size`|`1em`|Layout|Active size of the indicator box. `inherits: true` is load-bearing -|
|`--cngx-checkbox-color`|`currentColor`|Surface|Text color of the inner glyph in the bare `checkmark` variant.|
|`--cngx-checkbox-bg`|`transparent`|Surface|Background of the unchecked box. Inherited so a host-level|
|`--cngx-checkbox-border`|`1.5px solid currentColor`|Surface|Border shorthand of the unchecked box. Width + style + color in|
|`--cngx-checkbox-radius`|`2px`|Layout|Corner radius of the box. Defaults to `--cngx-radius-sm`. Inherited|
|`--cngx-checkbox-checked-bg`|`oklch(0.66 0.19 50)`|State / Checked|Background of the box when checked or indeterminate. Falls back|
|`--cngx-checkbox-checked-color`|`oklch(1 0 0)`|State / Checked|Glyph color inside the checked/indeterminate box.|
|`--cngx-checkbox-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied by `.cngx-checkbox-indicator--disabled`.|
|`--cngx-checkbox-size-sm`|`0.875em`|Variant / Size|Size token for the `.cngx-checkbox-indicator--sm` variant.|
|`--cngx-checkbox-size-md`|`1em`|Variant / Size|Size token for the `.cngx-checkbox-indicator--md` variant (default).|
|`--cngx-checkbox-size-lg`|`1.25em`|Variant / Size|Size token for the `.cngx-checkbox-indicator--lg` variant.|

## CngxChip

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chip-inner-gap`|`4px`|Layout|Gap between the chip's internal slots (prefix / label / remove).|
|`--cngx-chip-padding-block`|`2px`|Layout|Block-axis padding of the pill.|
|`--cngx-chip-padding-inline`|`8px`|Layout|Inline-axis padding of the pill.|
|`--cngx-chip-radius`|`999px`|Layout|Corner radius. Defaults to a full pill via `--cngx-radius-pill`.|
|`--cngx-chip-bg`|`oklch(0.66 0.19 50 / 0.12)`|Surface|Background of the default (unkeyed) chip. Primary-tinted at low|
|`--cngx-chip-color`|`currentColor`|Surface|Text color. Defaults to `currentColor` so the chip inherits the|
|`--cngx-chip-border`|`0 solid transparent`|Surface|Border shorthand. Zero-width by default - pillows fill the box.|
|`--cngx-chip-font-size`|`0.875em`|Typography|Font-size of the chip label.|
|`--cngx-chip-transition`|`background-color 150ms ease,
      color 150ms ease,
      border-color 150ms ease`|Motion|Transition shorthand for background / color / border-color|
|`--cngx-chip-hover-bg`|`oklch(0.66 0.19 50 / 0.2)`|State / Hover|Background of the hover state for interactive chips|
|`--cngx-chip-hover-color`|`currentColor`|State / Hover|Text color of the hover state.|
|`--cngx-chip-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring shorthand applied via `outline` on `:focus-visible`.|
|`--cngx-chip-focus-outline-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-chip-disabled-opacity`|`0.38`|State / Disabled|Opacity multiplier applied by `[aria-disabled=true]` and `:disabled`.|
|`--cngx-chip-selected-bg`|`oklch(0.66 0.19 50 / 0.32)`|State / Selected|Background of the selected state (`[aria-selected=true]` /|
|`--cngx-chip-selected-color`|`currentColor`|State / Selected|Text color of the selected state.|
|`--cngx-chip-info-bg`|`oklch(0.65 0.12 240 / 0.16)`|Variant / Info|Background of the `[data-color=info]` variant.|
|`--cngx-chip-info-color`|`oklch(0.45 0.12 240)`|Variant / Info|Text color of the `[data-color=info]` variant.|
|`--cngx-chip-success-bg`|`oklch(0.65 0.15 145 / 0.16)`|Variant / Success|Background of the `[data-color=success]` variant.|
|`--cngx-chip-success-color`|`oklch(0.45 0.15 145)`|Variant / Success|Text color of the `[data-color=success]` variant.|
|`--cngx-chip-warning-bg`|`oklch(0.72 0.15 75 / 0.18)`|Variant / Warning|Background of the `[data-color=warning]` variant.|
|`--cngx-chip-warning-color`|`oklch(0.5 0.15 75)`|Variant / Warning|Text color of the `[data-color=warning]` variant.|
|`--cngx-chip-danger-bg`|`oklch(0.65 0.22 25 / 0.18)`|Variant / Danger|Background of the `[data-color=danger]` variant.|
|`--cngx-chip-danger-color`|`oklch(0.5 0.2 25)`|Variant / Danger|Text color of the `[data-color=danger]` variant.|
|`--cngx-chip-remove-opacity`|`0.7`|State / Remove|Resting opacity of the inline remove button.|
|`--cngx-chip-remove-opacity-hover`|`1`|State / Remove|Hover opacity of the inline remove button.|
|`--cngx-chip-remove-radius`|`2px`|State / Remove|Corner radius of the inline remove button.|
|`--cngx-chip-remove-focus-width`|`2px`|State / Remove|Focus-ring width of the inline remove button.|
|`--cngx-chip-remove-focus-color`|`oklch(0.66 0.19 50)`|State / Remove|Focus-ring color of the inline remove button. Falls back to|
|`--cngx-chip-remove-focus-offset`|`1px`|State / Remove|Focus-ring offset of the inline remove button.|

## CngxChipGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chip-group-gap`|`0.5rem`|Layout|Gap between chip children. Falls back to `--cngx-space-sm`.|

## CngxCloseButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-close-button-bg`|`none`|Surface|Background of the resting button.|
|`--cngx-close-button-border`|`none`|Surface|Border shorthand of the resting button.|
|`--cngx-close-button-size`|`32px`|Layout|Minimum hit-target size of the button (both axes).|
|`--cngx-close-button-padding`|`8px`|Layout|Padding shorthand. Falls back to `--cngx-space-sm`.|
|`--cngx-close-button-color`|`currentColor`|Surface|Glyph color. Defaults to `currentColor`.|
|`--cngx-close-button-opacity`|`0.5`|State / Idle|Resting opacity. The hover state lifts to full opacity.|
|`--cngx-close-button-radius`|`4px`|Layout|Corner radius. Defaults to `--cngx-radius-sm`.|
|`--cngx-close-button-transition`|`150ms`|Motion|Transition duration for opacity / background changes.|
|`--cngx-close-button-hover-opacity`|`1`|State / Hover|Opacity multiplier applied on hover.|
|`--cngx-close-button-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint applied on hover - a subtle neutral overlay.|
|`--cngx-close-button-focus-outline`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand.|
|`--cngx-close-button-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-close-button-active-opacity`|`0.8`|State / Active|Opacity applied during the active (pressed) state.|
|`--cngx-close-button-icon-size`|`16px`|Layout|Width + height of the inner icon slot.|

## CngxCombobox

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven,|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks|
|`--cngx-select-caret-size`|`1.25em`|Layout|Font-size of the dropdown caret glyph shared across every variant.|
|`--cngx-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled. Shared|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true`|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.6 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-bg`|`oklch(0.66 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Falls back|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.6 0.18 25)`|State / Error|Text color of every error surface. Falls back to|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-combobox-min-width`|`12rem`|Layout|Minimum inline size of the trigger.|
|`--cngx-combobox-gap`|`0.375rem`|Layout|Gap between the chip list, input, caret, and clear-all button.|
|`--cngx-combobox-padding`|`0.25rem 0.375rem`|Layout|Padding shorthand of the trigger.|
|`--cngx-combobox-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the trigger.|
|`--cngx-combobox-radius`|`0.25rem`|Layout|Corner radius of the trigger.|
|`--cngx-combobox-bg`|`transparent`|Surface|Background of the trigger.|
|`--cngx-combobox-color`|`currentColor`|Surface|Text color of the trigger.|
|`--cngx-combobox-min-height`|`2.25rem`|Layout|Minimum block size of the trigger - fits a single row of chips.|
|`--cngx-combobox-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand applied on `:focus-within`. Falls|
|`--cngx-combobox-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled.|
|`--cngx-combobox-input-flex-basis`|`4rem`|Layout|Flex basis of the inline input - sets the preferred starting|
|`--cngx-combobox-input-min-width`|`4rem`|Layout|Minimum inline size of the inline input - keeps the input|
|`--cngx-combobox-clear-opacity`|`0.6`|State / Clear|Resting opacity of the clear-all button.|

## CngxContextMenu

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-context-menu-surface`|`oklch(1 0 0)`|Surface|Popup surface background. Falls back through `--cngx-color-surface`.|
|`--cngx-context-menu-color`|`oklch(0.2 0.01 250)`|Surface|Menu text color. Falls back through `--cngx-color-text`.|
|`--cngx-context-menu-border`|`1px solid oklch(0.88 0.005 250)`|Surface|Border shorthand around the popup surface. Falls back through|
|`--cngx-context-menu-radius`|`8px`|Layout|Corner radius of the popup surface.|
|`--cngx-context-menu-shadow`|`0 4px 16px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand for the popup. `inherits: true` so a `:root`|
|`--cngx-context-menu-padding`|`4px`|Layout|Padding inside the popup surface (around the item stack). Derived from|
|`--cngx-context-menu-separator-color`|`oklch(0.88 0.005 250)`|Surface|Color of the separator hairline. Falls back through `--cngx-color-border`.|
|`--cngx-context-menu-separator-inset`|`4px`|Layout|Block margin above and below the separator hairline. Derived from|

## CngxContextMenuItem

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-context-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each item row. Derived from the `--cngx-space-*`|
|`--cngx-context-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / kbd / caret). Derived|
|`--cngx-context-menu-item-radius`|`4px`|Layout|Corner radius of each item row.|
|`--cngx-context-menu-item-caret-color`|`oklch(0.5 0.01 250)`|Surface|Color of the trailing submenu caret. Falls back through|
|`--cngx-context-menu-item-check-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading checkbox / radio indicator glyph on a checked item.|

## CngxContextMenuItemCheckbox

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-context-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each item row. Derived from the `--cngx-space-*`|
|`--cngx-context-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / kbd / caret). Derived|
|`--cngx-context-menu-item-radius`|`4px`|Layout|Corner radius of each item row.|
|`--cngx-context-menu-item-caret-color`|`oklch(0.5 0.01 250)`|Surface|Color of the trailing submenu caret. Falls back through|
|`--cngx-context-menu-item-check-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading checkbox / radio indicator glyph on a checked item.|

## CngxContextMenuItemRadio

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-context-menu-item-padding`|`6px 10px`|Layout|Padding shorthand on each item row. Derived from the `--cngx-space-*`|
|`--cngx-context-menu-item-gap`|`8px`|Layout|Inline gap between an item's slots (icon / label / kbd / caret). Derived|
|`--cngx-context-menu-item-radius`|`4px`|Layout|Corner radius of each item row.|
|`--cngx-context-menu-item-caret-color`|`oklch(0.5 0.01 250)`|Surface|Color of the trailing submenu caret. Falls back through|
|`--cngx-context-menu-item-check-color`|`oklch(0.66 0.19 50)`|State / Checked|Color of the leading checkbox / radio indicator glyph on a checked item.|

## CngxCopyBlock

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-copy-block-gap`|`8px`|Layout|Gap between the content block and the copy button. Falls back|
|`--cngx-copy-block-btn-border`|`currentColor`|Surface|Border color of the idle copy button.|
|`--cngx-copy-block-btn-bg`|`transparent`|Surface|Background of the idle copy button.|
|`--cngx-copy-block-btn-color`|`currentColor`|Surface|Text color of the idle copy button.|
|`--cngx-copy-block-btn-radius`|`4px`|Layout|Corner radius of the copy button. Defaults to `--cngx-radius-sm`.|
|`--cngx-copy-block-btn-padding`|`4px 8px`|Layout|Padding shorthand of the copy button.|
|`--cngx-copy-block-btn-font-size`|`0.75rem`|Typography|Font-size of the copy-button label. Falls back to|
|`--cngx-copy-block-btn-copied-bg`|`oklch(0.96 0.025 145)`|State / Copied|Background of the copied-state button - soft success tint.|
|`--cngx-copy-block-btn-copied-border`|`oklch(0.5 0.12 145)`|State / Copied|Border color of the copied-state button. Falls back to|
|`--cngx-copy-block-btn-copied-color`|`oklch(0.5 0.12 145)`|State / Copied|Text color of the copied-state button. Falls back to|

## CngxDelta

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-delta-gap`|`2px`|Layout|Gap between the arrow glyph and the delta magnitude.|
|`--cngx-delta-size`|`0.8125rem`|Typography|Font-size of the delta label.|
|`--cngx-delta-weight`|`500`|Typography|Font-weight of the delta label.|
|`--cngx-delta-neutral-color`|`oklch(0.36 0.02 290)`|Variant / Neutral|Colour of the `.cngx-delta--neutral` modifier - flat or|
|`--cngx-delta-positive-color`|`oklch(0.65 0.18 145)`|Variant / Positive|Colour of the `.cngx-delta--positive` modifier. Falls back to|
|`--cngx-delta-negative-color`|`oklch(0.65 0.22 25)`|Variant / Negative|Colour of the `.cngx-delta--negative` modifier. Falls back to|

## CngxDeviationBar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame.|

## CngxDonut

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame.|

## CngxDotStepper

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-dot-step-size`|`0.625rem`|||
|`--cngx-dot-step-gap`|`0.5rem`|||
|`--cngx-dot-step-active-fill`|`var(--cngx-step-active-fill, oklch(0.66 0.19 50))`|||
|`--cngx-dot-step-completed-fill`|`var(--cngx-step-completed-color, var(--cngx-color-success, oklch(0.5 0.15 145)))`|||
|`--cngx-dot-step-upcoming-bg`|`var(--cngx-step-indicator-bg, color-mix(in srgb, currentColor 18%, transparent))`|||

## CngxEmptyState

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-empty-gap`|`16px`|Layout|Vertical gap between the icon, title, description, and actions.|
|`--cngx-empty-padding`|`48px`|Layout|Block padding around the entire empty state. Falls back to|
|`--cngx-empty-color`|`oklch(0.34 0.005 290)`|Surface|Default text color for the description slot.|
|`--cngx-empty-icon-color`|`oklch(0.34 0.005 290)`|Surface|Color of the default icon glyph (when no custom icon is|
|`--cngx-empty-title-size`|`1.125rem`|Typography|Font-size of the title slot.|
|`--cngx-empty-title-weight`|`500`|Typography|Font-weight of the title slot.|
|`--cngx-empty-title-color`|`oklch(0.18 0.005 290)`|Typography|Text color of the title slot - slightly darker than the|
|`--cngx-empty-desc-size`|`0.875rem`|Typography|Font-size of the description slot.|

## CngxFilterBuilder

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-filter-builder-padding`|`0.5rem`|Layout|Padding shorthand around the outer builder container.|
|`--cngx-filter-builder-bg`|`transparent`|Surface|Background of the outer builder container.|
|`--cngx-filter-builder-fg`|`currentColor`|Surface|Foreground text color of the builder.|
|`--cngx-filter-builder-gap`|`0.5rem`|Layout|Gap between sibling rows / actions / logic-toggle items.|
|`--cngx-filter-builder-group-padding`|`0.5rem`|Layout|Padding shorthand inside each group container.|
|`--cngx-filter-builder-group-border`|`1px solid oklch(0.87 0 0)`|Surface|Border shorthand of each group container.|
|`--cngx-filter-builder-border-color`|`oklch(0.87 0 0)`|Surface|Border color of group containers and the action-button stroke.|
|`--cngx-filter-builder-radius`|`0.375rem`|Layout|Corner radius of group containers and action buttons.|
|`--cngx-filter-builder-indent`|`1.25rem`|Layout|Indent applied to nested (non-root) groups so the hierarchy reads|
|`--cngx-filter-builder-rail`|`2px solid oklch(0.87 0 0)`|Surface|Left rail border shorthand for nested groups. `inherits: true`|
|`--cngx-filter-builder-negated-border-style`|`dashed`|Variant / Negated|Border-style applied to negated groups — dashed reads as|
|`--cngx-filter-builder-empty-padding`|`0.75rem`|Layout|Padding shorthand of the empty-state slot.|
|`--cngx-filter-builder-empty-fg`|`oklch(0.45 0 0)`|State / Empty|Text color of the empty-state slot — muted by default.|
|`--cngx-filter-builder-action-gap`|`0.25rem`|Layout|Gap between an action button's glyph and its label.|
|`--cngx-filter-builder-action-padding`|`0.25rem 0.625rem`|Layout|Padding shorthand of an action button.|
|`--cngx-filter-builder-action-font-size`|`0.875rem`|Typography|Font-size of an action button's label.|
|`--cngx-filter-builder-action-fg`|`currentColor`|Surface|Text color of an action button.|
|`--cngx-filter-builder-action-bg`|`transparent`|Surface|Background of an action button at rest.|
|`--cngx-filter-builder-action-border-width`|`1px`|Surface|Border width of an action button.|
|`--cngx-filter-builder-action-border`|`oklch(0.82 0 0)`|Surface|Border color of an action button. `inherits: true` so a :root|
|`--cngx-filter-builder-action-radius`|`0.375rem`|Layout|Corner radius of an action button.|
|`--cngx-filter-builder-action-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint applied on hover / focus-visible of an action|
|`--cngx-filter-builder-focus-outline`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand applied to action buttons.|
|`--cngx-filter-builder-focus-outline-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-filter-builder-action-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied to disabled action buttons.|
|`--cngx-filter-builder-action-remove-fg`|`oklch(0.55 0.18 25)`|Variant / Remove|Foreground color of the destructive remove button. Falls back|
|`--cngx-filter-builder-error-fg`|`oklch(0.55 0.18 25)`|State / Error|Error-tone foreground shared across the builder's error states.|
|`--cngx-filter-builder-action-glyph-size`|`1em`|Layout|Font-size of the action-button glyph slot.|

## CngxFilterExpressionRow

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-filter-builder-incomplete-outline`|`1px dashed oklch(0.55 0.15 65)`|State / Incomplete|Outline shorthand for the incomplete-expression state — dashed|
|`--cngx-filter-builder-incomplete-outline-offset`|`2px`|State / Incomplete|Outline offset of the incomplete-expression outline.|

## CngxFilterRow

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-filter-builder-empty-row-opacity`|`0.85`|State / Empty|Opacity multiplier applied to the empty row variant — fades the|

## CngxFormErrors

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-form-errors-font-size`|`0.875rem`|Typography|Font-size of the error list. Falls back through|
|`--cngx-form-errors-color`|`oklch(0.55 0.21 27)`|Surface|Text color of the error list. Falls back through|

## CngxGoal

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-goal-fill`|`0%`|Layout|Attained fraction, as a `<percentage>`. The component binds this inline|
|`--cngx-goal-height`|`8px`|Layout|Height of the track.|
|`--cngx-goal-radius`|`999px`|Layout|Corner radius of the track and fill.|
|`--cngx-goal-track-color`|`oklch(0.92 0.01 290)`|Surface|Colour of the unfilled track groove.|
|`--cngx-goal-fill-color`|`oklch(0.65 0.18 145)`|Surface|Colour of the attained fill. Falls back to `--cngx-color-success`.|

## CngxIcon

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-icon-size`|`1.25em`|Layout|Active size of the icon - consumed by the `:scope` rule. Driven|
|`--cngx-icon-color`|`currentColor`|Surface|Text color of the icon glyph. Defaults to `currentColor` so the|
|`--cngx-icon-size-xs`|`0.75em`|Variant / Size|Size token for the `.cngx-icon--xs` variant.|
|`--cngx-icon-size-sm`|`1em`|Variant / Size|Size token for the `.cngx-icon--sm` variant.|
|`--cngx-icon-size-md`|`1.25em`|Variant / Size|Size token for the `.cngx-icon--md` variant (default).|
|`--cngx-icon-size-lg`|`1.5em`|Variant / Size|Size token for the `.cngx-icon--lg` variant.|
|`--cngx-icon-size-xl`|`2em`|Variant / Size|Size token for the `.cngx-icon--xl` variant.|

## CngxLabel

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-required-color`|`oklch(0.55 0.21 27)`|State / Required|Color of the required-marker glyph next to the label. Falls back|

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
|`--cngx-loading-overlay-backdrop-bg`|`oklch(1 0 0 / 0.5)`|Surface|Backdrop background - translucent white by default; override for|
|`--cngx-loading-overlay-backdrop-opacity`|`1`|Surface|Backdrop opacity multiplier.|
|`--cngx-overlay-transition-duration`|`150ms`|Motion|Opacity-fade transition duration for the overlay show/hide.|
|`--cngx-overlay-transition-easing`|`ease`|Motion|Easing curve of the overlay show/hide transition.|

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
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame.|

## CngxMiniBar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame.|

## CngxMultiChipGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-multi-chip-group-gap`|`0.5rem`|Layout|Gap between chip children. Cascades through the single-select|

## CngxMultiSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven,|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks|
|`--cngx-select-caret-size`|`1.25em`|Layout|Font-size of the dropdown caret glyph shared across every variant.|
|`--cngx-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled. Shared|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true`|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.6 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-bg`|`oklch(0.66 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Falls back|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.6 0.18 25)`|State / Error|Text color of every error surface. Falls back to|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-multi-select-min-width`|`10rem`|Layout|Minimum inline size of the trigger.|
|`--cngx-multi-select-gap`|`0.5rem`|Layout|Gap between the chip list, placeholder, caret, and clear button.|
|`--cngx-multi-select-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of the trigger.|
|`--cngx-multi-select-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the trigger.|
|`--cngx-multi-select-radius`|`0.25rem`|Layout|Corner radius of the trigger.|
|`--cngx-multi-select-bg`|`transparent`|Surface|Background of the trigger.|
|`--cngx-multi-select-color`|`currentColor`|Surface|Text color of the trigger.|
|`--cngx-multi-select-min-height`|`2.25rem`|Layout|Minimum block size of the trigger - fits a single row of chips.|
|`--cngx-multi-select-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand. Falls back to `--cngx-color-primary`.|
|`--cngx-multi-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled.|
|`--cngx-multi-select-clear-opacity`|`0.6`|State / Clear|Resting opacity of the clear-all button.|

## CngxPaginator

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-paginator-gap`|`0.25rem`|Layout|Gap between adjacent cells.|
|`--cngx-paginator-row-gap`|`12px`|Layout|Gap between adjacent segment rows on the host. Split from|
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
|`--cngx-paginator-disabled-opacity`|`0.45`|State / Disabled|Opacity multiplier applied to a disabled (bound or busy) button.|
|`--cngx-paginator-track-bg`|`oklch(0.96 0 0)`|Skin|Muted track the page row sits in under the `segmented` skin. Derived from|
|`--cngx-paginator-active-shadow`|`0 1px 2px oklch(0 0 0 / 0.06)`|Skin|Drop shadow that raises the active page off the track under the|
|`--cngx-paginator-indicator-thickness`|`2px`|Skin|Thickness of the `numbered` skin's active-page underline bar.|
|`--cngx-paginator-rail-color`|`oklch(0.88 0.005 250)`|Skin|Colour of the hairline rail the page row rode under the old `rail` skin.|
|`--cngx-paginator-rail-thickness`|`2px`|Skin|Thickness of the old `rail` skin's underline + position marker.|
|`--cngx-paginator-rail-knob-size`|`14px`|Skin|Diameter of the `rail` skin's position knob (the dot riding the fill edge).|
|`--cngx-paginator-rail-knob-bg`|`oklch(1 0 0)`|Skin|Fill of the `rail` skin's position knob. Defaults to the foundation surface.|
|`--cngx-paginator-rail-knob-border-color`|`oklch(0.66 0.19 50)`|Skin|Ring colour of the `rail` skin's position knob. Defaults to the primary.|
|`--cngx-paginator-bar-border-color`|`oklch(0.88 0.005 250)`|Skin|Border + divider colour of the enclosed `bar` skin.|
|`--cngx-paginator-bar-radius`|`6px`|Skin|Corner radius of the enclosed `bar` skin's outer box.|
|`--cngx-paginator-hover-scale`|`1`|Motion|Scale a button grows to on hover. Defaults to `1` (no grow) - the resting|
|`--cngx-paginator-press-scale`|`1`|Motion|Scale a button grows to while pressed. Defaults to `1` (no pop); opt in by|
|`--cngx-paginator-motion-duration`|`200ms`|Motion|Duration of the hover / press / focus transitions.|
|`--cngx-paginator-fade-duration`|`250ms`|Motion|Duration of the page-row crossfade while the host reports busy.|
|`--cngx-paginator-busy-opacity`|`0.6`|State / Busy|Opacity the page row fades to while the host reports busy.|
|`--cngx-paginator-focus-halo`|`0 0 0 4px color-mix(in oklch, currentColor 18%, transparent)`|State / Focus|Soft halo painted behind the focus-visible outline.|
|`--cngx-paginator-dot-size`|`8px`|Skin|Diameter of a resting (full-size) dot in the `dots` indicator.|
|`--cngx-paginator-dot-gap`|`8px`|Skin|Gap between adjacent dots.|
|`--cngx-paginator-dot-color`|`oklch(0.7 0 0 / 0.35)`|Skin|Fill of an inactive dot.|
|`--cngx-paginator-dot-current-color`|`oklch(0.66 0.19 50)`|Skin|Fill of the active dot. Delegates to `--cngx-color-primary`.|
|`--cngx-paginator-panel-bg`|`Canvas`|Popover|Surface of the popover panel shared by the items-per-page / page-of-pages|
|`--cngx-paginator-panel-color`|`currentColor`|Popover|Text colour inside the popover panel.|
|`--cngx-paginator-panel-border-color`|`color-mix(in oklch, currentColor 20%, transparent)`|Popover|Border colour of the popover panel.|
|`--cngx-paginator-panel-radius`|`8px`|Popover|Corner radius of the popover panel.|
|`--cngx-paginator-panel-padding`|`0.25rem`|Popover|Inner padding of the popover panel.|
|`--cngx-paginator-panel-shadow`|`0 4px 12px rgb(0 0 0 / 0.15)`|Popover|Drop shadow lifting the popover panel off the page.|
|`--cngx-paginator-option-size`|`32px`|Popover|Minimum height of a popover row (page-size option / hidden-page item).|
|`--cngx-paginator-option-padding`|`0 0.75rem`|Popover|Inner padding of a popover row.|
|`--cngx-paginator-option-radius`|`4px`|Popover|Corner radius of a popover row.|
|`--cngx-paginator-option-hover-bg`|`color-mix(in oklch, currentColor 10%, transparent)`|Popover|Background of a hovered / keyboard-highlighted popover row. Shared by the|
|`--cngx-paginator-option-selected-bg`|`color-mix(
      in oklch,
      var(--cngx-color-primary, oklch(0.66 0.19 50)) 14%,
      transparent
    )`|Popover|Background of the selected page-size row in the items-per-page panel.|
|`--cngx-paginator-option-selected-color`|`var(--cngx-color-primary, oklch(0.66 0.19 50))`|Popover|Text colour of the selected page-size row (reads as accent against the tint).|
|`--cngx-paginator-overflow-columns`|`5`|Popover|Column count of the ellipsis overflow grid panel.|
|`--cngx-paginator-overflow-cell-size`|`32px`|Popover|Cell size (column width + row min-height) of the ellipsis overflow grid.|

## CngxPopoverAction

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-popover-action-padding-block`|`6px`|Layout|Block-axis padding of the action button.|
|`--cngx-popover-action-padding-inline`|`14px`|Layout|Inline-axis padding of the action button.|
|`--cngx-popover-action-gap`|`6px`|Layout|Gap between the action's icon and label slots.|
|`--cngx-popover-action-radius`|`6px`|Layout|Corner radius of the action button.|
|`--cngx-popover-action-font-size`|`0.8125rem`|Typography|Font-size of the action label.|
|`--cngx-popover-action-font-weight`|`500`|Typography|Font-weight of the action label.|
|`--cngx-popover-action-transition`|`150ms`|Motion|Transition duration for the hover / focus state changes.|
|`--cngx-popover-action-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Hover-state surface - neutral default + ghost variant share this|

## CngxPopoverPanel

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-popover-panel-bg`|`oklch(1 0 0)`|Surface|Panel background. Falls back through `--cngx-color-surface`.|
|`--cngx-popover-panel-color`|`oklch(0.27 0.04 250)`|Surface|Panel text color. Falls back through `--cngx-color-text`.|
|`--cngx-popover-panel-border-radius`|`12px`|Layout|Corner radius of the panel.|
|`--cngx-popover-panel-padding`|`16px`|Layout|Padding shorthand applied inside the panel.|
|`--cngx-popover-panel-max-width`|`360px`|Layout|Maximum inline size - caps long content before the floater|
|`--cngx-popover-panel-shadow`|`0 8px 24px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand for the panel. `inherits: true` so the|
|`--cngx-popover-panel-border`|`1px solid oklch(0 0 0 / 0.08)`|Surface|Border shorthand for the panel.|
|`--cngx-popover-panel-arrow-size`|`8px`|Layout|Side length of the arrow square (the rotated 45° diamond - final|
|`--cngx-popover-panel-close-size`|`28px`|Layout|Diameter of the optional close button in the header row.|
|`--cngx-popover-panel-transition-duration`|`200ms`|Motion|Duration of the opacity + transform transition between the open|
|`--cngx-popover-panel-transition-easing`|`cubic-bezier(0.4, 0, 0.2, 1)`|Motion|Easing curve of the open / close transition.|
|`--cngx-popover-panel-header-font-size`|`0.875rem`|Typography|Font-size of the optional header slot.|
|`--cngx-popover-panel-header-font-weight`|`600`|Typography|Font-weight of the optional header slot.|
|`--cngx-popover-panel-header-gap`|`8px`|Layout|Vertical gap between the header and the body slot.|
|`--cngx-popover-panel-footer-gap`|`8px`|Layout|Horizontal gap between footer actions.|
|`--cngx-popover-panel-footer-border-top`|`1px solid oklch(0 0 0 / 0.06)`|Surface|Border shorthand applied to the top of the footer - visually|
|`--cngx-popover-panel-footer-padding-top`|`12px`|Layout|Padding above the footer divider.|
|`--cngx-popover-panel-footer-margin-top`|`12px`|Layout|Margin above the footer divider - pulls the footer down off the|
|`--cngx-popover-panel-accent`|`transparent`|Variant / Accent|Accent surface for the semantic-variant rules|
|`--cngx-popover-panel-accent-text`|`currentColor`|Variant / Accent|Text / outline color paired with the accent surface - used by|
|`--cngx-popover-panel-close-hover-bg`|`oklch(0 0 0 / 0.06)`|State / Hover|Hover wash on the optional close button. Light: 6% black wash;|

## CngxProgress

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-progress-label-gap`|`8px`|Layout|Gap between the progress track and the trailing label slot.|
|`--cngx-progress-height`|`4px`|Layout|Height of the linear track.|
|`--cngx-progress-track-color`|`oklch(0 0 0 / 0.1)`|Surface|Track color (the unfilled portion).|
|`--cngx-progress-border-radius`|`2px`|Layout|Corner radius of the linear track.|
|`--cngx-progress-color`|`currentColor`|Surface|Fill color of the progress indicator.|
|`--cngx-progress-transition-duration`|`300ms`|Motion|Duration of the width / dashoffset transition for the|
|`--cngx-progress-transition-easing`|`ease-out`|Motion|Easing curve of the determinate transition.|
|`--cngx-progress-indeterminate-duration`|`1.5s`|Motion|Duration of the indeterminate animation sweep.|
|`--cngx-progress-indeterminate-easing`|`ease-in-out`|Motion|Easing curve of the indeterminate animation.|
|`--cngx-progress-label-size`|`0.75rem`|Typography|Font-size of the linear-variant label.|
|`--cngx-progress-label-color`|`currentColor`|Typography|Color of the label slot.|
|`--cngx-progress-circle-size`|`48px`|Layout|Diameter of the circular ring variant.|
|`--cngx-progress-circle-label-size`|`0.625rem`|Typography|Font-size of the circular-variant centered label.|

## CngxRadio

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-radio-gap`|`0.5rem`|Layout|Gap between the indicator and the label slot.|
|`--cngx-radio-color`|`currentColor`|Surface|Text color of the host shell. Defaults to `currentColor`.|
|`--cngx-radio-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied by `.cngx-radio--disabled`.|
|`--cngx-radio-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand. Matches the foundation reset's|
|`--cngx-radio-focus-offset`|`3px`|State / Focus|Outline offset of the focus ring. Matches the foundation reset's|
|`--cngx-radio-focus-radius`|`0.25rem`|State / Focus|Corner radius applied while focused.|

## CngxRadioGroup

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-radio-group-gap`|`0.5rem`|Layout|Gap between radio children. Falls back to `--cngx-space-sm`.|

## CngxRadioIndicator

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-radio-indicator-size`|`1em`|Layout|Active size of the radio glyph. `inherits: true` is load-bearing -|
|`--cngx-radio-indicator-color`|`currentColor`|Surface|Text color of the radio glyph. Defaults to `currentColor` so the|
|`--cngx-radio-indicator-bg`|`transparent`|Surface|Background of the unchecked circle. Inherited so a host-level|
|`--cngx-radio-indicator-border-width`|`1.5px`|Surface|Stroke width of the unchecked circle. Inherited so a host-level|
|`--cngx-radio-indicator-checked-color`|`oklch(0.66 0.19 50)`|State / Checked|Color applied to the circle border and the inner dot when the|
|`--cngx-radio-indicator-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied by `.cngx-radio-indicator--disabled`.|
|`--cngx-radio-indicator-transition`|`border-color 120ms ease,
      background-color 120ms ease`|Motion|Transition shorthand for the circle border and dot fade.|
|`--cngx-radio-indicator-size-sm`|`0.875em`|Variant / Size|Size token for the `.cngx-radio-indicator--sm` variant.|
|`--cngx-radio-indicator-size-md`|`1em`|Variant / Size|Size token for the `.cngx-radio-indicator--md` variant (default).|
|`--cngx-radio-indicator-size-lg`|`1.25em`|Variant / Size|Size token for the `.cngx-radio-indicator--lg` variant.|

## CngxReorderableMultiSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven,|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks|
|`--cngx-select-caret-size`|`1.25em`|Layout|Font-size of the dropdown caret glyph shared across every variant.|
|`--cngx-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled. Shared|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true`|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.6 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-bg`|`oklch(0.66 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Falls back|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.6 0.18 25)`|State / Error|Text color of every error surface. Falls back to|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-reorderable-multi-select-min-width`|`10rem`|Layout|Minimum inline size of the trigger.|
|`--cngx-reorderable-multi-select-gap`|`0.5rem`|Layout|Gap between the chip list, placeholder, caret, and clear button.|
|`--cngx-reorderable-multi-select-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of the trigger.|
|`--cngx-reorderable-multi-select-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the trigger.|
|`--cngx-reorderable-multi-select-radius`|`0.25rem`|Layout|Corner radius of the trigger.|
|`--cngx-reorderable-multi-select-bg`|`transparent`|Surface|Background of the trigger.|
|`--cngx-reorderable-multi-select-color`|`currentColor`|Surface|Text color of the trigger.|
|`--cngx-reorderable-multi-select-min-height`|`2.25rem`|Layout|Minimum block size of the trigger.|
|`--cngx-reorderable-multi-select-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand. Falls back to `--cngx-color-primary`.|
|`--cngx-reorderable-multi-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled.|
|`--cngx-reorderable-multi-select-clear-opacity`|`0.6`|State / Clear|Resting opacity of the clear-all button.|

## CngxRequired

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-field-required-color`|`oklch(0.55 0.21 27)`|State / Required|Color of the required-marker glyph. Falls back through|

## CngxSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven,|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks|
|`--cngx-select-caret-size`|`1.25em`|Layout|Font-size of the dropdown caret glyph shared across every variant.|
|`--cngx-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled. Shared|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true`|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.6 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-bg`|`oklch(0.66 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Falls back|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.6 0.18 25)`|State / Error|Text color of every error surface. Falls back to|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-min-width`|`10rem`|Layout|Minimum inline size of the trigger.|
|`--cngx-select-min-height`|`2.25rem`|Layout|Minimum block size of the trigger.|
|`--cngx-select-gap`|`0.5rem`|Layout|Gap between the label, caret, and clear button.|
|`--cngx-select-padding`|`0.5rem 0.75rem`|Layout|Padding shorthand of the trigger.|
|`--cngx-select-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the trigger.|
|`--cngx-select-radius`|`0.25rem`|Layout|Corner radius of the trigger.|
|`--cngx-select-bg`|`transparent`|Surface|Background of the trigger.|
|`--cngx-select-color`|`currentColor`|Surface|Text color of the trigger.|
|`--cngx-select-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand. Falls back to `--cngx-color-primary`.|
|`--cngx-select-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|

## CngxSelectShell

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven,|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks|
|`--cngx-select-caret-size`|`1.25em`|Layout|Font-size of the dropdown caret glyph shared across every variant.|
|`--cngx-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled. Shared|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true`|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.6 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-bg`|`oklch(0.66 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Falls back|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.6 0.18 25)`|State / Error|Text color of every error surface. Falls back to|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-select-shell-min-width`|`10rem`|Layout|Minimum inline size of the trigger.|
|`--cngx-select-shell-min-height`|`2.25rem`|Layout|Minimum block size of the trigger. Shared family default so the shell|
|`--cngx-select-shell-gap`|`0.5rem`|Layout|Gap between the label, caret, and clear button.|
|`--cngx-select-shell-padding`|`0.5rem 0.75rem`|Layout|Padding shorthand of the trigger.|
|`--cngx-select-shell-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the trigger.|
|`--cngx-select-shell-radius`|`0.25rem`|Layout|Corner radius of the trigger.|
|`--cngx-select-shell-bg`|`transparent`|Surface|Background of the trigger.|
|`--cngx-select-shell-color`|`currentColor`|Surface|Text color of the trigger.|
|`--cngx-select-shell-focus-outline`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand. Falls back to `--cngx-color-primary`.|
|`--cngx-select-shell-focus-ring`|`oklch(0.66 0.19 50)`|State / Focus|Focus-ring color used on the clear button's focus state.|
|`--cngx-select-shell-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled.|
|`--cngx-select-shell-label-gap`|`0.375rem`|Layout|Gap inside the label slot (between glyph and text).|
|`--cngx-select-shell-caret-opacity`|`0.7`|Surface|Opacity of the caret glyph.|
|`--cngx-select-shell-clear-opacity`|`0.6`|State / Clear|Resting opacity of the clear button.|

## CngxSidenav

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-sidenav-width`|`280px`|Layout|Default open-width of the rail.|
|`--cngx-sidenav-bg`|`oklch(0.97 0.005 250)`|Surface|Background of the rail surface.|
|`--cngx-sidenav-color`|`currentColor`|Surface|Text color of the rail. Defaults to `currentColor` so it inherits|
|`--cngx-sidenav-transition-duration`|`0.25s`|Motion|Duration of the open / close / mini transitions.|
|`--cngx-sidenav-transition-easing`|`ease`|Motion|Easing curve of the open / close / mini transitions.|
|`--cngx-sidenav-mini-width`|`56px`|Variant / Mini|Collapsed width in mini mode (icon-rail).|
|`--cngx-sidenav-expanded-shadow`|`4px 0 12px oklch(0 0 0 / 0.1)`|Variant / Mini|Drop-shadow applied when the mini-rail expands over content.|
|`--cngx-sidenav-border-width`|`1px`|Surface|Stroke width of the rail edge border.|
|`--cngx-sidenav-border-color`|`oklch(0.89 0 0)`|Surface|Stroke color of the rail edge border. Falls back through|
|`--cngx-sidenav-padding`|`16px`|Layout|Padding shorthand inside the header / footer slots.|
|`--cngx-sidenav-header-bg`|`transparent`|Surface|Background of the header slot.|
|`--cngx-sidenav-header-font-size`|`0.875rem`|Typography|Font-size of the header slot.|
|`--cngx-sidenav-footer-bg`|`transparent`|Surface|Background of the footer slot.|
|`--cngx-sidenav-footer-border-color`|`oklch(0.89 0 0)`|Surface|Border color of the footer divider. Falls back to the rail|
|`--cngx-sidenav-footer-font-size`|`0.75rem`|Typography|Font-size of the footer slot.|
|`--cngx-sidenav-resize-handle-width`|`4px`|Layout|Width of the drag-to-resize handle on the rail's edge.|
|`--cngx-sidenav-resize-handle-color`|`oklch(0.66 0.19 50)`|State / Resize|Color of the resize handle on hover / drag. Falls back to|
|`--cngx-sidenav-backdrop-bg`|`oklch(0 0 0)`|State / Over|Background of the mobile backdrop scrim.|
|`--cngx-sidenav-backdrop-opacity`|`0.5`|State / Over|Opacity of the mobile backdrop scrim.|
|`--cngx-nav-link-padding`|`10px 16px`|Layout|Padding shorthand of each nav link.|
|`--cngx-nav-link-font-size`|`0.875rem`|Typography|Font-size of each nav link.|
|`--cngx-nav-link-color`|`currentColor`|Surface|Text color of a resting nav link.|
|`--cngx-nav-link-radius`|`4px`|Layout|Corner radius of each nav link.|
|`--cngx-nav-link-hover-color`|`currentColor`|State / Hover|Text color on hover.|
|`--cngx-nav-link-hover-bg`|`oklch(0 0 0 / 0.04)`|State / Hover|Background tint on hover.|
|`--cngx-nav-link-active-color`|`currentColor`|State / Active|Text color of the active nav link.|
|`--cngx-nav-link-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the active nav link.|
|`--cngx-nav-link-active-font-weight`|`600`|State / Active|Font-weight of the active nav link.|
|`--cngx-nav-link-focus-outline-color`|`oklch(0.66 0.19 50)`|State / Focus|Outline color of the keyboard focus ring on a nav link. Falls|
|`--cngx-nav-link-focus-outline-width`|`2px`|State / Focus|Stroke width of the keyboard focus ring.|
|`--cngx-nav-link-focus-outline-offset`|`-2px`|State / Focus|Distance from the link edge to the focus ring. Negative offsets|
|`--cngx-nav-link-initial-size`|`0.875rem`|Variant / Mini|Font-size of the first-letter initial shown in mini mode (when|

## CngxSkeletonContainer

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-skeleton-bg`|`oklch(0.88 0 0)`|Surface|Base color of the shimmer gradient.|
|`--cngx-skeleton-shimmer-color`|`oklch(0.96 0 0)`|Surface|Highlight color that sweeps across the bone during the|
|`--cngx-skeleton-radius`|`4px`|Layout|Corner radius of the bone.|
|`--cngx-skeleton-shimmer-duration`|`1.5s`|Motion|Duration of one shimmer sweep.|

## CngxSparkline

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame.|

## CngxSpeakButton

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-speak-btn-size`|`36px`|Layout|Hit-target diameter of the button.|
|`--cngx-speak-btn-icon-size`|`18px`|Layout|Inner icon size.|
|`--cngx-speak-btn-radius`|`8px`|Layout|Corner radius.|
|`--cngx-speak-btn-border-width`|`1px`|Surface|Border width.|
|`--cngx-speak-btn-bg`|`oklch(1 0 0)`|Surface|Resting background. Falls back through `--cngx-color-surface`.|
|`--cngx-speak-btn-color`|`oklch(0.45 0 0)`|Surface|Resting icon color - muted.|
|`--cngx-speak-btn-transition`|`0.15s`|Motion|Transition duration for the state-color crossfade.|
|`--cngx-speak-btn-active-color`|`oklch(0.72 0.18 70)`|State / Active|Accent color of the speaking / hover state. Warm orange by|
|`--cngx-speak-btn-hover-bg`|`oklch(1 0 0)`|State / Hover|Background on hover.|
|`--cngx-speak-btn-speaking-color`|`oklch(1 0 0)`|State / Speaking|Icon color while actively speaking.|
|`--cngx-speak-btn-speaking-bg`|`oklch(0.72 0.18 70)`|State / Speaking|Background while actively speaking - filled with the orange|

## CngxStackedBar

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-chart-primary`|`oklch(0.66 0.19 50)`|Surface|Primary line / fill color shared by chart atoms. Falls back|
|`--cngx-chart-secondary`|`oklch(0.65 0.02 250)`|Surface|Secondary fill color for multi-series layers.|
|`--cngx-chart-danger`|`oklch(0.55 0.18 25)`|Variant / Danger|Danger-coded series color.|
|`--cngx-chart-success`|`oklch(0.55 0.15 145)`|Variant / Success|Success-coded series color.|
|`--cngx-chart-grid-color`|`oklch(0.92 0.005 250)`|Surface|Gridline color.|
|`--cngx-chart-axis-color`|`oklch(0.5 0.015 250)`|Surface|Axis stroke color.|
|`--cngx-chart-text-color`|`oklch(0.25 0.015 250)`|Typography|Axis / legend / annotation text color.|
|`--cngx-chart-aspect-ratio`|`5 / 2`|Layout|Default aspect ratio of the chart frame.|

## CngxStat

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-stat-gap`|`2px`|Layout|Vertical gap between the label, value row, and caption.|
|`--cngx-stat-row-gap`|`8px`|Layout|Horizontal gap between the value and the delta on the value row.|

## CngxStatus

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-status-gap`|`6px`|Layout|Gap between the tone dot and the status label.|
|`--cngx-status-dot-size`|`16px`|Layout|Diameter of the tone dot.|
|`--cngx-status-glyph-size`|`0.7em`|Typography|Font-size of the tone glyph inside the dot, relative to the dot.|
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
|`--cngx-step-gap`|`0.5rem`|Layout|Gap between adjacent steps and between a step's indicator / label|
|`--cngx-step-strip-padding`|`0.5rem 0`|Layout|Padding shorthand of the strip container.|
|`--cngx-step-padding`|`0.5rem 0.75rem`|Layout|Padding shorthand of an individual step button.|
|`--cngx-step-padding-inline`|`0.75rem`|Layout|Inline-axis padding of the step button - used by vertical|
|`--cngx-step-padding-compact`|`0.375rem 0.5rem`|Layout|Tightened panel padding for container-query collapse. Applied|
|`--cngx-step-disabled-opacity`|`0.55`|State / Disabled|Opacity multiplier for disabled steps.|
|`--cngx-step-focus-ring`|`2px solid oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline shorthand. Matches the cngx focus convention|
|`--cngx-step-focus-offset`|`3px`|State / Focus|Outline offset of the focus ring. Set to 3px so the ring sits|
|`--cngx-step-indicator-size`|`1.75rem`|Layout|Diameter of the indicator disc.|
|`--cngx-step-group-font-weight`|`600`|Typography|Font-weight of the group header.|
|`--cngx-step-group-indent`|`0.5rem`|Layout|Inline-start indent applied to nested steps and group headers.|
|`--cngx-step-badge-size`|`1.25rem`|State / Error|Hit-target diameter of the inline error badge.|
|`--cngx-step-error-badge-color`|`oklch(0.45 0.15 25)`|State / Error|Background color of the inline error badge.|
|`--cngx-step-error-badge-text-color`|`oklch(1 0 0)`|State / Error|Glyph color inside the error badge.|
|`--cngx-step-badge-font-size`|`0.75em`|State / Error|Font-size of the error-badge glyph.|
|`--cngx-step-badge-font-weight`|`700`|State / Error|Font-weight of the error-badge glyph.|
|`--cngx-step-rejection-outline-width`|`1px`|State / Rejected|Outline width of the persistent-rejection decoration.|
|`--cngx-step-rejection-outline-color`|`oklch(0.62 0.15 60)`|State / Rejected|Outline color of the persistent-rejection decoration.|
|`--cngx-step-rejection-outline-offset`|`2px`|State / Rejected|Outline offset of the persistent-rejection decoration.|
|`--cngx-step-rejection-bg`|`transparent`|State / Rejected|Background of the rejected step.|
|`--cngx-step-rejection-icon-size`|`1.25rem`|State / Rejected|Hit-target diameter of the persistent-rejection icon (`!` glyph).|
|`--cngx-step-rejection-icon-bg`|`oklch(0.62 0.15 60)`|State / Rejected|Background of the rejection icon disc.|
|`--cngx-step-rejection-icon-color`|`oklch(1 0 0)`|State / Rejected|Glyph color inside the rejection icon disc.|
|`--cngx-step-rejection-icon-font-size`|`0.75em`|State / Rejected|Font-size of the rejection icon glyph.|
|`--cngx-step-rejection-icon-font-weight`|`700`|State / Rejected|Font-weight of the rejection icon glyph.|
|`--cngx-step-distance`|`0`|Layout / Density|Distance of a step from the active one (`abs(index - active)`).|
|`--cngx-step-shrink-weight`|`20`|Layout / Density|Multiplier turning per-step distance into flex-shrink priority under|
|`--cngx-step-collapsed-min`|`3.25rem`|Layout / Density|Minimum width of a step under `density: 'auto'` - the floor a|
|`--cngx-step-collapsed-label-min`|`2ch`|Layout / Density|Minimum label width for non-active steps on label-only skins (no|
|`--cngx-step-active-label-min`|`4rem`|Layout / Density|Guaranteed minimum label width for the active step, regardless of|
|`--cngx-step-active-label-max`|`60cqi`|Layout / Density|Maximum width of the active label, in container-query units, so a very|
|`--cngx-stepper-group-chip-padding`|`0.125rem 0.5rem`|Group chip|Padding shorthand of a group-header chip. `inherits: true` so a value|
|`--cngx-stepper-group-chip-border-width`|`1px`|Group chip|Border width of a group-header chip.|
|`--cngx-stepper-group-chip-radius`|`999px`|Group chip|Corner radius of a group-header chip (pill by default).|
|`--cngx-stepper-group-chip-font-size`|`0.8125em`|Group chip|Font-size of a group-header chip - smaller than the step labels so it|
|`--cngx-stepper-group-chip-line-height`|`1.25`|Group chip|Line-height of a group-header chip; drives the chip's height together|
|`--cngx-step-color`|`currentColor`|Surface|Default text color inherited by step labels.|
|`--cngx-step-bg`|`transparent`|Surface|Default background of the stepper root.|
|`--cngx-step-indicator-bg`|`color-mix(in srgb, currentColor 10%, transparent)`|State / Resting|Background of the indicator disc at rest - soft tint of the|
|`--cngx-step-indicator-color`|`currentColor`|State / Resting|Glyph color inside the indicator disc.|
|`--cngx-step-indicator-font-size`|`0.85em`|Typography|Font-size of the indicator glyph.|
|`--cngx-step-indicator-font-weight`|`600`|Typography|Font-weight of the indicator glyph.|
|`--cngx-step-indicator-active-color`|`oklch(1 0 0)`|State / Active|Glyph color used by the active / completed / errored states|
|`--cngx-step-indicator-disabled-bg`|`color-mix(in srgb, currentColor 5%, transparent)`|State / Disabled|Background of the disabled indicator disc.|
|`--cngx-step-completed-color`|`oklch(0.5 0.15 145)`|State / Completed|Background of the completed indicator disc. Falls back to|
|`--cngx-step-errored-color`|`oklch(0.45 0.15 25)`|State / Error|Background of the errored indicator disc. Falls back to|
|`--cngx-step-active-fill`|`oklch(0.66 0.19 50)`|State / Active|Resolved fill of the active indicator disc. Defaults to the|
|`--cngx-step-hover-bg`|`color-mix(in srgb, currentColor 8%, transparent)`|State / Hover|Background tint applied on hover of an enabled step.|
|`--cngx-step-busy-spinner-size`|`0.875rem`|State / Pending|Diameter of the busy spinner ring next to the active step.|
|`--cngx-step-busy-spinner-color`|`currentColor`|State / Pending|Stroke color of the busy spinner ring.|
|`--cngx-stepper-group-chip-border`|`color-mix(in srgb, currentColor 22%, transparent)`|Group chip|Border color of a resting group-header chip. Defaults to a faint|
|`--cngx-stepper-group-chip-bg`|`color-mix(in srgb, currentColor 6%, transparent)`|Group chip|Background of a resting group-header chip.|
|`--cngx-stepper-group-chip-color`|`currentColor`|Group chip|Label color of a resting group-header chip. Tracks the inherited|
|`--cngx-stepper-group-chip-active-border`|`var(--cngx-color-primary)`|Group chip|Border color of the active-branch chip (the group owning the current|
|`--cngx-stepper-group-chip-active-bg`|`color-mix(in srgb, var(--cngx-color-primary) 14%, transparent)`|Group chip|Background of the active-branch chip. See|
|`--cngx-stepper-group-chip-active-color`|`var(--cngx-color-primary)`|Group chip|Label color of the active-branch chip.|
|`--cngx-step-linear-dot-fill`|`oklch(0.66 0.19 50)`|Skin / linear-minimal|Fill of the active dot in the linear-minimal skin. Falls back to|
|`--cngx-step-status-pill-bg-upcoming`|`color-mix(in srgb, currentColor 6%, transparent)`|Skin / stripe-status-rich|Background of the status pill on the `stripe-status-rich` skin|
|`--cngx-step-status-pill-bg-in-progress`|`oklch(0.66 0.19 50)`|Skin / stripe-status-rich|Background of the status pill while the step is active /|
|`--cngx-step-status-pill-bg-done`|`oklch(0.5 0.15 145)`|Skin / stripe-status-rich|Background of the status pill once the step is completed.|
|`--cngx-step-status-pill-bg-errored`|`oklch(0.45 0.15 25)`|Skin / stripe-status-rich|Background of the status pill when the step is errored.|
|`--cngx-step-status-pill-color`|`oklch(1 0 0)`|Skin / stripe-status-rich|Text color of the status pill on the active / completed / errored|
|`--cngx-step-status-pill-padding`|`0.125rem 0.5rem`|Skin / stripe-status-rich|Padding shorthand of the status pill. Derived from the global scale at|
|`--cngx-step-chevron-tile-active`|`oklch(0.66 0.19 50)`|Skin / path-chevron|Fill of the chevron tile while the step is active on the|
|`--cngx-step-chevron-tile-completed`|`color-mix(in srgb, oklch(0.5 0.15 145) 80%, transparent)`|Skin / path-chevron|Fill of the chevron tile once the step is completed.|
|`--cngx-step-chevron-tile-errored`|`oklch(0.45 0.15 25)`|Skin / path-chevron|Fill of the chevron tile when the step is errored.|
|`--cngx-step-chevron-tile-upcoming-bg`|`color-mix(in srgb, currentColor 12%, transparent)`|Skin / path-chevron|Fill of the upcoming chevron tile - soft surface tint so the|
|`--cngx-step-chevron-tile-color`|`oklch(1 0 0)`|Skin / path-chevron|Text color of the chevron tile in the filled (active / completed|
|`--cngx-step-pill-radius`|`999px`|Skin / pill-segment|Border-radius of the `pill-segment` skin container - rounds the|
|`--cngx-step-pill-segment-rail-bg`|`color-mix(in srgb, currentColor 6%, transparent)`|Skin / pill-segment|Rail background of the `pill-segment` skin - soft surface tint|
|`--cngx-step-pill-segment-fill-active`|`oklch(1 0 0)`|Skin / pill-segment|Active card surface on the `pill-segment` skin - rendered as a|
|`--cngx-step-pill-segment-fill-completed`|`transparent`|Skin / pill-segment|Optional completed-segment tint. Unset by default - the green check|
|`--cngx-step-pill-segment-card-shadow`|`0 1px 2px color-mix(in srgb, currentColor 12%, transparent),
      0 1px 1px color-mix(in srgb, currentColor 8%, transparent)`|Skin / pill-segment|Shadow on the active card in the `pill-segment` skin. Inherits so|
|`--cngx-step-connector-color`|`color-mix(in srgb, currentColor 35%, transparent)`|Skin / classic|Muted color of an upcoming connector segment on the classic skin|
|`--cngx-step-connector-completed-color`|`oklch(0.5 0.15 145)`|Skin / classic|Accent color of a completed connector segment on the classic skin|
|`--cngx-step-connector-errored-color`|`oklch(0.55 0.18 25)`|Skin / classic|Errored color of a connector segment whose preceding step is in|
|`--cngx-step-connector-pending-color`|`oklch(0.66 0.19 50)`|Skin / classic|In-flight color of a connector segment whose preceding step is in|
|`--cngx-step-connector-inset`|`6px`|Skin / classic|Symmetric breathing room between each disc edge and the connector|
|`--cngx-step-connector-width`|`2px`|Skin / classic|Thickness of the connector segment on the classic skin with|
|`--cngx-step-chips-gap`|`0.5rem`|Skin / chips|Gap between the standalone pills of the `chips` skin.|
|`--cngx-step-chips-radius`|`999px`|Skin / chips|Corner radius of each pill in the `chips` skin (default fully round).|
|`--cngx-step-chips-padding-inline`|`0.875rem`|Skin / chips|Inline padding inside each pill in the `chips` skin.|
|`--cngx-step-chips-padding-block`|`0.4rem`|Skin / chips|Block padding inside each pill in the `chips` skin.|
|`--cngx-step-chips-bg`|`color-mix(in srgb, currentColor 8%, transparent)`|Skin / chips|Inactive pill surface in the `chips` skin - a soft neutral tint.|
|`--cngx-step-chips-color`|`color-mix(in srgb, currentColor 65%, transparent)`|Skin / chips|Inactive pill label colour in the `chips` skin - muted vs the active|
|`--cngx-step-chips-color-active`|`oklch(1 0 0)`|Skin / chips|Active pill label colour in the `chips` skin - the contrast tone on|
|`--cngx-step-chips-bg-completed`|`color-mix(in srgb, oklch(0.5 0.15 145) 12%, transparent)`|Skin / chips|Completed chip surface in the `chips` skin - a soft success tint.|
|`--cngx-step-chips-color-completed`|`oklch(0.5 0.15 145)`|Skin / chips|Completed chip label + check colour in the `chips` skin. Inherits so|
|`--cngx-step-breadcrumb-gap`|`0.5rem`|Skin / breadcrumb|Gap between breadcrumb items (and the chevron separator inset) in|
|`--cngx-step-breadcrumb-radius`|`6px`|Skin / breadcrumb|Corner radius of the active-item pill in the `breadcrumb` skin.|
|`--cngx-step-breadcrumb-color`|`color-mix(in srgb, currentColor 48%, transparent)`|Skin / breadcrumb|Upcoming-item label colour in the `breadcrumb` skin - muted vs the|
|`--cngx-step-breadcrumb-color-active`|`color-mix(in srgb, currentColor 92%, transparent)`|Skin / breadcrumb|Active-item label colour in the `breadcrumb` skin - full strength.|
|`--cngx-step-breadcrumb-color-completed`|`color-mix(in srgb, currentColor 82%, transparent)`|Skin / breadcrumb|Completed-item label colour in the `breadcrumb` skin. Inherits so|
|`--cngx-step-breadcrumb-fill-active`|`color-mix(in srgb, currentColor 9%, transparent)`|Skin / breadcrumb|Active-item pill surface in the `breadcrumb` skin - the soft tint|
|`--cngx-step-breadcrumb-check-color`|`oklch(0.5 0.15 145)`|Skin / breadcrumb|Completed-item check colour in the `breadcrumb` skin. Inherits so|

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
|`--cngx-stepper-footer-border-color`|`#e0e0e0`|Border|Color of the top divider rule. The Material bridge maps this to|
|`--cngx-stepper-footer-center-basis`|`auto`|Layout|Flex-basis of the center region.|
|`--cngx-stepper-footer-center-color`|`inherit`|Color|Text color of the center region. Unset it inherits the surrounding|

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
|`--cngx-tab-active-indicator-color`|`oklch(0.66 0.19 50)`|State / Active|Underline color of the active tab - a 2px box-shadow inset stripe along the inline-end edge of the tab button. \|
|`--cngx-tab-active-indicator-width`|`2px`|State / Active|Thickness of the active-tab underline indicator.|
|`--cngx-tab-disabled-opacity`|`0.55`|State / Disabled|Opacity multiplier applied to disabled tabs.|
|`--cngx-tab-focus-ring`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand.|
|`--cngx-tab-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-tab-error-badge-color`|`oklch(0.45 0.15 25)`|State / Error|Background color of the inline error badge. `inherits: true` so a|
|`--cngx-tab-busy-spinner-size`|`1rem`|State / Busy|Diameter of the busy spinner shown while a tab's commit is|
|`--cngx-tab-busy-spinner-color`|`currentColor`|State / Busy|Stroke color of the busy spinner.|
|`--cngx-tab-rejection-icon-size`|`1.25rem`|State / Rejected|Diameter of the persistent rejection icon (`!` glyph in a circle).|
|`--cngx-tab-rejection-icon-color`|`oklch(0.45 0.15 25)`|State / Rejected|Background color of the rejection icon disc. `inherits: true` so the|
|`--cngx-tab-rejection-icon-text`|`oklch(1 0 0)`|State / Rejected|Text color of the rejection icon glyph.|
|`--cngx-tab-rejection-icon-font-size`|`0.875rem`|State / Rejected|Font-size of the rejection icon glyph.|
|`--cngx-tab-rejected-bg`|`oklch(0.45 0.15 25 / 0.1)`|State / Rejected|Background wash of a rejected tab - a soft danger tint that settles in|
|`--cngx-tab-rejected-radius`|`6px`|State / Rejected|Corner radius of the rejected-tab wash, so the tint reads as a soft|
|`--cngx-tab-rejected-accent-width`|`2px`|State / Rejected|Thickness of the rejected tab's bottom accent bar - echoes the active|
|`--cngx-tab-rejected-outline`|`none`|State / Rejected|Outline shorthand of the rejected tab. `none` by default - the wash plus|
|`--cngx-tab-rejected-outline-offset`|`1px`|State / Rejected|Outline offset of the rejected-tab outline.|
|`--cngx-tab-rejected-pulse-duration`|`600ms`|State / Rejected|Duration of the rejected-tab pulse animation.|
|`--cngx-tab-rejected-pulse-bg`|`oklch(0.45 0.15 25 / 0.18)`|State / Rejected|Background tint used at the peak of the pulse animation.|
|`--cngx-tab-affordance-size`|`1.25rem`|State / Dismissable|Hit-target size of a tab's close button and the add-tab button.|
|`--cngx-tab-affordance-radius`|`50%`|State / Dismissable|Corner radius of the close / add affordance buttons.|
|`--cngx-tab-affordance-hover-bg`|`color-mix(in oklch, currentColor 14%, transparent)`|State / Dismissable|Hover/focus fill of the close / add affordance buttons. Defaults to|
|`--cngx-tab-label-line-height`|`1.4`|Layout|Line height of the primary label line. Also drives the leading|
|`--cngx-tab-sublabel-font-size`|`0.8125rem`|Layout|Font size of a tab's optional secondary label line. `inherits:|
|`--cngx-tab-sublabel-color`|`color-mix(in oklab, currentColor 65%, transparent)`|Surface|Text color of a tab's optional secondary label line. Defaults to|
|`--cngx-tab-strip-border`|`1px solid oklch(0.87 0 0)`|Surface|Border shorthand of the tab strip's bottom (or inline-end for|
|`--cngx-tab-indicator-thickness`|`2px`|Surface|Thickness of the active-tab ink-bar indicator.|
|`--cngx-tab-transition-duration`|`0.15s`|Motion|Transition duration for color + border-color crossfade on hover|
|`--cngx-tab-hover-color`|`currentColor`|State / Hover|Text color of the hover state.|
|`--cngx-tab-active-indicator-color`|`currentColor`|State / Active|Color of the ink-bar indicator under the active tab.|
|`--cngx-tab-badge-size`|`1.25rem`|State / Error|Hit-target diameter of the per-tab error badge.|
|`--cngx-tab-error-badge-text-color`|`oklch(1 0 0)`|State / Error|Text color of the error-badge glyph.|
|`--cngx-tab-badge-font-size`|`0.75em`|State / Error|Font-size of the error-badge glyph.|
|`--cngx-tab-badge-font-weight`|`700`|State / Error|Font-weight of the error-badge glyph.|
|`--cngx-tab-radius`|`0.5rem`|Skin|Corner radius of the contained / pill skin surfaces. Ignored by the|
|`--cngx-tab-active-bg`|`oklch(1 0 0)`|Skin|Surface that the active tab fuses with under the `contained` skin|
|`--cngx-tab-inactive-bg`|`oklch(0.97 0 0)`|Skin|Resting-tab surface under the `contained` skin - kept visibly set|
|`--cngx-tab-surface-border-color`|`oklch(0.87 0 0)`|Skin|Border color of the contained skin's tab + panel box.|
|`--cngx-tab-surface-border-width`|`1px`|Skin|Border width of the contained skin's tab + panel box. Drives both|
|`--cngx-tab-pill-active-color`|`currentColor`|Skin|Text color of the active pill (paints against `--cngx-tab-active-bg`).|
|`--cngx-tab-pill-hover-bg`|`oklch(0.95 0 0)`|Skin|Resting-pill hover fill under the `pill` skin.|
|`--cngx-tab-segmented-track-bg`|`oklch(0.96 0 0)`|Skin|Muted track the tabs sit in under the `segmented` skin.|
|`--cngx-tab-segmented-hover-bg`|`oklch(0.93 0 0)`|Skin|Resting-tab hover fill under the `segmented` skin - a faint lift off|
|`--cngx-tab-segmented-active-shadow`|`0 1px 2px oklch(0 0 0 / 0.06)`|Skin|Drop shadow that raises the active tab off the track under the|
|`--cngx-tab-pill-outline-color`|`oklch(0.66 0.19 50)`|Skin|Accent color of the `pill-outline` skin - paints the active tab's|
|`--cngx-tab-pill-outline-bg`|`color-mix(in oklch, oklch(0.66 0.19 50) 12%, transparent)`|Skin|Tinted fill behind the active tab under the `pill-outline` skin.|
|`--cngx-tab-pill-radius`|`100px`|Skin|Corner radius of the `pill` / `pill-outline` skins - a full pill|
|`--cngx-tab-contained-accent-color`|`oklch(0.66 0.19 50)`|Skin|Color of the `contained` skin's top (inline-start for vertical)|
|`--cngx-tab-contained-accent-thickness`|`3px`|Skin|Thickness of the `contained` skin's active-tab accent bar.|

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
|`--cngx-tab-active-indicator-color`|`oklch(0.66 0.19 50)`|State / Active|Underline color of the active tab - a 2px box-shadow inset stripe along the inline-end edge of the tab button. \|
|`--cngx-tab-active-indicator-width`|`2px`|State / Active|Thickness of the active-tab underline indicator.|
|`--cngx-tab-disabled-opacity`|`0.55`|State / Disabled|Opacity multiplier applied to disabled tabs.|
|`--cngx-tab-focus-ring`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand.|
|`--cngx-tab-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-tab-error-badge-color`|`oklch(0.45 0.15 25)`|State / Error|Background color of the inline error badge. `inherits: true` so a|
|`--cngx-tab-busy-spinner-size`|`1rem`|State / Busy|Diameter of the busy spinner shown while a tab's commit is|
|`--cngx-tab-busy-spinner-color`|`currentColor`|State / Busy|Stroke color of the busy spinner.|
|`--cngx-tab-rejection-icon-size`|`1.25rem`|State / Rejected|Diameter of the persistent rejection icon (`!` glyph in a circle).|
|`--cngx-tab-rejection-icon-color`|`oklch(0.45 0.15 25)`|State / Rejected|Background color of the rejection icon disc. `inherits: true` so the|
|`--cngx-tab-rejection-icon-text`|`oklch(1 0 0)`|State / Rejected|Text color of the rejection icon glyph.|
|`--cngx-tab-rejection-icon-font-size`|`0.875rem`|State / Rejected|Font-size of the rejection icon glyph.|
|`--cngx-tab-rejected-bg`|`oklch(0.45 0.15 25 / 0.1)`|State / Rejected|Background wash of a rejected tab - a soft danger tint that settles in|
|`--cngx-tab-rejected-radius`|`6px`|State / Rejected|Corner radius of the rejected-tab wash, so the tint reads as a soft|
|`--cngx-tab-rejected-accent-width`|`2px`|State / Rejected|Thickness of the rejected tab's bottom accent bar - echoes the active|
|`--cngx-tab-rejected-outline`|`none`|State / Rejected|Outline shorthand of the rejected tab. `none` by default - the wash plus|
|`--cngx-tab-rejected-outline-offset`|`1px`|State / Rejected|Outline offset of the rejected-tab outline.|
|`--cngx-tab-rejected-pulse-duration`|`600ms`|State / Rejected|Duration of the rejected-tab pulse animation.|
|`--cngx-tab-rejected-pulse-bg`|`oklch(0.45 0.15 25 / 0.18)`|State / Rejected|Background tint used at the peak of the pulse animation.|
|`--cngx-tab-affordance-size`|`1.25rem`|State / Dismissable|Hit-target size of a tab's close button and the add-tab button.|
|`--cngx-tab-affordance-radius`|`50%`|State / Dismissable|Corner radius of the close / add affordance buttons.|
|`--cngx-tab-affordance-hover-bg`|`color-mix(in oklch, currentColor 14%, transparent)`|State / Dismissable|Hover/focus fill of the close / add affordance buttons. Defaults to|
|`--cngx-tab-label-line-height`|`1.4`|Layout|Line height of the primary label line. Also drives the leading|
|`--cngx-tab-sublabel-font-size`|`0.8125rem`|Layout|Font size of a tab's optional secondary label line. `inherits:|
|`--cngx-tab-sublabel-color`|`color-mix(in oklab, currentColor 65%, transparent)`|Surface|Text color of a tab's optional secondary label line. Defaults to|

## CngxTabOverflow

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-tab-overflow-bg`|`transparent`|Surface|Background of the overflow wrapper. Falls back through|
|`--cngx-tab-overflow-button-bg`|`transparent`|Surface|Background of the trigger button.|
|`--cngx-tab-overflow-button-radius`|`0.25rem`|Layout|Corner radius of the trigger button.|
|`--cngx-tab-overflow-popover-min-width`|`12rem`|Layout|Minimum inline size of the popover panel.|
|`--cngx-tab-overflow-popover-max-height`|`16rem`|Layout|Maximum block size of the popover panel before vertical|
|`--cngx-tab-overflow-popover-bg`|`oklch(1 0 0)`|Surface|Background of the popover panel.|
|`--cngx-tab-overflow-popover-border`|`1px solid currentColor`|Surface|Border shorthand of the popover panel.|
|`--cngx-tab-overflow-popover-radius`|`0.25rem`|Layout|Corner radius of the popover panel.|
|`--cngx-tab-overflow-popover-padding`|`0.25rem 0`|Layout|Padding shorthand of the popover panel.|
|`--cngx-tab-overflow-item-padding`|`0.5rem 0.75rem`|Layout|Padding shorthand of each list item.|
|`--cngx-tab-overflow-item-hover-bg`|`oklch(0 0 0 / 0.05)`|State / Hover|Background of the item hover state.|
|`--cngx-tab-overflow-item-active-bg`|`oklch(0 0 0 / 0.08)`|State / Active|Background of the AD-active item - APG combobox pattern|
|`--cngx-tab-overflow-item-active-outline`|`2px solid currentColor`|State / Active|Outline shorthand applied to the AD-active item.|
|`--cngx-tab-overflow-item-active-outline-offset`|`-2px`|State / Active|Outline offset of the AD-active item.|

## CngxTag

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-tag-radius`|`4px`|Layout|Corner radius. Defaults to `--cngx-radius-sm` so tags read as|
|`--cngx-tag-font-weight`|`500`|Typography|Font-weight of the tag label.|
|`--cngx-tag-bg`|`transparent`|Surface|Background. Defaults to transparent; variant + color combinations|
|`--cngx-tag-color`|`currentColor`|Surface|Text color. Defaults to `currentColor`.|
|`--cngx-tag-border`|`1px solid transparent`|Surface|Border shorthand. Variant + color combinations override per|
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
|`--cngx-tag-group-stack-gap`|`8px`|Layout|Vertical gap between the three group zones (header / row /|
|`--cngx-tag-group-gap`|`8px`|Layout|Horizontal gap between tags in the row when no density modifier|
|`--cngx-tag-group-gap-xs`|`4px`|Variant / Density|Horizontal gap for the `.cngx-tag-group--gap-xs` density modifier.|
|`--cngx-tag-group-gap-md`|`12px`|Variant / Density|Horizontal gap for the `.cngx-tag-group--gap-md` density modifier.|

## CngxTimeline

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-timeline-item-gap`|`16px`|Layout|Vertical gap between consecutive rows inside one group.|
|`--cngx-timeline-group-gap`|`24px`|Layout|Vertical gap between two groups.|
|`--cngx-timeline-surface-padding`|`4px`|Layout|Padding around the organism's own surfaces - empty, error, refreshing|
|`--cngx-timeline-skeleton-line-size`|`12px`|Layout|Height of one placeholder bar in the loading body. Deliberately outside|

## CngxTimelineConnector

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-timeline-rail-inset`|`6px`|Layout|Distance the rail is pulled back from the edge of the marker cell so|
|`--cngx-timeline-marker-size`|`12px`|Layout|Diameter of the marker dot.|
|`--cngx-timeline-marker-glyph-size`|`60%`|Layout|Size of a bare `svg` glyph projected into the marker, as a share of the|
|`--cngx-timeline-item-inline-size`|`192px`|Layout|Width of one row on the horizontal axis. Ignored in the vertical|
|`--cngx-timeline-connector-width`|`2px`|Layout|Thickness of the connector rail.|
|`--cngx-timeline-marker-ring-width`|`3px`|Layout|Width of the halo ring drawn around a marker in the `active` status.|
|`--cngx-timeline-connector-color`|`oklch(0.88 0.005 250)`|Surface|Colour of the connector rail in its default (unstated) status.|
|`--cngx-timeline-surface`|`oklch(1 0 0)`|Surface|Background the marker is punched out of, so a coloured rail passing|
|`--cngx-timeline-marker-fg`|`oklch(1 0 0)`|Typography|Foreground colour of a glyph projected into the marker.|
|`--cngx-timeline-meta-size`|`0.8125rem`|Typography|Font size for secondary text across the family - timestamps, inline|
|`--cngx-timeline-text-color`|`oklch(0.2 0.01 250)`|Typography|Primary text colour inside an item.|
|`--cngx-timeline-muted-color`|`oklch(0.5 0.01 250)`|Typography|Secondary text colour - timestamps, group headers, the refreshing tail.|
|`--cngx-timeline-done-color`|`oklch(0.6 0.15 145)`|Variant / Done|Marker and rail colour for the `done` status.|
|`--cngx-timeline-active-color`|`oklch(0.66 0.19 50)`|Variant / Active|Marker and rail colour for the `active` status.|
|`--cngx-timeline-upcoming-color`|`oklch(0.5 0.01 250)`|Variant / Upcoming|Marker and rail colour for the `upcoming` status. Pairs with a dashed|
|`--cngx-timeline-rejected-color`|`oklch(0.6 0.18 25)`|Variant / Rejected|Marker and rail colour for the `rejected` status, and for an item|
|`--cngx-timeline-pulse-duration`|`1.6s`|Motion|Period of the busy pulse on a marker. Set to `0s` to stop it without|

## CngxTimelineItem

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-timeline-rail-inset`|`6px`|Layout|Distance the rail is pulled back from the edge of the marker cell so|
|`--cngx-timeline-marker-size`|`12px`|Layout|Diameter of the marker dot.|
|`--cngx-timeline-marker-glyph-size`|`60%`|Layout|Size of a bare `svg` glyph projected into the marker, as a share of the|
|`--cngx-timeline-item-inline-size`|`192px`|Layout|Width of one row on the horizontal axis. Ignored in the vertical|
|`--cngx-timeline-connector-width`|`2px`|Layout|Thickness of the connector rail.|
|`--cngx-timeline-marker-ring-width`|`3px`|Layout|Width of the halo ring drawn around a marker in the `active` status.|
|`--cngx-timeline-connector-color`|`oklch(0.88 0.005 250)`|Surface|Colour of the connector rail in its default (unstated) status.|
|`--cngx-timeline-surface`|`oklch(1 0 0)`|Surface|Background the marker is punched out of, so a coloured rail passing|
|`--cngx-timeline-marker-fg`|`oklch(1 0 0)`|Typography|Foreground colour of a glyph projected into the marker.|
|`--cngx-timeline-meta-size`|`0.8125rem`|Typography|Font size for secondary text across the family - timestamps, inline|
|`--cngx-timeline-text-color`|`oklch(0.2 0.01 250)`|Typography|Primary text colour inside an item.|
|`--cngx-timeline-muted-color`|`oklch(0.5 0.01 250)`|Typography|Secondary text colour - timestamps, group headers, the refreshing tail.|
|`--cngx-timeline-done-color`|`oklch(0.6 0.15 145)`|Variant / Done|Marker and rail colour for the `done` status.|
|`--cngx-timeline-active-color`|`oklch(0.66 0.19 50)`|Variant / Active|Marker and rail colour for the `active` status.|
|`--cngx-timeline-upcoming-color`|`oklch(0.5 0.01 250)`|Variant / Upcoming|Marker and rail colour for the `upcoming` status. Pairs with a dashed|
|`--cngx-timeline-rejected-color`|`oklch(0.6 0.18 25)`|Variant / Rejected|Marker and rail colour for the `rejected` status, and for an item|
|`--cngx-timeline-pulse-duration`|`1.6s`|Motion|Period of the busy pulse on a marker. Set to `0s` to stop it without|
|`--cngx-timeline-gap`|`8px`|Layout|Column gap between the marker track and the content.|
|`--cngx-timeline-row-gap`|`4px`|Layout|Row gap inside one item, between the timestamp and the body.|
|`--cngx-timeline-content-padding`|`4px`|Layout|Padding around an item's projected body.|

## CngxTimelineMarker

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-timeline-rail-inset`|`6px`|Layout|Distance the rail is pulled back from the edge of the marker cell so|
|`--cngx-timeline-marker-size`|`12px`|Layout|Diameter of the marker dot.|
|`--cngx-timeline-marker-glyph-size`|`60%`|Layout|Size of a bare `svg` glyph projected into the marker, as a share of the|
|`--cngx-timeline-item-inline-size`|`192px`|Layout|Width of one row on the horizontal axis. Ignored in the vertical|
|`--cngx-timeline-connector-width`|`2px`|Layout|Thickness of the connector rail.|
|`--cngx-timeline-marker-ring-width`|`3px`|Layout|Width of the halo ring drawn around a marker in the `active` status.|
|`--cngx-timeline-connector-color`|`oklch(0.88 0.005 250)`|Surface|Colour of the connector rail in its default (unstated) status.|
|`--cngx-timeline-surface`|`oklch(1 0 0)`|Surface|Background the marker is punched out of, so a coloured rail passing|
|`--cngx-timeline-marker-fg`|`oklch(1 0 0)`|Typography|Foreground colour of a glyph projected into the marker.|
|`--cngx-timeline-meta-size`|`0.8125rem`|Typography|Font size for secondary text across the family - timestamps, inline|
|`--cngx-timeline-text-color`|`oklch(0.2 0.01 250)`|Typography|Primary text colour inside an item.|
|`--cngx-timeline-muted-color`|`oklch(0.5 0.01 250)`|Typography|Secondary text colour - timestamps, group headers, the refreshing tail.|
|`--cngx-timeline-done-color`|`oklch(0.6 0.15 145)`|Variant / Done|Marker and rail colour for the `done` status.|
|`--cngx-timeline-active-color`|`oklch(0.66 0.19 50)`|Variant / Active|Marker and rail colour for the `active` status.|
|`--cngx-timeline-upcoming-color`|`oklch(0.5 0.01 250)`|Variant / Upcoming|Marker and rail colour for the `upcoming` status. Pairs with a dashed|
|`--cngx-timeline-rejected-color`|`oklch(0.6 0.18 25)`|Variant / Rejected|Marker and rail colour for the `rejected` status, and for an item|
|`--cngx-timeline-pulse-duration`|`1.6s`|Motion|Period of the busy pulse on a marker. Set to `0s` to stop it without|

## CngxToastOutlet

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-toast-z-index`|`9999`|Layout|Stacking-context order - high so toasts overlay dialogs / popovers.|
|`--cngx-toast-gap`|`8px`|Layout|Vertical gap between stacked toasts.|
|`--cngx-toast-outlet-padding`|`16px`|Layout|Outer padding around the toast outlet (viewport offset).|
|`--cngx-toast-max-width`|`420px`|Layout|Maximum inline size of each toast - caps long messages.|
|`--cngx-toast-inner-gap`|`10px`|Layout|Gap between icon, body, and dismiss button inside a toast.|
|`--cngx-toast-padding`|`12px 16px`|Layout|Padding shorthand inside each toast.|
|`--cngx-toast-border-radius`|`8px`|Layout|Corner radius of each toast.|
|`--cngx-toast-bg`|`oklch(1 0 0)`|Surface|Background of each toast.|
|`--cngx-toast-color`|`oklch(0.25 0.015 250)`|Surface|Text color of each toast.|
|`--cngx-toast-shadow`|`0 4px 12px oklch(0 0 0 / 0.15)`|Surface|Drop-shadow of each toast.|
|`--cngx-toast-enter-duration`|`200ms`|Motion|Duration of the enter animation.|
|`--cngx-toast-enter-easing`|`ease-out`|Motion|Easing curve of the enter animation.|
|`--cngx-toast-accent-width`|`3px`|Surface|Width of the leading-edge severity stripe.|
|`--cngx-toast-info-accent`|`oklch(0.62 0.2 250)`|Variant / Info|Severity stripe of the info variant.|
|`--cngx-toast-success-accent`|`oklch(0.65 0.15 145)`|Variant / Success|Severity stripe of the success variant.|
|`--cngx-toast-warning-accent`|`oklch(0.72 0.18 70)`|Variant / Warning|Severity stripe of the warning variant.|
|`--cngx-toast-error-accent`|`oklch(0.62 0.22 25)`|Variant / Error|Severity stripe of the error variant.|
|`--cngx-toast-icon-size`|`20px`|Layout|Default icon size when no custom icon is projected.|
|`--cngx-toast-font-size`|`0.875rem`|Typography|Font-size of the toast body text.|
|`--cngx-toast-line-height`|`1.5`|Typography|Line-height of the toast body text.|
|`--cngx-toast-title-font-weight`|`600`|Typography|Font-weight of the title slot.|
|`--cngx-toast-title-font-size`|`0.875rem`|Typography|Font-size of the title slot.|
|`--cngx-toast-title-color`|`currentColor`|Typography|Color of the title slot.|
|`--cngx-toast-description-max-lines`|`3`|Typography|Maximum number of lines for the description slot before|
|`--cngx-toast-description-font-size`|`0.8125rem`|Typography|Font-size of the description slot.|
|`--cngx-toast-description-color`|`oklch(0.5 0.01 250)`|Typography|Text color of the description slot.|
|`--cngx-toast-description-line-height`|`1.4`|Typography|Line-height of the description slot.|
|`--cngx-toast-count-opacity`|`0.6`|State / Overflow|Opacity of the trailing message-count badge.|
|`--cngx-toast-action-padding`|`4px 0`|Layout|Padding shorthand of the inline action button.|
|`--cngx-toast-action-weight`|`600`|Typography|Font-weight of the inline action button.|
|`--cngx-toast-action-size`|`0.8125rem`|Typography|Font-size of the inline action button.|

## CngxToggle

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-toggle-gap`|`0.5rem`|Layout|Gap between the track and the label slot. Falls back to|
|`--cngx-toggle-color`|`currentColor`|Surface|Text color of the host shell. Defaults to `currentColor`.|
|`--cngx-toggle-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied by `.cngx-toggle--disabled`.|
|`--cngx-toggle-focus-outline`|`2px solid currentColor`|State / Focus|Focus-ring outline shorthand.|
|`--cngx-toggle-focus-offset`|`2px`|State / Focus|Outline offset of the focus ring.|
|`--cngx-toggle-focus-radius`|`0.25rem`|State / Focus|Corner radius applied while focused.|
|`--cngx-toggle-transition`|`150ms ease`|Motion|Transition duration + easing for the track/thumb animation.|
|`--cngx-toggle-track-width`|`2.25rem`|Layout|Width of the track pill.|
|`--cngx-toggle-track-height`|`1.25rem`|Layout|Height of the track pill.|
|`--cngx-toggle-track-radius`|`9999px`|Layout|Corner radius of the track. Defaults to a full pill.|
|`--cngx-toggle-track-bg-off`|`oklch(0 0 0 / 0.25)`|State / Off|Background of the off-state track - neutral muted by default.|
|`--cngx-toggle-track-bg-on`|`oklch(0.66 0.19 50)`|State / On|Background of the on-state track. Falls back to|
|`--cngx-toggle-thumb-inset`|`0.125rem`|Layout|Inset of the thumb inside the track (resting position).|
|`--cngx-toggle-thumb-size`|`1rem`|Layout|Diameter of the circular thumb.|
|`--cngx-toggle-thumb-travel`|`1rem`|State / On|Horizontal translation applied to the thumb when checked.|
|`--cngx-toggle-thumb-bg`|`oklch(1 0 0)`|Surface|Background of the thumb.|
|`--cngx-toggle-thumb-shadow`|`0 1px 2px oklch(0 0 0 / 0.25)`|Surface|Drop-shadow applied to the thumb so it lifts off the track.|

## CngxTreeSelect

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven,|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks|
|`--cngx-select-caret-size`|`1.25em`|Layout|Font-size of the dropdown caret glyph shared across every variant.|
|`--cngx-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled. Shared|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true`|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.6 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-bg`|`oklch(0.66 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Falls back|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.6 0.18 25)`|State / Error|Text color of every error surface. Falls back to|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-tree-select-min-width`|`10rem`|Layout|Minimum inline size of the trigger.|
|`--cngx-tree-select-trigger-gap`|`0.5rem`|Layout|Gap between the value summary, clear button, and caret.|
|`--cngx-tree-select-trigger-height`|`2.25rem`|Layout|Minimum block size of the trigger.|
|`--cngx-tree-select-trigger-padding`|`0.25rem 0.5rem`|Layout|Padding shorthand of the trigger.|
|`--cngx-tree-select-trigger-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the trigger. `inherits: true` so the :root|
|`--cngx-tree-select-trigger-radius`|`0.25rem`|Layout|Corner radius of the trigger.|
|`--cngx-tree-select-trigger-bg`|`transparent`|Surface|Background of the trigger.|
|`--cngx-tree-select-focus-ring`|`2px solid oklch(0.66 0.19 50 / 0.8)`|State / Focus|Focus-ring outline shorthand. Falls back to `--cngx-color-primary`.|
|`--cngx-tree-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled.|
|`--cngx-tree-select-clear-size`|`1.25rem`|State / Clear|Hit-target diameter of the clear-all button.|

## CngxTreetable

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-treetable-header-bg`|`oklch(0.98 0.005 250)`|Surface|Header row background.|
|`--cngx-treetable-header-border`|`oklch(0.92 0.005 250)`|Surface|Bottom border under the header row. Falls back through|
|`--cngx-treetable-header-color`|`oklch(0.34 0.015 250)`|Surface|Header cell text color.|
|`--cngx-treetable-row-border`|`oklch(0.96 0.005 250)`|Surface|Between-rows border color. Falls back through `--cngx-color-border`.|
|`--cngx-treetable-row-hover-bg`|`oklch(0.97 0.015 250)`|State / Highlighted|Background of the keyboard-highlighted row.|
|`--cngx-treetable-row-selected-bg`|`oklch(0.95 0.025 250)`|State / Selected|Background of the selected row.|
|`--cngx-treetable-focus-ring`|`oklch(0.66 0.19 50)`|State / Focus|Focus-ring outline color. Falls back through `--cngx-color-primary`.|
|`--cngx-treetable-muted-color`|`oklch(0.5 0.015 250)`|Surface|Muted text color used by the empty state and the toggle button.|
|`--cngx-treetable-cell-color`|`oklch(0.34 0.015 250)`|Surface|Body cell text color.|
|`--cngx-treetable-indent-size`|`1.5rem`|Layout|Indent step per tree depth level. Multiplied by `--cngx-row-depth`|
|`--cngx-treetable-cell-padding-block`|`0.6rem`|Layout|Block-axis padding inside header and body cells.|
|`--cngx-treetable-cell-padding-inline`|`1rem`|Layout|Inline-axis padding inside header and body cells.|
|`--cngx-treetable-narrow-cell-padding-inline`|`0.25rem`|Layout|Compact inline padding applied to the expand and select utility|
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
|`--cngx-treetable-toggle-font-size`|`0.875rem`|Typography|Font-size of the toggle button glyph.|
|`--cngx-treetable-row-transition-duration`|`120ms`|Motion|Transition duration of the row background change.|
|`--cngx-treetable-toggle-transition-duration`|`120ms`|Motion|Transition duration of the toggle button hover state.|
|`--cngx-treetable-narrow-breakpoint`|`960px`|Variant / Narrow|Width threshold at which the narrow / mobile overrides apply.|
|`--cngx-treetable-narrow-font-size`|`0.8125rem`|Variant / Narrow|Font-size below the narrow breakpoint.|
|`--cngx-treetable-narrow-header-padding-block`|`0.5rem`|Variant / Narrow|Header cell block padding below the narrow breakpoint.|
|`--cngx-treetable-narrow-header-padding-inline`|`0.625rem`|Variant / Narrow|Header cell inline padding below the narrow breakpoint.|
|`--cngx-treetable-narrow-cell-padding-block`|`0.875rem`|Variant / Narrow|Body cell block padding below the narrow breakpoint -bigger|
|`--cngx-treetable-narrow-cell-padding-inline-default`|`0.625rem`|Variant / Narrow|Default body cell inline padding below the narrow breakpoint.|
|`--cngx-treetable-narrow-utility-padding-inline`|`0.125rem`|Variant / Narrow|Compact inline padding for utility cells below the narrow breakpoint.|
|`--cngx-treetable-narrow-utility-padding-inline-large`|`0.875rem`|Variant / Narrow|Larger utility inline padding used by the first-data-cell below|
|`--cngx-treetable-narrow-indent-size`|`1.25rem`|Variant / Narrow|Indent step per depth level below the narrow breakpoint -|
|`--cngx-treetable-narrow-toggle-padding`|`0.5rem`|Variant / Narrow|Toggle button padding below the narrow breakpoint -bigger|
|`--cngx-treetable-narrow-toggle-font-size`|`1rem`|Variant / Narrow|Toggle button font-size below the narrow breakpoint.|

## CngxTrend

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-trend-gap`|`2px`|Layout|Gap between the arrow glyph and the trend label.|
|`--cngx-trend-size`|`0.8125rem`|Typography|Font-size of the trend label.|
|`--cngx-trend-weight`|`500`|Typography|Font-weight of the trend label.|
|`--cngx-trend-color`|`oklch(0.36 0.02 290)`|Surface|Neutral text color applied when no direction modifier is set.|
|`--cngx-trend-up-color`|`oklch(0.65 0.18 145)`|Variant / Up|Color of the `.cngx-trend--up` modifier. Falls back to|
|`--cngx-trend-down-color`|`oklch(0.65 0.22 25)`|Variant / Down|Color of the `.cngx-trend--down` modifier. Falls back to|

## CngxTypeahead

|Token|Default|Group|Description|
|-|-|-|-|
|`--cngx-select-panel-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the dropdown panel. Falls back through|
|`--cngx-select-panel-radius`|`0.25rem`|Layout|Corner radius of the dropdown panel.|
|`--cngx-select-panel-bg`|`oklch(1 0 0)`|Surface|Background of the dropdown panel. Falls back through|
|`--cngx-select-panel-color`|`currentColor`|Surface|Text color inside the panel. `syntax: '*'` + initial-value|
|`--cngx-select-panel-shadow`|`0 4px 12px oklch(0 0 0 / 0.12)`|Surface|Drop-shadow shorthand. Falls back through `--cngx-shadow-md`.|
|`--cngx-select-panel-padding`|`0.25rem`|Layout|Inner padding of the panel.|
|`--cngx-select-panel-max-height`|`16rem`|Layout|Maximum height before vertical scrolling kicks in.|
|`--cngx-select-option-padding`|`0.375rem 0.5rem`|Layout|Padding shorthand of each option row.|
|`--cngx-select-option-min-height`|`0px`|Layout|Minimum height of an option row - defaults to `0px` (content-driven,|
|`--cngx-select-option-radius`|`0.125rem`|Layout|Corner radius of an option row.|
|`--cngx-select-option-highlight-bg`|`oklch(0.66 0.19 50 / 0.1)`|State / Highlighted|Background of the keyboard-highlighted option row. Defaults to a|
|`--cngx-select-check-color`|`oklch(0.66 0.19 50)`|State / Selected|Color of the selected-option checkmark glyph. Falls back through|
|`--cngx-select-placeholder-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the placeholder text shown when no value is selected.|
|`--cngx-select-caret-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the dropdown caret glyph shared across every variant.|
|`--cngx-select-clear-color`|`oklch(0 0 0 / 0.5)`|Surface|Color of the clear-button glyph shared across every variant. Tracks|
|`--cngx-select-caret-size`|`1.25em`|Layout|Font-size of the dropdown caret glyph shared across every variant.|
|`--cngx-select-disabled-opacity`|`0.5`|State / Disabled|Opacity multiplier applied when the trigger is disabled. Shared|
|`--cngx-select-skeleton-gap`|`0.25rem`|State / Loading|Vertical gap between skeleton placeholder rows.|
|`--cngx-select-skeleton-padding`|`0.25rem`|State / Loading|Padding around the skeleton placeholder block.|
|`--cngx-select-skeleton-row-height`|`1.75rem`|State / Loading|Height of each skeleton placeholder row.|
|`--cngx-select-skeleton-row-radius`|`0.125rem`|State / Loading|Corner radius of each skeleton placeholder row.|
|`--cngx-select-spinner-padding`|`1rem`|State / Loading|Padding around the first-load spinner wrapper.|
|`--cngx-select-spinner-size`|`1.5rem`|State / Loading|Diameter of the first-load spinner ring.|
|`--cngx-select-spinner-border`|`2px solid oklch(0 0 0 / 0.15)`|State / Loading|Track stroke of the first-load spinner ring. `inherits: true`|
|`--cngx-select-spinner-color`|`oklch(0.66 0.19 50)`|State / Loading|Indicator stroke of the first-load spinner ring. Falls back to|
|`--cngx-select-loading-bar-height`|`3px`|State / Loading|Height of the first-load loading bar.|
|`--cngx-select-loading-bar-color`|`oklch(0.66 0.19 50)`|State / Loading|Color of the first-load loading bar. Falls back to|
|`--cngx-select-refreshing-height`|`2px`|State / Refreshing|Height of the subsequent-load refreshing bar.|
|`--cngx-select-refreshing-color`|`oklch(0.66 0.19 50)`|State / Refreshing|Color of the refreshing bar gradient. Falls back to|
|`--cngx-select-refreshing-spinner-padding`|`0.25rem`|State / Refreshing|Padding around the refreshing spinner wrapper.|
|`--cngx-select-refreshing-dots-gap`|`0.25rem`|State / Refreshing|Gap between the three refreshing dots.|
|`--cngx-select-refreshing-dots-padding`|`0.375rem`|State / Refreshing|Padding around the refreshing dots block.|
|`--cngx-select-refreshing-dot-size`|`0.375rem`|State / Refreshing|Diameter of each refreshing dot.|
|`--cngx-select-refreshing-dot-color`|`currentColor`|State / Refreshing|Color of each refreshing dot.|
|`--cngx-select-option-spinner-size`|`0.875rem`|State / Commit|Diameter of the per-row commit spinner.|
|`--cngx-select-option-spinner-color`|`oklch(0.66 0.19 50)`|State / Commit|Indicator stroke of the per-row commit spinner.|
|`--cngx-select-option-error-color`|`oklch(0.6 0.18 25)`|State / Commit|Glyph color of the per-row commit error indicator. Falls back to|
|`--cngx-select-chip-gap`|`0.25rem`|Layout|Gap between chips inside the trigger chip list.|
|`--cngx-select-chip-wrap-radius`|`0.25rem`|Layout|Corner radius of the reorderable chip wrap container.|
|`--cngx-select-chip-overflow-badge-bg`|`oklch(0 0 0 / 0.08)`|State / Overflow|Background of the chip overflow badge shown in `truncate` overflow mode.|
|`--cngx-select-chip-overflow-badge-color`|`oklch(0 0 0 / 0.6)`|State / Overflow|Text color of the chip overflow badge.|
|`--cngx-select-chip-wrap-gap`|`0.25rem`|Layout|Gap between the chip body and any projected drag handle.|
|`--cngx-select-chip-remove-size`|`1.25rem`|State / Remove|Hit-target diameter of the chip remove button inside a|
|`--cngx-select-chip-remove-hover-bg`|`oklch(0 0 0 / 0.12)`|State / Remove|Background tint of the chip remove button on hover.|
|`--cngx-select-chip-remove-hover-color`|`oklch(0.6 0.18 25)`|State / Remove|Foreground color of the chip remove button on hover. Falls back|
|`--cngx-select-chip-handle-color`|`oklch(0.5 0.01 250)`|State / Reorder|Color of the optional projected drag-handle glyph.|
|`--cngx-select-chip-handle-size`|`0.75rem`|State / Reorder|Font-size of the optional projected drag-handle glyph.|
|`--cngx-select-chip-drag-shadow`|`0 8px 20px oklch(0 0 0 / 0.28)`|State / Dragging|Drop-shadow of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-bg`|`oklch(0.66 0.19 50)`|State / Dragging|Background of the chip lifted into the dragging state. Falls back|
|`--cngx-select-chip-drag-color`|`oklch(1 0 0)`|State / Dragging|Text color of the chip lifted into the dragging state.|
|`--cngx-select-chip-drag-scale`|`1.06`|State / Dragging|Scale multiplier of the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drag-tilt`|`-1.5deg`|State / Dragging|Rotation tilt applied to the dragging chip - Trello-style lift.|
|`--cngx-select-chip-drop-bar-width`|`3px`|State / Dragging|Width of the drop-indicator bar between chips.|
|`--cngx-select-chip-drop-bar-color`|`oklch(0.66 0.19 50)`|State / Dragging|Color of the drop-indicator bar between chips. Falls back to|
|`--cngx-select-error-gap`|`0.5rem`|State / Error|Gap between the error message and the retry button.|
|`--cngx-select-error-padding`|`0.5rem 0.75rem`|State / Error|Padding of the panel-wide error block.|
|`--cngx-select-error-color`|`oklch(0.6 0.18 25)`|State / Error|Text color of every error surface. Falls back to|
|`--cngx-select-error-inline-padding`|`0.375rem 0.5rem`|State / Error|Padding of the inline error banner shown above the option list.|
|`--cngx-select-error-inline-radius`|`0.125rem`|State / Error|Corner radius of the inline error banner.|
|`--cngx-select-error-retry-border`|`1px solid currentColor`|State / Error|Border shorthand of the error retry button.|
|`--cngx-select-trigger-invalid-border-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Border color painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-border-width`|`1px`|State / Trigger invalid|Border width painted on the trigger wrapper when `aria-invalid="true"`.|
|`--cngx-select-trigger-invalid-outline-color`|`oklch(0.6 0.18 25)`|State / Trigger invalid|Outline color layered on the invalid trigger when focus is inside it.|
|`--cngx-select-trigger-invalid-glow`|`0 0 0 3px oklch(0.6 0.18 25 / 0.2)`|State / Trigger invalid|Soft halo layered behind the invalid trigger at focus time. Authored as a|
|`--cngx-select-commit-error-padding`|`0.375rem 0.5rem`|State / Commit|Padding of the commit error banner.|
|`--cngx-select-commit-error-radius`|`0.125rem`|State / Commit|Corner radius of the commit error banner.|
|`--cngx-typeahead-gap`|`0.5rem`|Layout|Gap between the input, clear button, and caret.|
|`--cngx-typeahead-min-height`|`2.25rem`|Layout|Minimum block size of the trigger.|
|`--cngx-typeahead-padding`|`0 0.75rem`|Layout|Padding shorthand of the trigger.|
|`--cngx-typeahead-border`|`1px solid oklch(0.85 0.01 250)`|Surface|Border shorthand of the trigger.|
|`--cngx-typeahead-radius`|`0.25rem`|Layout|Corner radius of the trigger.|
|`--cngx-typeahead-bg`|`oklch(1 0 0)`|Surface|Background of the trigger. Falls back through `--cngx-color-surface`.|

