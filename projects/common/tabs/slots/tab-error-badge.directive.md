# CngxTabErrorBadge

The slot replaces only the visible error badge on the tab. The error state is communicated to assistive tech by the library, so the template stays decorative.

- **Visibility is library-gated.** The slot renders only when the tab's `errorAggregator?.shouldShow()` is `true`; the consumer never gates it.
- **The SR channel is library-owned.** The error is announced through the tab's `aria-describedby` SR-only descriptor. The built-in glyph is `aria-hidden`; the badge is a visual cue, not the only channel.
- **Do not rely on colour alone.** Pair the badge with a shape or icon so the cue survives colour-blindness and forced-colours; the SR descriptor carries the meaning regardless.
- **Keep the template decorative.** Do not add SR-only text (double-speaks) or interactive elements.
