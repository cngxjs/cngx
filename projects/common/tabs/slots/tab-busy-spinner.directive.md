# CngxTabBusySpinner

The slot replaces only the visible spinner on the in-flight tab. The busy state is communicated to assistive tech by the library, so the template stays decorative.

- **Visibility is library-gated.** The slot renders only while the tab is the in-flight commit target (status `pending`); the consumer never gates it.
- **The SR channel is library-owned.** The tab button carries `aria-busy="true"` and an `aria-describedby` SR-only descriptor announces the pending state. The built-in glyph is `aria-hidden`.
- **Keep the template decorative.** Do not add SR-only text inside it - the descriptor already announces, so a second label double-speaks. No interactive elements.
- **Do not signal busy by motion or colour alone.** The `aria-busy` plus descriptor channel is the source of truth and is library-owned; the spinner is visual reinforcement.
