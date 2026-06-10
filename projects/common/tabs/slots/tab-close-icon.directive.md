# CngxTabCloseIcon

The slot paints only the glyph inside each closable tab's close button. The button shell owns the name, the keyboard, and focus restoration, so the template stays decorative.

- **Accessible name is library-owned.** The close button carries `aria-label` from `closeButtonLabel(tab)` ("Close <label>"), so a glyph-only template is still announced.
- **Keyboard close is library-owned (APG).** Delete on a focused closable tab requests its close; the slot wires no keys.
- **Focus is restored on close.** After the consumer removes the tab, focus moves to the new active tab, then the add button, then the group element - it never falls to `<body>`.
- **Keep the template decorative.** Icon only; no nested interactive elements, no SR-only text (the button already announces). Decorative glyphs should be `aria-hidden`.
