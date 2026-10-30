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

Density, text scale, touch floor, motion and contrast are not inputs. They come from the preference axes in `@cngx/core`: padding is SET from `--cngx-space-*`, text from the font tokens, the hit area from `--cngx-target-min`. `md` is the form-control row, so an `md` button lines up with `cngxInput` and every select trigger.

## Accessibility

- **Disabled says why.** `[disabled]` renders `aria-disabled="true"` instead of the native attribute: the button stays in the tab order, and `disabledReason` is referenced through `aria-describedby` while the button is disabled. Clicks, middle clicks, `routerLink` navigation and form submission are swallowed by a capture-phase guard. A static `aria-describedby` on the host stays; the reason id is appended to it.
- **Dynamic descriptions.** `[cngxDescribedBy]` takes ids that change at runtime (a hint that appears, a validation message); they join the attribute after the static ids and before the reason, and `null` removes them. The static `aria-describedby` attribute is read once at creation, so bind dynamic ids through the input, not through `[attr.aria-describedby]`.
- **Disabled links keep their `href`.** A disabled `<a cngxButton>` is marked with `aria-disabled` only, so the context menu can still open the link in a new tab; clicks and middle clicks are swallowed.
- **`type="button"` by default** on a `<button>` host, so a button inside a `<form>` never submits by accident. `type="submit"` and `[type]` both work. An `<a>` host gets no `type`.
- **Icon buttons need a name.** `cngxIconButton` warns `CNGX1071` in development when the host has no `aria-label`, `aria-labelledby` or `title`. A tooltip is optional and a per-icon decision; compose `[cngxTooltip]` where the glyph alone is ambiguous.
- **Busy.** Co-host `cngxAsyncClick`: the label keeps its place under a spinner, `aria-busy` and the announcement stay with the directive. Under reduced motion the ring stops turning.
- **Touch.** Every control size floors to 44px on a coarse pointer; an icon button grows its hit area through a pseudo-element and keeps its visual size. The `link` variant is the inline exception (WCAG 2.5.8).
- **Forced colors.** Every variant re-signals with system colours; disabled is `GrayText`.

## Close button

`button[cngxCloseButton]` is the icon button with the cngx X glyph, used by alerts, toasts, banners and the popover panel. Project a glyph to replace the X per instance, or provide `CNGX_CLOSE_ICON` (`provideFeedback(withCloseIcon(...))` in `@cngx/ui/feedback`) to swap it app-wide. The name is your copy on the host:

```html
<button cngxCloseButton aria-label="Close settings dialog" (click)="close()"></button>
```

It rests in the muted hint colour and lifts to the text colour on hover. It stays `ghost` and `sm` inside a group and under `provideButtonConfig`, so a dismiss affordance never turns loud by an app default; set `cngxCloseButton="outline"`, `size` or `tone` per instance. `[disabled]` with `disabledReason` keeps a blocked close focusable and says why. Size the box and the glyph with `--cngx-close-button-size` and `--cngx-close-button-icon-size`; the Material bridge sets both on the default `sm` close button so it takes the 40px Material 3 icon-button box with a 24px glyph, re-scaled in a `[data-density]` island, and a consumer value on the host still wins; `--cngx-close-button-color`, `--cngx-close-button-hover-bg` and `--cngx-close-button-radius` are the paint hooks. The coarse-pointer hit area grows through the icon button's `::before`, so a small box still meets the 44px floor. Without a name it warns `CNGX1071`.

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
- `CNGX_HOST_INTERACTION_STATE` (`@cngx/common/interactive`) is how the button tells a co-hosted `cngxAsyncClick` it is disabled, so both directives render the same `aria-disabled`.
- `CNGX_DESCRIBED_BY` (`@cngx/core/utils`) is the `aria-describedby` registry each button provides on its element: the static ids, the `[cngxDescribedBy]` ids, the disabled reason and a co-hosted `[cngxTooltip]` id all land in one attribute, in that order, instead of one binding overwriting the other.
