# CngxTabAddIcon

The slot paints only the glyph inside the add-tab button. The button shell owns the accessible name, so the template stays decorative.

- **Accessible name is library-owned.** The add button carries `aria-label` from `i18n.addTab`, so a glyph-only template is still announced. The slot context is `void` - it has no label to set.
- **Do not encode meaning in the glyph alone.** The accessible name carries "add tab"; the glyph is a visual cue on top, and decorative icons should be `aria-hidden`.
- **Keep the template decorative.** The shell is already a `<button>`; do not nest interactive elements or add SR-only text. Icon only.
