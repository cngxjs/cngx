# Menu

WAI-ARIA `role="menu"` primitive with action items, checkable items, radio groups, separators, submenus, dropdown trigger, context-menu trigger, typeahead, and a polite live-region announcer. The family is built from small directives that compose: `CngxMenu` is the container, the items carry their own role, and the triggers wrap menus in popovers. No `ControlValueAccessor`, no inheritance, no monolithic options object - everything wires through inputs and DI.

## Import

```ts
import {
  CngxMenu,
  CngxMenuItem,
  CngxMenuItemCheckbox,
  CngxMenuItemRadio,
  CngxMenuItemSubmenu,
  CngxMenuGroup,
  CngxMenuSeparator,
  CngxMenuTrigger,
  CngxContextMenuTrigger,
  CngxMenuItemIcon,
  CngxMenuItemLabel,
  CngxMenuItemKbd,
  CngxMenuItemSuffix,
} from '@cngx/common/interactive';
import { CngxPopover, CngxPopoverTrigger } from '@cngx/common/popover';
```

## Quick start

### Action menu

A `cngxMenu` with `cngxMenuItem` children. The menu fires `itemActivated` on Enter/Space/click; the consumer owns the side effect.

```html
<ul cngxMenu [label]="'File actions'" tabindex="0"
    (itemActivated)="run($any($event))">
  <li cngxMenuItem value="new">New</li>
  <li cngxMenuItem value="open">Open</li>
  <li cngxMenuSeparator></li>
  <li cngxMenuItem value="save">Save</li>
  <li cngxMenuItem value="save-as" [disabled]="true">Save as</li>
</ul>
```

### Dropdown menu (button + popover)

`CngxMenuTrigger` wires a focusable element to the menu and the popover. Activation always closes the menu (menu semantics).

```html
<button type="button"
        [cngxMenuTrigger]="menu"
        [popover]="pop"
        (click)="pop.toggle()">
  Actions
</button>

<div cngxPopover #pop="cngxPopover">
  <ul cngxMenu [label]="'Actions'" tabindex="0" #menu="cngxMenu"
      (itemActivated)="run($any($event))">
    <li cngxMenuItem value="new">New</li>
    <li cngxMenuItem value="open">Open</li>
  </ul>
</div>
```

### Submenu

`CngxMenuItemSubmenu` sits on the same element as the parent `cngxMenuItem`. The inner popover MUST be `[exclusive]="false"` so opening it does not light-dismiss the outer popover. ArrowRight opens, ArrowLeft / Escape closes.

```html
<li cngxMenuItem
    [cngxMenuItemSubmenu]="recentPop"
    [submenuMenu]="recentMenu"
    value="recent">
  Open recent
</li>

<div cngxPopover #recentPop="cngxPopover" placement="right-start" [exclusive]="false"
     [positionTryFallbacks]="CNGX_SUBMENU_TRY_FALLBACKS">
  <ul cngxMenu [label]="'Recent files'" tabindex="0" #recentMenu="cngxMenu">
    <li cngxMenuItem value="plan.md">plan.md</li>
    <li cngxMenuItem value="notes.txt">notes.txt</li>
  </ul>
</div>
```

#### Submenu collision recovery

When the preferred edge clips the viewport, CSS Anchor Positioning's `position-try-fallbacks` flips the submenu to a fitting edge. The library ships `CNGX_SUBMENU_TRY_FALLBACKS` (`['flip-inline', 'flip-block', 'flip-block flip-inline']`) as the recommended chain — matches the `@cngx/forms/select` panel precedent and covers right-edge, bottom-edge, and diagonal clipping.

```ts
import { CNGX_SUBMENU_TRY_FALLBACKS } from '@cngx/common/interactive';
```

`CngxMenuItemSubmenu` emits a one-shot dev-mode warning when a submenu popover ships without `positionTryFallbacks` so the wiring stays explicit.

### Checkable items and radio groups

