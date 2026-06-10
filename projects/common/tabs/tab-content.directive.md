# CngxTabContent

The slot marks a tab's panel-body template, projected into the matching `role="tabpanel"`. It carries no logic - the panel's place in the accessibility tree comes from how the organism wires it, and your content fills the body.

- **Every tab has a real, named panel.** The content lands in a `role="tabpanel"` that carries `aria-labelledby` pointing at its tab header, and a matching `id` for the tab's `aria-controls`. The tab and panel reference each other both ways, so AT can move between them.
- **The panel stays in the DOM; visibility toggles via `[hidden]`.** Inactive panels are hidden, not removed, so the `aria-controls` / `aria-labelledby` references never dangle. `panelMode` (`eager` / `lazy` / `lazy-destroy`) only governs when the *body content* renders, not whether the panel element exists.
- **The active panel is reachable by keyboard.** The organism places the active panel in the tab order (`panelTabindex`), so after the tablist `Tab` lands on the panel (APG). Your content does not need its own tab stop to be reachable.
- **The panel role is localised.** It announces as "tab panel" via `aria-roledescription` (overridable through i18n) without you adding anything.
- **Give the body its own heading structure.** The slot supplies the region role; your template should still open with a sensible heading or landmark so the panel is navigable on its own, not just a nameless box.
