# CngxTabLabel

The slot marks a tab's label template for rich visible content (an icon beside text, a badge, custom markup) beyond the plain `[label]` string. It renders into the `role="tab"` button - but it is the *visible* label, not the accessible name.

- **The accessible name comes from `[label]`, not the template.** The organism always sets the tab button's `aria-label` to "Tab N of M: `[label]`", and `aria-label` wins over rendered content. So a `*cngxTabLabel` template **without** a `[label]` string is announced as "Tab 2 of 5:" with no name. Always pair the template with `[label]` (the markup is for sight, the string is for AT).
- **The string label also drives announcements and wiring.** `[label]` feeds the live-region direction message ("Next tab: Settings") and the tab's accessible name on every change; the template alone feeds neither. Provide it even when the visible label is fully custom.
- **Keep the markup presentational.** The tab is already a `role="tab"` button, so do not nest interactive elements (a `<button>`, `<a>`, or control) inside the label. Mark decorative icons `aria-hidden`.
