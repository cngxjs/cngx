# @cngx/common/button

Buttons that sit on the native element. `cngxButton` and `cngxIconButton` are attribute
components on `<button>` and `<a>`, `cngxCloseButton` on `<button>`. Forms, `routerLink`, middle
click and every attribute you write keep working on the real element. No wrapper, no inner
button.

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxButton, CngxButtonStart, CngxIconButton } from '@cngx/common/button';
import { CngxAsyncClick } from '@cngx/common/interactive';

@Component({
  selector: 'app-toolbar',
  imports: [CngxButton, CngxButtonStart, CngxIconButton, CngxAsyncClick],
  template: `
    <button cngxButton tone="primary" [cngxAsyncClick]="save">
      <svg cngxButtonStart aria-hidden="true" viewBox="0 0 24 24">...</svg>
      Save
    </button>
    <button cngxButton="outline" type="submit">Submit</button>
    <a cngxButton="link" routerLink="/help">Help</a>
    <button cngxIconButton aria-label="Delete row" tone="danger" (click)="remove()">
      <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
    </button>
  `,
})
export class AppToolbar {
  readonly save = () => fetch('/api/drafts', { method: 'POST' });

  remove(): void {
    // delete the row
  }
}
```

## Axes

| Axis | Values | Bound through | Default |
|-|-|-|-|
| `variant` | `solid`, `secondary`, `outline`, `ghost`, `link` | the selector value: `cngxButton="outline"`, `[cngxButton]="v()"` | `solid` (`ghost` on `cngxIconButton`) |
| `tone` | `neutral`, `primary`, `danger` | `tone` | `neutral` |
| `size` | `xs`, `sm`, `md`, `lg` | `size` | `md` |

Each axis resolves `input ?? fixed ?? group ?? config ?? default`:

1. The input on the button.
2. Axes the host pins through `provideButtonHost(..., { fixed })`. `cngxCloseButton` pins `ghost`,
   `sm` and `neutral`.
3. A surrounding `cngxButtonGroup`, for variant and size only. Tone is per button.
4. `provideButtonConfigAt(...)` in a parent's `viewProviders`, merged over the outer config.
5. `provideButtonConfig(...)` at the root.
6. The host default.

`provideButtonConfig` takes `withButtonVariant`, `withButtonTone` and `withButtonSize`.
`provideCngxButton(...)` sets up the whole family in one call: the same config features,
`withButtonCloseIcon(MyIcon)`, `withButtonSpinner(MySpinner)` and the action status defaults
`withActionStatusLabels` / `withActionStatusTemplates` from `@cngx/common/interactive`.
`provideCngxButtonAt(...)` is its `viewProviders` twin. A feature without a `_target` is dropped
with [`CNGX1041`](../../../core-concepts/error-codes/cngx1041.md) in development. The menu-button
caret and labels go through `provideCngxMenuButton(...)` in `@cngx/common/menu-button`.

Density, text scale, touch floor, motion and contrast are not inputs. They come from the
preference axes in `@cngx/core`. `md` is the form-control row, so an `md` button lines up with
`cngxInput` and every select trigger.

## Accessibility

- `[disabled]` renders `aria-disabled="true"`, not the native attribute. The button stays in the
  tab order and `disabledReason` is read through `aria-describedby`. Clicks, middle clicks,
  `routerLink` navigation and form submission are swallowed. The one click that passes closes an
  open menu on its trigger.
- A disabled `<a cngxButton>` keeps its `href`, so the context menu can still open it in a new
  tab.
- The button merges every description source into one `aria-describedby`. A static attribute is
  read once at creation, so bind ids that change at runtime through `[cngxDescribedBy]`, not
  `[attr.aria-describedby]`.
- A `<button>` host defaults to `type="button"`, so it never submits a form by accident.
- `cngxIconButton` and `cngxCloseButton` need a name: `aria-label`, `aria-labelledby` or `title`.
  Without one they warn [`CNGX1071`](../../../core-concepts/error-codes/cngx1071.md) in
  development. Compose `[cngxTooltip]` where the glyph alone is ambiguous.
- Co-host `cngxAsyncClick` for an async action. The label keeps its place under a spinner that
  appears after 120 ms and stays at least 400 ms (`showDelay` / `minDwell`, see
  [Gated surfaces](../../../core-concepts/async-state-machine.md#gated-surfaces)). For the whole
  dwell the button reads busy and refuses a second run. `provideButtonSpinner(MySpinner)` swaps
  the ring in a subtree. Under reduced motion it stops turning.
- Every size floors to 44px on a coarse pointer, an icon button on both axes. The `link` variant
  is the inline exception (WCAG 2.5.8).
- Under forced colors every variant re-signals with system colours. Disabled is `GrayText`.

## Button group

`[cngxButtonGroup]` joins buttons, icon buttons and addons into one framed, `role="group"` row.
`orientation="vertical"` stacks them. `variant` and `size` set on the group reach every button
inside. The group needs `aria-label` or `aria-labelledby`, else it warns
[`CNGX1072`](../../../core-concepts/error-codes/cngx1072.md) in development. A group whose
children are groups is a toolbar.

- `cngxButtonGroupSeparator` draws a decorative divider between segments.
- `cngxButtonGroupAddon` gives an avatar, icon or count a segment on the button row. Its media
  is capped to `--cngx-button-group-addon-media-size` (`1lh` of the addon), so a 24px avatar
  never stretches a 20px-line row.
- Pressed or selected state is not the group's job. Use `CngxButtonToggleGroup` from
  `@cngx/common/interactive`.

## Close button

`button[cngxCloseButton]` is the icon button with the cngx X glyph, used by alerts, toasts,
banners and the popover panel. Name what it closes, not the affordance. A bare "Close" reads the
same for every dismiss target on the page.

```html
<button cngxCloseButton aria-label="Close settings dialog" (click)="close()"></button>
```

It stays `ghost`, `sm` and `neutral` inside a group and under any button config, so an app
default never makes a dismiss loud. Set `cngxCloseButton="outline"`, `size` or `tone` per
instance. Project a glyph to replace the X, or swap it for a subtree with
`provideButtonCloseIcon(MyIcon)`. `provideFeedback(withCloseIcon(...))` in `@cngx/ui/feedback`
forwards to it. `--cngx-close-button-size` and `--cngx-close-button-icon-size` size the box and
the glyph.

Migrating from `<cngx-close-button label="...">` in `@cngx/common/interactive`: write
`<button cngxCloseButton aria-label="...">` and drop `.cngx-close-button__btn` from selectors.
`--cngx-close-button-padding`, `-focus-outline`, `-focus-offset`, `-bg`, `-border` and
`-transition` are gone. The button tokens and the global focus ring take over.

## Opening a menu

Use `button[cngxMenuButton]` from [`@cngx/common/menu-button`](../menu-button/README.md), not
`cngxMenuTrigger` and `cngxPopoverTrigger` hand-wired onto a `cngxButton`. It sits on the same
brain and adds the caret:

```html
<button cngxMenuButton="outline" [menu]="menu" [popover]="pop">Export</button>
```

[Choosing a Trigger](../../../core-concepts/choosing-a-trigger.md) compares action button, menu
button, split button, select, disclosure and toggle group.

## Composition

- `CngxButtonStart` / `CngxButtonEnd` mark projected icons, badges or `<kbd>` hints. They are
  sized in `em` and trim the padding on their side. An `svg` or `img` in a slot, or inside the
  marked element, is sized to `--cngx-button-icon-size` (`1.25em`, the `cngx-icon` `md` rung).
- Icon fonts ignore the slot size: `.material-icons` and `<mat-icon>` stay at 24px. Wrap the
  glyph in `<cngx-icon cngxButtonStart>`. Under the Material icon bridge
  (`@cngx/themes/material/icon-theme`) a wrapped `<mat-icon>` takes the rung size. Without it,
  use `<mat-icon inline>`, or `font-size: inherit` on a plain icon-font span.
- The pressed state is built in on `:active`, never on a disabled or busy button. `:active` lags
  on touch and iOS Safari fires it only with a touch listener, so co-host `cngxPressable`
  (`@cngx/common/interactive`) where it matters. The button paints its `.cngx-pressed` class the
  same way.
- The ripple is opt-in: co-host `cngxRipple` (`@cngx/common/interactive`), with
  `[rippleCentered]="true"` on an icon button. Under the Material bridge a cngx button ripples
  only with the directive. The wave is off under `prefers-reduced-motion: reduce`.

## Building a custom button host

Every cngx button renders on one host directive, `CngxButtonBrain`. It owns the axes, the ARIA,
the activation guard and the busy state. Your host declares it in `hostDirectives`, forwards the
inputs it wants to expose and names itself with `provideButtonHost`. Without `provideButtonHost`
the brain throws [`CNGX1075`](../../../core-concepts/error-codes/cngx1075.md).

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CngxButtonBrain, provideButtonHost } from '@cngx/common/button';

@Component({
  selector: 'button[appChipButton]',
  changeDetection: ChangeDetectionStrategy.OnPush,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: ['variant: appChipButton', 'tone', 'size', 'disabled', 'disabledReason', 'cngxDescribedBy', 'type'],
    },
  ],
  providers: [provideButtonHost('appChipButton', { defaultVariant: 'outline' })],
  host: { class: 'app-chip-button' },
  template: `
    <ng-content />
    @if (brain.busyVisible()) {
      <span class="app-chip-button__busy" aria-hidden="true"></span>
    }
    @if (brain.disabledReason(); as reason) {
      <span [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styleUrl: './chip-button.css',
})
export class AppChipButton {
  protected readonly brain = inject(CngxButtonBrain);
}
```

Forward only the brain inputs your host should take, and alias `variant` to the selector so
`appChipButton="solid"` works. `provideButtonHost(name, { defaultVariant, fixed, iconOnly })`
fills `CNGX_BUTTON_HOST`. `name` is what development diagnostics print, `fixed` pins axes against
the group and the config, `iconOnly: true` turns on the
[`CNGX1071`](../../../core-concepts/error-codes/cngx1071.md) name check.

The host keeps its template, slots and CSS. It renders the busy layer while
`brain.busyVisible()`, with `brain.spinner` inside (the `provideButtonSpinner` glyph or `null`,
the same value `injectButtonSpinner()` returns), and the hidden reason span shown above. A
dismiss host reads its glyph through `injectButtonCloseIcon()`, a segment that sizes itself like
a button reads the scope's defaults through `injectButtonConfig()`.

The brain writes only attributes on the host element. Skin off these:

- `[data-variant]`, `[data-tone]`, `[data-size]`
- `[aria-disabled='true']`. The click guard runs in the capture phase, so this always means no
  activation, a co-located `RouterLink` included.
- `[data-pending]`, set when a run starts, before any delay. Paint the delay window off it.
- `[data-busy]`, set after `showDelay` and held for `minDwell`. Paint the shown-busy state off it.

Scope disabled rules to `:not([data-busy], [data-pending])` so a running button never paints
disabled.

A co-hosted `cngxAsyncClick` needs no wiring: the brain reads its run through
`CNGX_ASYNC_RUN_STATE` (`@cngx/common/interactive`). A host that refuses or runs on its own
provides `CNGX_BUTTON_HOST_STATE` with a `refusing` and an optional `busy` signal.

A host on `CngxActionStatusBrain` (`@cngx/common/interactive`) adds `provideActionStatusHost()`
next to `provideButtonHost`. `CngxActionButton` and `CngxPopoverAction` are built that way.

`CNGX_BUTTON_STATE` on the element injector exposes `blocked`, `busy` and `activeReasonId` to a
composing molecule. `cngxSplitButton` reads its main action through it.
