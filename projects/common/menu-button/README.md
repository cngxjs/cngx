# @cngx/common/menu-button

Buttons that open a menu, after the WAI-ARIA APG Menu Button Pattern. The entry composes
`@cngx/common/button`, `@cngx/common/interactive` and `@cngx/common/popover` into three button
types:

- `button[cngxMenuButton]`: a `cngxButton` with an end caret that opens a `cngxMenu` in a
  `cngxPopover`.
- `button[cngxIconMenuButton]`: the square, icon-only kebab or "more" button.
- `[cngxSplitButton]`: a main action and a caret that opens the alternatives, framed as one
  button group.

All three render on `CngxButtonBrain`. Variant, tone, size, group, `disabled` with a reason and
the busy layer work as on `cngxButton`; see the [`@cngx/common/button` README](../button/README.md).

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

## Menu button

`[menu]` takes the `cngxMenu` and `[popover]` the `cngxPopover` around it. The button carries
`CngxMenuTrigger` and `CngxPopoverTrigger` as host directives and toggles the popover on click.

`aria-haspopup` reads `menu` and `aria-controls` names the `role="menu"` element, without a
`[haspopup]` binding. A popover presented as a sheet or fullscreen reads `dialog` and names the
popover instead.

- ArrowDown, Enter or Space opens the menu on the first item, ArrowUp on the last.
- Focus moves into the menu, which tracks the highlighted item with `aria-activedescendant`.
- Escape or an activation closes the menu and returns focus to the button.
- Tab and Shift+Tab close it and leave focus where it went.

`expanded()` mirrors the popover's visibility, and the host carries `data-expanded`.

A disabled menu button opens on neither click nor key, and an open menu closes when the button
becomes disabled. The menu button has no action of its own, since a click opens the menu. Put
async work on the menu items, not on a `cngxAsyncClick` co-hosted on the button.

A projected `cngxButtonStart` element leads the label, as on `cngxButton`.

## Caret

The end of the button renders the `CNGX_ICON_CHEVRON_DOWN` chevron at `1em` of the button font,
turned half a turn while the menu is open. It is decorative and hidden from assistive
technology.

- `--cngx-menu-button-caret-size` sizes it.
- The turn takes `--cngx-button-transition` and is instant under reduced motion.
- `provideButtonCaretIcon(MyCaret)` swaps the glyph for every menu button and split caret below
  the provider, in `providers` or `viewProviders`. A custom host reads it with
  `injectButtonCaretIcon()`.
- A projected `cngxButtonEnd` element replaces the caret on one button.

## Icon menu button

`button[cngxIconMenuButton]` has the bindings and keyboard model of `cngxMenuButton` on the
icon-button skin: square, `ghost` by default, no caret. It renders the glyph you project.

```html
<button cngxIconMenuButton aria-label="Actions for Q3 report" [menu]="menu" [popover]="pop">
  <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
    <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
  </svg>
</button>
```

Name the button after what the menu acts on, not after the glyph. Without `aria-label`,
`aria-labelledby` or `title` it warns [`CNGX1071`](../../../core-concepts/error-codes/cngx1071.md)
in development.

## Split button

`[cngxSplitButton]` frames a main button that runs the default action and a
`cngxIconMenuButton` caret that opens the alternatives. It is a button group with
`role="group"`: `variant` and `size` pass to both buttons, and the group needs a name
([`CNGX1072`](../../../core-concepts/error-codes/cngx1072.md)).

```html
<div cngxSplitButton variant="solid" aria-label="Publish">
  <button cngxButton [cngxAsyncClick]="publish">Publish</button>
  <button cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
</div>
```

The split finds its two roles among its direct children. An `ng-container` in between is fine.

- The caret is the child that carries `CngxSplitCaret`, as `cngxIconMenuButton` does.
- The main action is the first other cngx button: `cngxButton`, `cngxIconButton`,
  `cngxActionButton` or a custom host on `CngxButtonBrain`. The split reads it through
  `CNGX_BUTTON_STATE`.
- Without a main button the split warns
  [`CNGX1073`](../../../core-concepts/error-codes/cngx1073.md).
- A button deeper inside, for example a kebab in a projected panel, takes neither role and
  keeps its own name and state.

The caret follows the main action. While the main button is disabled, running or refused by
`[enabled]="false"`, the caret reads `aria-disabled`, opens on neither click nor key, and an
open menu closes. Its `aria-describedby` names the cause: the main button's reason, or "The main
action is running" while the main action runs. The main button keeps `aria-busy` and the
announcement. `[disabled]` on the caret blocks only the alternatives and reads the caret's own
`disabledReason`.

