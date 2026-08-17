# @cngx/ui/context-menu

Declarative context-menu organism over the headless menu brains
(`@cngx/common/interactive`). One `<cngx-context-menu>` docks onto many targets
via `[cngxContextMenuFor]`, opens at pointer coordinates on right-click or
`Shift+F10`, and hands each open a per-row datum. The panel stacks `CngxPopover`
and `CngxMenu` as host directives, so `role="menu"`, active-descendant
navigation, and the four dismiss sources come from the composition, not the
shell.

Placement follows the tabs precedent: components that host a popover surface
live in `@cngx/ui`, above the popover-free `common/interactive` layer.

## Anatomy

```html
<div [cngxContextMenuFor]="menu" [cngxContextMenuData]="row" tabindex="0">…</div>

<cngx-context-menu #menu="cngxContextMenu" ariaLabel="Row actions">
  <cngx-context-menu-item value="open" kbd="⌘O" (select)="open()">Open</cngx-context-menu-item>
  <cngx-context-menu-item value="rename" (select)="rename()">Rename</cngx-context-menu-item>
  <cngx-context-menu-divider />
  <cngx-context-menu-item value="delete" [disabled]="locked()" (select)="remove()">Delete</cngx-context-menu-item>
</cngx-context-menu>
```

Minimal case: two template elements, one binding. `ariaLabel` forwards to the
menu's required label, so the accessible name stays mandatory.

## Data channel

Two ways to obtain the datum `T`:

- `[cngxContextMenuData]` - a fixed datum for a single target.
- `[cngxContextMenuResolve]` - a resolver run against the `contextmenu` event,
  so a table, grid, treetable, or virtualized list keeps one trigger instance
  and derives the row from `event.target`. The resolver wins when both are
  bound; a `null` result leaves the native menu untouched (no `preventDefault`,
  no open).

The panel's `context()` is derived from popover visibility, never synced: the
lazy `*cngxContextMenuContent` template rebuilds with the right row on each open
and nulls out on close.

```html
<table [cngxContextMenuFor]="menu" [cngxContextMenuResolve]="resolveRow">…</table>

<cngx-context-menu #menu="cngxContextMenu" ariaLabel="Row actions">
  <ng-template cngxContextMenuContent let-row>
    <cngx-context-menu-item (select)="edit(row)">Edit {{ row.name }}</cngx-context-menu-item>
  </ng-template>
</cngx-context-menu>
```

## Items

`CngxContextMenuItem` (dual selector: `cngx-context-menu-item` or
`button[cngxContextMenuItem]`) is a thin shell over `CngxMenuItem` - the brain
owns `role="menuitem"`, activation, and disabled semantics. `icon` and `kbd`
render through the menu-item slots; `select` fires on click or Enter/Space.

Checkable rows: `cngx-context-menu-item-checkbox` two-way binds `[(checked)]`;
`cngx-context-menu-item-radio` scopes mutual exclusion to an enclosing
`[cngxMenuGroup]`. `role="menuitemcheckbox"` / `menuitemradio` and the reactive
`aria-checked` come from the brains.

## Submenu

Bind `[submenu]` on an item to a sibling `<cngx-context-menu>` - sibling
declaration, not inline nesting (inline-projected items would register with the
parent's active-descendant). The `CngxMenuItemSubmenu` brain is wired internally
through `CNGX_MENU_SUBMENU_WIRING`, so there is no `[exclusive]` handgrip and no
popover plumbing. The nested panel opens non-exclusively (the parent survives),
inherits the parent's row context, and shares the ArrowRight / ArrowLeft /
Escape keyboard contract with `CngxMenuTrigger`.

```html
<cngx-context-menu-item [submenu]="exportMenu">Export as</cngx-context-menu-item>
<cngx-context-menu #exportMenu="cngxContextMenu" ariaLabel="Export format">
  <cngx-context-menu-item (select)="export('pdf')">PDF</cngx-context-menu-item>
</cngx-context-menu>
```

## Config

No new config surface. All labels flow through `provideCngxMenu(...)` /
`injectMenuConfig()` from `@cngx/common/interactive`. Library defaults are
English.

## Theming

Default visuals ship with the components (Track A) - no theme import needed. The
popup surface, item geometry, divider, and checked glyph paint from the
`--cngx-context-menu-*` token family; spacing derives from `--cngx-space-*`, so a
root `[data-density]` compacts the menu and colours track the foundation across
light and dark. The item slot and highlight painting is adopted from the base
menu skin. Opt into Material with
`@use '@cngx/themes/material/context-menu-theme'`.