`CngxMenuItemCheckbox` owns its `checked` model. `CngxMenuItemRadio` reads / writes the selected value through the enclosing `CngxMenuGroup`. Both render the correct `aria-checked`.

```html
<ul cngxMenu [label]="'Text formatting'" tabindex="0">
  <li cngxMenuItemCheckbox value="bold" [(checked)]="bold">Bold</li>
  <li cngxMenuItemCheckbox value="italic" [(checked)]="italic">Italic</li>
  <li cngxMenuSeparator></li>
  <div cngxMenuGroup [label]="'Alignment'" [(selectedValue)]="align">
    <li cngxMenuItemRadio value="left">Left</li>
    <li cngxMenuItemRadio value="center">Center</li>
    <li cngxMenuItemRadio value="right">Right</li>
  </div>
</ul>
```

### Context menu

`CngxContextMenuTrigger` opens the menu at the pointer location on `contextmenu` (right-click) or `Shift+F10` when the host is focused.

```html
<div tabindex="0" [cngxContextMenuTrigger]="ctx" [popover]="pop">
  Right-click here
</div>
<div cngxPopover #pop="cngxPopover">
  <ul cngxMenu [label]="'Context actions'" tabindex="0" #ctx="cngxMenu"
      (itemActivated)="run($any($event)); pop.hide()">
    <li cngxMenuItem value="cut">Cut</li>
    <li cngxMenuItem value="copy">Copy</li>
    <li cngxMenuItem value="paste">Paste</li>
  </ul>
</div>
```

## Family map

| Symbol | Purpose |
|-|-|
| `CngxMenu` (`[cngxMenu]`) | Container with `role="menu"`. Hosts `CngxActiveDescendant`, collects submenu items, emits `itemActivated`. |
| `CngxMenuItem` (`[cngxMenuItem]`) | Action item (`role="menuitem"`). Click and keyboard activation; no selection state. |
| `CngxMenuItemCheckbox` (`[cngxMenuItemCheckbox]`) | Checkable item (`role="menuitemcheckbox"`). Two-way `checked` model. |
| `CngxMenuItemRadio` (`[cngxMenuItemRadio]`) | Radio item (`role="menuitemradio"`). Mutually exclusive within the enclosing `CngxMenuGroup`. |
| `CngxMenuItemSubmenu` (`[cngxMenuItemSubmenu]`) | Companion on a `cngxMenuItem` that opens a nested menu. Adds `aria-haspopup="menu"` and reactive `aria-expanded`. |
| `CngxMenuGroup` (`[cngxMenuGroup]`) | Logical grouping with `role="group"`. Owns the radio group's `selectedValue`. |
| `CngxMenuSeparator` (`[cngxMenuSeparator]`) | `role="separator"`. Skipped by arrow-key navigation and typeahead. |
| `CngxMenuTrigger` (`[cngxMenuTrigger]`) | Pairs a focusable element with a `CngxMenu` and a popover. Drives the focus stack for nested submenus. |
| `CngxContextMenuTrigger` (`[cngxContextMenuTrigger]`) | Opens a menu at pointer coordinates on `contextmenu` / `Shift+F10`. |

## Slot markers

Marker directives applied to children of a `cngxMenuItem` (or any of its checkable variants). They add a single BEM class for styling; no inputs, no behaviour. Order is consumer-controlled.

| Marker | Host class |
|-|-|
| `CngxMenuItemIcon` (`[cngxMenuItemIcon]`) | `cngx-menu-item__icon` |
| `CngxMenuItemLabel` (`[cngxMenuItemLabel]`) | `cngx-menu-item__label` |
| `CngxMenuItemSuffix` (`[cngxMenuItemSuffix]`) | `cngx-menu-item__suffix` |
| `CngxMenuItemKbd` (`[cngxMenuItemKbd]`) | `cngx-menu-item__kbd` |

