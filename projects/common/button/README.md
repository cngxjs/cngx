# @cngx/common/button

Buttons that sit on the native element. `cngxButton` and `cngxIconButton` are attribute components on `<button>` and `<a>`, so native semantics, forms, `routerLink`, middle click and every attribute you write keep working on the real element. No wrapper, no inner button.

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

## Composition

- `CngxButtonStart` / `CngxButtonEnd` mark projected icons, badges or `<kbd>` hints; they are sized in `em` and trim the padding on their side.
- Slot glyphs: an `svg` or `img` is sized to `--cngx-button-icon-size` (`1.25em`, the `cngx-icon` `md` rung) whether it carries the slot marker itself or sits inside the marked element. A `<cngx-icon cngxButtonStart>` scales the same way.
- Icon fonts set their own pixel size outside any layer, so they ignore the slot size: `.material-icons` and `<mat-icon>` stay at 24px. Wrap the glyph in `<cngx-icon cngxButtonStart>` and let it inherit the size: `<mat-icon inline>` does that by itself, a plain icon-font span needs `font-size: inherit`.
- `CNGX_BUTTON_GROUP` is the contract a group provides so its children read variant and size without importing the group class.
- `CNGX_HOST_INTERACTION_STATE` (`@cngx/common/interactive`) is how the button tells a co-hosted `cngxAsyncClick` it is disabled, so both directives render the same `aria-disabled`.
- `CNGX_DESCRIBED_BY` (`@cngx/core/utils`) is the `aria-describedby` registry each button provides on its element: the static ids, the `[cngxDescribedBy]` ids, the disabled reason and a co-hosted `[cngxTooltip]` id all land in one attribute, in that order, instead of one binding overwriting the other.
