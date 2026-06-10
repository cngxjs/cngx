# CngxTabOverflowTrigger

The slot replaces only the visible label of the overflow "More" button. Everything semantic stays on the library-owned `<button>` shell, so an override cannot break the menu-button pattern.

- **Accessible name is library-owned.** The button carries `aria-label="i18n.moreTabsLabel(count)"`, so an icon-only template stays announced as "N more tabs" without any consumer label. Visible text or a count in the template is reinforcement, not the only channel.
- **Role and state are library-owned.** `aria-haspopup="menu"`, `aria-expanded`, the popover `role="menu"`, and `aria-activedescendant` steering across `role="menuitem"` rows all live on the shell. The template never sets them.
- **Keyboard is library-owned.** ArrowDown / ArrowUp / Home / End open the popover and move the active descendant; the slot does not wire keys.
- **Keep the template presentational.** The shell is already a `<button>` with menu semantics, so do not nest interactive elements (a `<button>`, `<a>`, or `routerLink`) inside it. Nested controls are invalid inside a button and break the pattern. Icons and text only.