The caret needs no glyph and no name. Inside a split it renders the caret in place of any
projected content, named "More options" by visually hidden text. An `aria-label` on the caret
wins, and the caret never writes one itself. Both strings come from the language pack (see
[Configuration](#configuration)).

The caret's menu hangs under the whole group, not under the caret. The split takes the explicit
anchor slot of the caret's popover while it is free, so a `[cngxPopoverAnchor]` of your own on
that popover keeps precedence. A pointerdown on the main button still closes an open menu.

The split has no run method. To run a menu choice through the main action, click the main
button from the menu's `(itemActivated)` handler, so the busy state and the announcement stay in
one place. Bind `succeededAnnouncement` and `failedAnnouncement` on its `cngxAsyncClick` to name
the chosen action.

### Custom caret host

`CngxSplitCaret` is the caret role as a host directive. Declare it on a
[custom button host](../button/README.md#building-a-custom-button-host), next to
`CngxMenuTrigger` and `CngxPopoverTrigger`. As a direct child of a split the host becomes the
caret, anywhere else it stays an ordinary button. The split hangs the menu under the group only
when the host co-hosts `CngxPopoverTrigger`, since it reads the caret's popover through it.

```ts
import { Component, inject } from '@angular/core';
import { CngxButtonBrain, provideButtonHost } from '@cngx/common/button';
import { CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxSplitCaret } from '@cngx/common/menu-button';
import { CngxPopoverTrigger } from '@cngx/common/popover';

@Component({
  selector: 'button[appCaret]',
  hostDirectives: [
    { directive: CngxButtonBrain, inputs: ['variant: appCaret', 'disabled', 'disabledReason'] },
    { directive: CngxMenuTrigger, inputs: ['cngxMenuTrigger: menu', 'popover'] },
    { directive: CngxPopoverTrigger, inputs: ['cngxPopoverTrigger: popover'] },
    CngxSplitCaret,
  ],
  providers: [provideButtonHost('appCaret', { defaultVariant: 'solid', iconOnly: true })],
  host: { '(click)': 'handleClick()' },
  template: `
    <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5z" /></svg>
    @if (caret.isCaret()) {
      <span class="cngx-sr-only">{{ caret.label() }}</span>
      <span [id]="caret.busyNoteId" hidden>{{ caret.busyNote() }}</span>
    }
  `,
})
export class AppCaret {
  protected readonly caret = inject(CngxSplitCaret);
  private readonly brain = inject(CngxButtonBrain);
  private readonly menu = inject(CngxMenuTrigger);
  private readonly popover = inject(CngxPopoverTrigger);

  protected handleClick(): void {
    if (this.brain.blocked() && !this.menu.isOpen()) {
      return;
    }
    this.popover.popoverRef().toggle();
  }
}
```

The directive hands the refusal to the brain as `CNGX_BUTTON_HOST_STATE` and adds the cause to
`aria-describedby`. A host that provides `CNGX_BUTTON_HOST_STATE` itself replaces that entry and
folds `caret.refusing()` into its own state.

## Configuration

`provideCngxMenuButton(...)` sets the caret glyph and the labels in one call at the root.
`provideCngxMenuButtonAt(...)` is its twin for `providers` and `viewProviders`. A feature without
a `_target` is dropped with [`CNGX1041`](../../../core-concepts/error-codes/cngx1041.md) in
development. Button-wide defaults, the close glyph and the busy glyph go through
`provideCngxButton(...)` in `@cngx/common/button`.

```typescript
provideCngxMenuButton(
  withButtonCaretIcon(MyCaret),
  withMenuButtonI18nLabels({ splitToggle: 'More actions' }),
);
```

The labels are the `menuButton` section of the [language pack](../../../core-concepts/i18n.md):
`splitToggle` names the split caret and `splitMainBusy` describes it while the main action runs.
`provideMenuButtonI18n(withMenuButtonI18nLabels({ ... }))` overrides single keys on a subtree,
and a `Signal` passed to `withMenuButtonI18nLabels` follows a runtime language switch.

## Material

`@cngx/themes/material/button-theme` renders menu buttons and split buttons as Material 3 next
to `[matMenuTriggerFor]`. The split takes the M3 split-button anatomy, which Angular Material
does not ship. `@cngx/themes/material/menu-theme` makes the `cngxMenu` dropdown read like
`mat-menu`. The `common/menu-button/menu-button/material-bridge` example shows both.

## Not a menu

A menu holds actions. Pick another trigger for anything else:

- Navigation links behind a button: a popover disclosure, `cngxButton` with
  `cngxPopoverTrigger` and `haspopup="none"`.
- Content that opens in place: `cngxDisclosure`.
- A control whose label shows the chosen value: `cngxSelect`.

The full decision table is in [Choosing a Trigger](../../../core-concepts/choosing-a-trigger.md).
