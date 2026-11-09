# @cngx/common/button

Buttons that sit on the native element. `cngxButton` and `cngxIconButton` are attribute components on `<button>` and `<a>`, `cngxCloseButton` on `<button>`, so native semantics, forms, `routerLink`, middle click and every attribute you write keep working on the real element. No wrapper, no inner button.

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

`variant` and `size` resolve `input ?? group ?? config ?? default`; `tone` resolves `input ?? config ?? default`, because a group passes only variant and size. Set app defaults with `provideButtonConfig(withButtonVariant(...), withButtonTone(...), withButtonSize(...))`, a subtree with `provideButtonConfigAt(...)` in `viewProviders`.

`provideCngxButton(...)` takes the same config features plus `withButtonCloseIcon(MyIcon)` and `withButtonSpinner(MySpinner)`, so the whole family is set up in one call at the root; `provideCngxButtonAt(...)` is its twin for `viewProviders` and merges the config over the parent scope. A feature without a `_target` is dropped with `CNGX1041` in development. The menu-button caret and labels go through `provideCngxMenuButton(...)` in `@cngx/common/menu-button`.

Density, text scale, touch floor, motion and contrast are not inputs. They come from the preference axes in `@cngx/core`: padding is SET from `--cngx-space-*`, text from the font tokens, the hit area from `--cngx-target-min`. `md` is the form-control row, so an `md` button lines up with `cngxInput` and every select trigger.

## Accessibility

- **Disabled says why.** `[disabled]` renders `aria-disabled="true"` instead of the native attribute: the button stays in the tab order, and `disabledReason` is referenced through `aria-describedby` while the button is disabled. Clicks, middle clicks, `routerLink` navigation and form submission are swallowed by a capture-phase guard whenever the button reads `aria-disabled="true"`, including while a co-hosted `cngxAsyncClick` runs or refuses through `[enabled]="false"`; the one click that passes is the one that closes an open menu on its trigger. A static `aria-describedby` on the host stays; the reason id is appended to it.
- **Dynamic descriptions.** `[cngxDescribedBy]` takes ids that change at runtime (a hint that appears, a validation message); they join the attribute after the static ids and before the reason, and `null` removes them. The static `aria-describedby` attribute is read once at creation, so bind dynamic ids through the input, not through `[attr.aria-describedby]`.
- **Disabled links keep their `href`.** A disabled `<a cngxButton>` is marked with `aria-disabled` only, so the context menu can still open the link in a new tab; clicks and middle clicks are swallowed.
- **`type="button"` by default** on a `<button>` host, so a button inside a `<form>` never submits by accident. `type="submit"` and `[type]` both work. An `<a>` host gets no `type`.
- **Icon buttons need a name.** `cngxIconButton` warns `CNGX1071` in development when the host has no `aria-label`, `aria-labelledby` or `title`. A tooltip is optional and a per-icon decision; compose `[cngxTooltip]` where the glyph alone is ambiguous.
- **Busy.** Co-host `cngxAsyncClick`: the label keeps its place under a spinner, `aria-busy` and the announcement stay with the directive. The spinner follows `CNGX_LOADING_CONFIG`: it appears after `showDelay` (120 ms by default, so a fast run shows none) and stays for at least `minDwell` (400 ms). `pending()` and the settle announcement are immediate; `aria-busy`, `aria-disabled` and the click guard are set at the click and held until the busy visual releases, so for the whole dwell the button reads busy and refuses a second run (never native `disabled`, so it keeps focus). Override per button with `[showDelay]` / `[minDwell]` next to `cngxAsyncClick`. Under reduced motion the ring stops turning. Swap the ring for every button in a subtree with `provideButtonSpinner(MySpinner)` (`CNGX_BUTTON_SPINNER`); the layer stays (over the label, `aria-hidden`, same timing), only the glyph inside it changes. Without a provider the DOM is the built-in ring.
- **Busy DOM contract (for skins).** The host carries two reflected attributes a skin can key on: `data-pending` (`'true' | null`) is set immediately at the click from `pending()`, before any delay; `data-busy` (`'true' | null`) follows the gated busy visual - set only after `showDelay` and held for the dwell. Paint the delay window off `data-pending` and the shown-busy state off `data-busy`; scope your disabled rules to `:not([data-busy], [data-pending])` so a pending or busy button never paints disabled.
- **Touch.** Every control size floors to 44px on a coarse pointer; an icon button grows its hit area through a pseudo-element and keeps its visual size. The `link` variant is the inline exception (WCAG 2.5.8).
- **Forced colors.** Every variant re-signals with system colours; disabled is `GrayText`.

