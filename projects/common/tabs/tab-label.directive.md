# CngxTabLabel

The slot marks a tab's label template for rich visible content (an icon beside text, a badge, custom markup) beyond the plain `[label]` string. It renders into the `role="tab"` button - but it is the *visible* label, not the accessible name.

- **The accessible name comes from `[label]` when it is set.** With a `[label]` string the organism sets the tab button's `aria-label` to "Tab N of M: `[label]`", which wins over rendered content. Without one, the button is named from the rendered template through `aria-labelledby`, and `<cngx-tab-group>` dev-warns with `CNGX3025`: the announcements, the close button and the overflow list still need the string and fall back to "Tab N". Always pair the template with `[label]` (the markup is for sight, the string is for every other surface).
- **The string label also drives announcements and wiring.** `[label]` feeds the live-region direction message ("Next tab: Settings") and the tab's accessible name on every change; the template alone feeds neither. Provide it even when the visible label is fully custom.
- **Keep the markup presentational.** The tab is already a `role="tab"` button, so do not nest interactive elements (a `<button>`, `<a>`, or control) inside the label. Mark decorative icons `aria-hidden`.
