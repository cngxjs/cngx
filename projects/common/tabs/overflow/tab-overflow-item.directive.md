# CngxTabOverflowItem

The slot replaces only the visible body of each overflow popover row. The row shell, role, and selection stay library-owned, so an override cannot break the menu pattern.

- **Role and state are library-owned.** Each row is a `role="menuitem"` inside the popover `role="menu"`; `aria-disabled` reflects the pre-resolved `disabled` flag. The template never sets these.
- **Selection is commit-aware.** Picking a row runs through the `pick()` callback, which routes `selectById` through the commit lifecycle (optimistic/pessimistic, rollback on failure). Use it; do not wire your own click handler.
- **Keyboard and focus are library-owned.** The active row is steered by `aria-activedescendant` on the trigger; the slot manages neither focus nor keys.
- **Keep the template presentational.** The shell is already a menuitem, so do not nest interactive elements (a `<button>`, `<a>`, or `routerLink`) inside it. Icons and text only.