## Close button

`button[cngxCloseButton]` is the icon button with the cngx X glyph, used by alerts, toasts, banners and the popover panel. Project a glyph to replace the X per instance, or call `provideButtonCloseIcon(MyIcon)` (the `CNGX_BUTTON_CLOSE_ICON` token; `provideFeedback(withCloseIcon(...))` in `@cngx/ui/feedback` forwards to it) to swap it app-wide. A custom host reads it with `injectButtonCloseIcon()`. The name is your copy on the host; name what it closes, not the affordance, since a bare "Close" reads the same for every dismiss target on the page:

```html
<button cngxCloseButton aria-label="Close settings dialog" (click)="close()"></button>
```

It rests in the muted hint colour and lifts to the text colour on hover. It stays `ghost`, `sm` and `neutral` inside a group and under `provideButtonConfig` (a configured `withButtonTone('danger')` included), so a dismiss affordance never turns loud by an app default; set `cngxCloseButton="outline"`, `size` or `tone` per instance. `[disabled]` with `disabledReason` keeps a blocked close focusable and says why. Size the box and the glyph with `--cngx-close-button-size` and `--cngx-close-button-icon-size`; the Material bridge sets both on the default `sm` close button so it takes the 40px Material 3 icon-button box with a 24px glyph, re-scaled in a `[data-density]` island, and a consumer value on the host still wins; `--cngx-close-button-color`, `--cngx-close-button-hover-bg` and `--cngx-close-button-radius` are the paint hooks. The coarse-pointer hit area grows through the icon button's `::before`, so a small box still meets the 44px floor. Without a name it warns `CNGX1071`.

Migrating from `<cngx-close-button label="...">` in `@cngx/common/interactive`: import `CngxCloseButton` from `@cngx/common/button`, write `<button cngxCloseButton aria-label="...">`, and drop the inner `.cngx-close-button__btn` from selectors; `--cngx-close-button-padding`, `-focus-outline`, `-focus-offset`, `-bg`, `-border` and `-transition` are gone (the button tokens and the global focus ring take over).

## Opening a menu

A button that opens a menu is its own button type: `button[cngxMenuButton]` in `@cngx/common/menu-button`. It renders on the same core as `cngxButton` (variant, tone, size, group, disabled, busy), adds the end caret, and wires the menu with two bindings:

```html
<button cngxMenuButton="outline" [menu]="menu" [popover]="pop">Export</button>
```

Do not hand-wire `cngxMenuTrigger` and `cngxPopoverTrigger` onto a `cngxButton`; the menu button sets the anchor, `aria-haspopup="menu"`, the click toggle and the keyboard guard for you. The same entry ships `button[cngxIconMenuButton]` for a kebab or "more" button and `[cngxSplitButton]` for a main action with a caret that opens the alternatives. See the [`@cngx/common/menu-button` README](../menu-button/README.md).