```html
<li cngxMenuItem value="new">
  <span cngxMenuItemIcon>📄</span>
  <span cngxMenuItemLabel>New</span>
  <kbd cngxMenuItemKbd>⌘N</kbd>
</li>
```

## Configuration

Every menu directive in the family reads `CNGX_MENU_CONFIG`. The defaults are English and library-conservative; override at app root or per component scope.

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideCngxMenu(
      withAriaLabels({
        submenuOpened: 'Untermenue geoeffnet',
        submenuClosed: 'Untermenue geschlossen',
        itemActivated: 'Eintrag aktiviert',
        itemDisabled: 'Eintrag deaktiviert',
      }),
      withTypeaheadDebounce(500),
    ),
  ],
});
```

`provideCngxMenu(...)` is the aggregator. It dispatches features to the matching surface; today every feature targets `CNGX_MENU_CONFIG`, but the discriminator scaffold is in place so future surfaces (e.g. announcer overrides) compose through the same call.

For a component-scoped override use `provideMenuConfigAt(...)` in `viewProviders`. It inherits the parent config and applies the features on top.

| Feature | Default | Purpose |
|-|-|-|
| `withAriaLabels(partial)` | English strings | Partial override of the four announced strings. Unset keys keep their default. |
| `withTypeaheadDebounce(ms)` | `300` | Reset window for the typeahead buffer. |
| `withSubmenuOpenDelay(ms)` | `0` | Reserved for hover-driven menubar implementations. |
| `withSubmenuCloseDelay(ms)` | `150` | Grace period before a hover-out closes the submenu. |
| `withCloseOnSelect(close)` | `true` | Whether activating a leaf item closes the menu. |

`provideMenuConfig(...)` and `provideMenuConfigAt(...)` are the lower-level entry points if a consumer wants to bypass the aggregator. `injectMenuConfig()` resolves the merged config from the current injection scope.

## DI override tokens

Substitutable seams. Override via `providers` / `viewProviders` to swap behaviour without forking the family.

| Token | Default | Override to |
|-|-|-|
| `CNGX_MENU_CONFIG` | `DEFAULT_MENU_CONFIG` | App- or component-scoped config (use `provideCngxMenu` / `provideMenuConfigAt`). |
| `CNGX_MENU_HOST` | `CngxMenu` (via `useExisting`) | Substitute a custom menu host that satisfies `CngxMenuHost`. |
| `CNGX_MENU_NAV_STRATEGY` | `createW3CMenuStrategy()` | Plug a non-W3C ArrowLeft / ArrowRight policy. Strategy steps are pure decisions. |
| `CNGX_MENU_ANNOUNCER_FACTORY` | `createMenuAnnouncer` (root singleton) | Telemetry-wrapping, locale-aware, or test-doubled announcer. |
| `CNGX_MENU_RADIO_GROUP` | `CngxMenuGroup` (via `useExisting`) | Hand-built menu host that needs to provide a radio-group contract. |
| `CNGX_MENU_SUBMENU_ITEM` | `CngxMenuItemSubmenu` (via `useExisting`) | Alternative submenu-companion implementation. |

`createMenuRadioController({ selectedValue, name })` is the pure factory for the radio-group contract when there is no `CngxMenuGroup` directive in play.

## Accessibility

Keyboard model lives in `CngxActiveDescendant` (hosted by `CngxMenu`) plus `CngxMenuTrigger`'s focus-stack model.

Closed trigger:

- `ArrowDown` / `Enter` / `Space` opens the menu and highlights the first item.
- `ArrowUp` opens the menu and highlights the last item.

Open menu:

- `ArrowDown` / `ArrowUp` moves the highlight one item, looping at the ends. Separators and disabled items are skipped.
- `Home` / `End` jumps to the first / last item.
- `Enter` / `Space` activates the highlighted item. On a submenu parent it opens the submenu and transfers focus to its first item instead.
- `Escape` closes the top submenu if one is open, otherwise closes the whole menu.
- `ArrowRight` on a submenu parent opens the submenu (W3C strategy). Other keys are noop per the default strategy.
- `ArrowLeft` closes the current submenu if one is open.
- Printable characters drive typeahead: the buffer accumulates within `typeaheadDebounce` ms and jumps to the next item whose label starts with the buffer.

Focus is captured at open time and restored to that element after the menu closes (via `queueMicrotask` so the DOM has settled).

### Dismissal paths

`CngxMenuTrigger` and `CngxContextMenuTrigger` close the menu on four sources by default. `Escape` is owned by `CngxPopover` (global document listener). The other three install through `CNGX_MENU_DISMISS_HANDLER_FACTORY` (default factory: `createMenuDismissHandler`) and only attach while the menu is open.

| Source | Default | Override |
|-|-|-|
| `Escape` | always on | `[closeOnEscape]="false"` on the popover |
| `pointerdown` outside popover and host | on | `withDismissOnOutsideClick(false)` |
| `scroll` (window) | off | `withDismissOnScroll(true)` |
| `blur` + `pointercancel` (bundled) | on | `withDismissOnBlur(false)` |

Toggle at app root:

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideCngxMenu(
      withDismissOnOutsideClick(false),
      withDismissOnScroll(true),
    ),
  ],
});
```

