# @cngx/common/menu-button

Buttons that open a menu: the WAI-ARIA APG Menu Button Pattern as button types on the cngx button core. `button[cngxMenuButton]` is a `cngxButton` with an end caret that drives a `cngxMenu` inside a `cngxPopover`. The entry is the one place that composes `@cngx/common/button`, `@cngx/common/interactive` and `@cngx/common/popover`; nothing else imports it.

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

Variant (through the selector value), `tone`, `size`, group membership and `provideButtonConfig` resolve exactly as on `cngxButton`. `[disabled]` renders `aria-disabled`: the button stays focusable, opens on neither click nor key, closes an open menu and reads `disabledReason` through `aria-describedby`. A co-hosted `cngxAsyncClick` shows the busy layer as on `cngxButton`.

## Caret

The end of the button renders a chevron inside `<cngx-icon>`, `1em` of the button font (`--cngx-menu-button-caret-size`), turned half a turn while the menu is open. The turn is timed from `--cngx-button-transition` and is instant under reduced motion. The caret is decorative and hidden from assistive technology.

- App-wide: provide a component through `CNGX_BUTTON_CARET_ICON`, for example a wrapper around a Material `arrow_drop_down` icon.
- Per button: project a `cngxButtonEnd` element; it replaces the caret on that button.

## Not a menu

A menu holds actions. Navigation links behind a button are a popover disclosure (`cngxButton` + `cngxPopoverTrigger` with `haspopup="none"`), content that opens in place is `cngxDisclosure`, and a control whose label shows the chosen value is `cngxSelect`.
