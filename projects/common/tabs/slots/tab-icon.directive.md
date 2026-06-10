# CngxTabIcon

The slot paints a decorative icon ahead of the tab label. The label carries the accessible name, so the icon stays presentational.

- **The label is the accessible name, not the icon.** The tab's name comes from its label and the verbose `aria-label`; the icon adds nothing to it. An icon-only layout (`iconLayout="only"`) still keeps the label in the DOM for SR.
- **Do not encode state in the icon alone.** Swapping the glyph on the active tab is fine as reinforcement, but selection is already conveyed by `aria-selected` - never let the icon be the only signal.
- **Keep the template decorative.** Mark purely decorative icons `aria-hidden`; no interactive elements inside the header button.
