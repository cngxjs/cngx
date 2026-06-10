# CngxTabRejectionIcon

The slot replaces only the visible rejection decoration on the tab the commit rolled back from. The outcome is communicated to assistive tech by the library, so the template stays decorative.

- **Visibility is library-gated.** The slot renders only on the tab matching `presenter.lastFailedIndex()`; the consumer never gates it.
- **The SR channel is library-owned.** The built-in glyph is `aria-hidden`; the rollback is announced through the group's live region.
- **`originLabel` carries SR context.** It names the safe-harbour tab the active state rolled back to (`undefined` for the synchronous-rejection edge case). Surface it inside a `cngx-sr-only` span when you want it spoken alongside the icon.
- **Keep the template decorative.** Do not signal rejection by colour alone; pair with an icon or shape. No interactive elements.
