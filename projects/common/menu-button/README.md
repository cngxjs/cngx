# @cngx/common/menu-button

Buttons that open a menu: the WAI-ARIA APG Menu Button Pattern as button types on the cngx button core. `button[cngxMenuButton]` is a `cngxButton` with an end caret that drives a `cngxMenu` inside a `cngxPopover`; `button[cngxIconMenuButton]` is its square, icon-only sibling; `[cngxSplitButton]` joins a main `cngxButton` and an icon menu button caret into a split button. The entry is the one place that composes `@cngx/common/button`, `@cngx/common/interactive` and `@cngx/common/popover`; nothing else imports it.

## Quick Start

```typescript
import { Component, signal } from '@angular/core';
import { CngxMenu, CngxMenuItem } from '@cngx/common/interactive';
import { CngxMenuButton } from '@cngx/common/menu-button';
import { CngxPopover } from '@cngx/common/popover';

@Component({
  selector: 'app-export',
  imports: [CngxMenu, CngxMenuItem, CngxMenuButton, CngxPopover],
  template: `
    <button cngxMenuButton="outline" [menu]="menu" [popover]="pop">Export</button>
    <div cngxPopover placement="bottom-start" #pop="cngxPopover">
      <ul cngxMenu label="Export format" (itemActivated)="format.set($event)" #menu="cngxMenu">
        <li cngxMenuItem value="pdf">PDF</li>
        <li cngxMenuItem value="csv">CSV</li>
      </ul>
    </div>
  `,
})
export class AppExport {
  readonly format = signal<unknown>(null);
}
```

## What the button wires

- `[menu]` and `[popover]` are the only bindings. `CngxMenuTrigger` (keyboard model, `aria-expanded`, dismissal, focus kept on the button) and `CngxPopoverTrigger` (CSS anchor, `aria-controls`) sit on the button as host directives.
- The popover is told it holds a menu, so `aria-haspopup` reads `menu` without a `[haspopup]`. A popover laid out as a sheet or fullscreen reads `dialog`. The hint is released when the button binds another popover or is destroyed.
- A click toggles the popover. ArrowDown, Enter or Space opens the menu and highlights the first item, ArrowUp the last. Escape closes it and focus stays on the button.
- `expanded` (a signal) mirrors the popover's visibility; the host carries `data-expanded`.

## Axes and states

Variant (through the selector value), `tone`, `size`, group membership and `provideButtonConfig` resolve exactly as on `cngxButton`. `[disabled]` renders `aria-disabled`: the button stays focusable, opens on neither click nor key, closes an open menu and reads `disabledReason` through `aria-describedby`. The menu button has no action of its own: a click opens the menu, so put async actions on the menu items, not a co-hosted `cngxAsyncClick` on the button.

## Caret

The end of the button renders a chevron inside `<cngx-icon>`, `1em` of the button font (`--cngx-menu-button-caret-size`), turned half a turn while the menu is open. The turn is timed from `--cngx-button-transition` and is instant under reduced motion. The caret is decorative and hidden from assistive technology.

- App-wide: provide a component through `CNGX_BUTTON_CARET_ICON`, for example a wrapper around a Material `arrow_drop_down` icon.
- Per button: project a `cngxButtonEnd` element; it replaces the caret on that button.

## Icon menu button

`button[cngxIconMenuButton]` is the kebab or "more" button of a row, a toolbar or a card: the same bindings and keyboard model as `cngxMenuButton`, on the icon-button skin (square, `ghost` by default). It renders the glyph you project, hidden from assistive technology, and has no caret.

```html
<button cngxIconMenuButton aria-label="Actions for Q3 report" [menu]="menu" [popover]="pop">
  <cngx-icon name="more_vert" />
</button>
```

The name is yours: name the menu after what it acts on, not after the glyph. A host without `aria-label`, `aria-labelledby` or `title` warns `CNGX1071` in development mode.

## Split button

`[cngxSplitButton]` is a button group of a main `cngxButton` that runs the default action and a `cngxIconMenuButton` caret that opens the alternatives. `variant` and `size` pass to both; the group is `role="group"` and needs a name (`CNGX1072`).

```html
<div cngxSplitButton variant="solid" aria-label="Publish">
  <button cngxButton [cngxAsyncClick]="publish">Publish</button>
  <button cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
</div>
```

- The caret needs no glyph, no name and no `[disabled]`: inside a split it renders the caret instead of any projected content (`CNGX_BUTTON_CARET_ICON` swaps it) and is named "More options" from the language pack (`menuButton.splitToggle`, override per app with `provideMenuButtonI18n(withMenuButtonI18nLabels({ splitToggle }))` or per button with `aria-label`).
- The caret follows the main button's `blocked` signal: while the main button is disabled, running its `cngxAsyncClick` or refused by `[enabled]="false"`, the caret reads `aria-disabled`, opens on neither click nor key, and an open menu closes. It carries no reason of its own in that state; the main button owns `aria-busy`, its reason and the announcement.
- `[disabled]` on the caret blocks only the alternatives and reads the caret's `disabledReason`.
- Both roles are direct children (an `ng-container` in between is fine): the caret is the `cngxIconMenuButton`, the main action the first other button, a `cngxButton` or a `cngxIconButton`. The split reads the main button through `CNGX_BUTTON_STATE`. Without a main button it warns `CNGX1073`; a `cngxActionButton` is not read as the main action yet. A button deeper inside the split, for example a kebab in a projected panel, takes neither role and keeps its own name and state.
- The split has no programmatic run entry point yet. To run a menu choice through the main action today, click the main button from the menu's `(itemActivated)` handler, so the busy state and the announcement stay in one place, and bind `succeededAnnouncement` / `failedAnnouncement` on its `cngxAsyncClick` to name the chosen action.

## Not a menu

A menu holds actions. Navigation links behind a button are a popover disclosure (`cngxButton` + `cngxPopoverTrigger` with `haspopup="none"`), content that opens in place is `cngxDisclosure`, and a control whose label shows the chosen value is `cngxSelect`.