Or component-scope, when only one menu surface needs different policy:

```ts
@Component({
  viewProviders: [provideMenuConfigAt(withDismissOnScroll(true))],
})
```

Touch users get backdrop dismissal through the same `pointerdown` listener - no `Escape` key required. The dismissal source that fired most recently is exposed as `lastDismissSource` on both trigger directives (`exportAs: 'cngxMenuTrigger'` and `exportAs: 'cngxContextMenuTrigger'`). Swap the whole handler via `CNGX_MENU_DISMISS_HANDLER_FACTORY` when telemetry or test doubles are needed.

`'escape'` is the one dismissal source that records intent, not effect: the factory writes it synchronously on the keystroke without calling `popover.hide()`. Whether the menu actually closes is owned by `CngxPopover.closeOnEscape`. Consumers reading `lastDismissSource()` for telemetry should treat `'escape'` as "user pressed Escape" and read the popover's `state()` if they need to know whether the close actually fired.

Roles and ARIA:

- `CngxMenu` -> `role="menu"`, `aria-label="<label>"`.
- `CngxMenuItem` -> `role="menuitem"`, `aria-disabled` when disabled.
- `CngxMenuItemCheckbox` -> `role="menuitemcheckbox"`, `aria-checked` reactive.
- `CngxMenuItemRadio` -> `role="menuitemradio"`, `aria-checked` reactive to the group.
- `CngxMenuSeparator` -> `role="separator"`, `aria-orientation="horizontal"`.
- `CngxMenuGroup` -> `role="group"`, `aria-label="<label>"`.
- `CngxMenuItemSubmenu` -> adds `aria-haspopup="menu"` and `aria-expanded` to its host.
- `CngxMenuTrigger` / `CngxContextMenuTrigger` -> `aria-haspopup="menu"`, `aria-expanded` mirrored from the popover.

Every item carries `tabindex="-1"`; the active-descendant model means the menu container is the single focusable element, and `aria-activedescendant` points at the highlighted item. Highlight is communicated visually through the `cngx-menu-item--highlighted` class.

State transitions (submenu open / close, item activated, disabled-item press) are announced via a polite live region maintained by `CngxMenuAnnouncer`. The strings come from `CngxMenuConfig.ariaLabels`. Swap the implementation through `CNGX_MENU_ANNOUNCER_FACTORY` for telemetry or test doubles.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs, outputs, and full token signatures.
- Stories:
  - `examples/stories/common/interactive/menu/`
  - `examples/stories/common/interactive/menu-checkable/`
  - `examples/stories/common/interactive/menu-submenu/`
  - `examples/stories/common/interactive/menu-trigger/`
  - `examples/stories/common/interactive/context-menu/`