Which trigger? Action button, menu button, split button, select, disclosure or toggle group: see [Choosing a Trigger](https://cngxjs.github.io/cngx/additional-documentation/choosing-a-trigger.html).

## Composition

- `CngxButtonStart` / `CngxButtonEnd` mark projected icons, badges or `<kbd>` hints; they are sized in `em` and trim the padding on their side.
- Slot glyphs: an `svg` or `img` is sized to `--cngx-button-icon-size` (`1.25em`, the `cngx-icon` `md` rung) whether it carries the slot marker itself or sits inside the marked element. A `<cngx-icon cngxButtonStart>` scales the same way.
- Icon fonts set their own pixel size outside any layer, so they ignore the slot size: `.material-icons` and `<mat-icon>` stay at 24px. Wrap the glyph in `<cngx-icon cngxButtonStart>` and let it inherit the size: `<mat-icon inline>` does that by itself, a plain icon-font span needs `font-size: inherit`. With the Material icon bridge (`@cngx/themes/material/icon-theme`, or the whole `@cngx/themes/material/theme`) a `<mat-icon>` wrapped in `<cngx-icon>` takes the rung size, the same size an svg glyph has in that slot or icon button: `<cngx-icon cngxButtonStart><mat-icon>add</mat-icon></cngx-icon>`. A bare `<mat-icon>` is not the pattern.
- The pressed state is built in: `:active` paints the hover mix one step stronger (`--cngx-button-pressed-layer` on a solid primary or danger fill, next to `--cngx-button-hover-layer` for hover; `--cngx-button-pressed-wash` on outline and ghost; the Material bridge maps them to the M3 hover and pressed state layers), never on a disabled or busy button. `:active` lags on touch and iOS Safari only fires it with a touch listener, so co-host `cngxPressable` (`@cngx/common/interactive`) to sharpen it: the button styles the `.cngx-pressed` class it sets on pointerdown the same way.
- The ripple wave stays opt-in decoration: co-host `cngxRipple` (`@cngx/common/interactive`) on a `cngxButton` or `cngxIconButton` where you want the wave, and add `[rippleCentered]="true"` on a square icon button. Material buttons ripple by default; a cngx button under the Material bridge ripples only with the directive. The wave is off under `prefers-reduced-motion: reduce`.
- A `cngxButtonGroupAddon` sits on the row of the buttons beside it: it carries their `data-size` and reads their padding and type tokens. Media children (`img`, `svg`, `picture`, `video`, `canvas`, `cngx-icon`, `cngx-avatar`) are capped to `--cngx-button-group-addon-media-size`, SET to `1lh` of the addon, so a 24px avatar never stretches a 20px-line row. Set it on the addon for a different cap.
- `CNGX_BUTTON_GROUP` is the contract a group provides so its children read variant and size without importing the group class.
- `CNGX_HOST_INTERACTION_STATE` (`@cngx/common/interactive`) is how `CngxButtonBrain` tells a co-hosted `cngxAsyncClick` the button is disabled, so both directives render the same `aria-disabled`.
- `CNGX_DESCRIBED_BY` (`@cngx/core/utils`) is the `aria-describedby` registry the brain provides on the button element: the static ids, the `[cngxDescribedBy]` ids, the disabled reason and a co-hosted `[cngxTooltip]` id all land in one attribute, in that order, instead of one binding overwriting the other.

## Building a custom button host

Every cngx button renders on one host directive, `CngxButtonBrain`. It owns the state and the ARIA: the axes, `data-variant` / `data-tone` / `data-size`, `disabled` as `aria-disabled`, the capture-phase activation guard, the `aria-describedby` registry, `data-pending` / `data-busy` from a co-hosted runner or a run the host reflects, and the `CNGX1071` name check for icon-only hosts. A host that declares the brain without `provideButtonHost` throws `CNGX1075`. A host of your own declares it in `hostDirectives`, forwards the inputs it wants to expose, and names itself with `provideButtonHost`:

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

- **Inputs.** `variant`, `tone`, `size`, `disabled`, `disabledReason`, `cngxDescribedBy` and `type` live on the brain. Forward only the ones the host should take; alias `variant` to the selector so `appChipButton="solid"` works.
- **Descriptor.** `provideButtonHost(name, { defaultVariant, fixed, iconOnly })`: `name` is the public selector, printed in brackets in development diagnostics; `fixed` pins axes against the group and the config (the input still wins); `iconOnly: true` turns on the `CNGX1071` name check.
- **What the host keeps.** Its template, its slots, its CSS, the busy layer (render it from `brain.busyVisible()`, with `brain.spinner` as the glyph when it is set) and the reason span (`[id]="brain.reasonId"`, `hidden`, the text from `brain.disabledReason()`, rendered only while a reason is set). The brain sets only attributes on the host element, so the skin reads `[data-variant]`, `[data-tone]`, `[data-size]`, `[aria-disabled='true']`, `[data-pending]` and `[data-busy]`.
- **Refusal or a run of its own.** Provide `CNGX_BUTTON_HOST_STATE` on the host with a `refusing` signal and an optional `busy` signal; the brain folds them into the guard, `aria-disabled`, `data-pending` and the state a co-hosted runner reads. Without a co-hosted runner, `busy` also opens `busyVisible()` (and `data-busy`) on the `CNGX_LOADING_CONFIG` show delay and min-dwell, so the busy layer shows for a run the host reflects on its own. The brain reads the token on first use, so a factory that injects the host component is safe.
- **Co-hosted runners.** `cngxAsyncClick` on the host publishes its run through `CNGX_ASYNC_RUN_STATE` (`@cngx/common/interactive`); the brain reads it from there, so the busy layer, `data-pending` and `aria-disabled` follow the run without any wiring in the host.
- **Status labels.** A host on `CngxActionStatusBrain` (`@cngx/common/interactive`) adds `provideActionStatusHost()` next to `provideButtonHost`: it passes the status brain's announcement to the runner's live region and makes a bound `[externalState]` in flight refuse clicks and read as busy. `CngxActionButton` and `CngxPopoverAction` are built that way.
- **Reading the state.** `CNGX_BUTTON_STATE` on the element injector exposes `blocked`, `busy` and `activeReasonId`; `cngxSplitButton` reads its main action through it.
