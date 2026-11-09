# CngxActionButton

Async action button on the cngx button core: status labels, visual feedback and optional toast notifications on the native `<button>`.

## Import

```typescript
import { CngxActionButton } from '@cngx/ui/action-button';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxActionButton } from '@cngx/ui/action-button';

@Component({
  selector: 'app-example',
  template: `
    <button cngxActionButton tone="primary" [action]="save" pendingLabel="Saving..." succeededLabel="Saved">
      Save Draft
    </button>
  `,
  imports: [CngxActionButton],
})
export class ExampleComponent {
  save = () => this.http.post('/api/draft', {});
}
```

## Inputs

Every input is forwarded to one of the four host directives; the button itself declares none.

|Input|Forwarded to|Default|
|-|-|-|
|`cngxActionButton` (variant)|`CngxButtonBrain`|`solid`, then group / config|
|`tone`|`CngxButtonBrain`|config, then `neutral`|
|`size`|`CngxButtonBrain`|group / config, then `md`|
|`disabled`|`CngxButtonBrain`|`false`|
|`disabledReason`|`CngxButtonBrain`|`undefined`|
|`cngxDescribedBy`|`CngxButtonBrain`|`null`|
|`type`|`CngxButtonBrain`|`'button'`|
|`action`|`CngxAsyncClick` (`cngxAsyncClick`)|required for own runs|
|`feedbackDuration`|`CngxAsyncClick`|`2000` ms|
|`showDelay`|`CngxAsyncClick`|`CNGX_LOADING_CONFIG.showDelay` (120 ms)|
|`minDwell`|`CngxAsyncClick`|`CNGX_LOADING_CONFIG.minDwell` (400 ms)|
|`pendingLabel`|`CngxActionStatusBrain`|`undefined` (idle label under the spinner)|
|`succeededLabel`|`CngxActionStatusBrain`|`undefined`|
|`failedLabel`|`CngxActionStatusBrain`|`undefined`|
|`succeededAnnouncement`|`CngxActionStatusBrain`|rendered cell, label, then `asyncClickSucceeded`|
|`failedAnnouncement`|`CngxActionStatusBrain`|rendered cell, label, then `asyncClickFailed`|
|`autoAnnounce`|`CngxActionStatusBrain`|`undefined` (speaks unless a toast covers)|
|`externalState`|`CngxActionStatusBrain`|`undefined` (own runs)|
|`toastSuccess`|`CngxActionToast`|`undefined`|
|`toastError`|`CngxActionToast`|`undefined`|
|`toastErrorDetail`|`CngxActionToast`|`false`|
|`toastSuccessDuration`|`CngxActionToast`|`withToasts({ defaultDuration })`, else `5000` ms|
|`toastErrorDuration`|`CngxActionToast`|toaster default: `'persistent'`|

`(settled)` is re-exported from `CngxAsyncClick`. Read the status layer programmatically through `inject(CNGX_ACTION_STATUS)` on the button's injector; `btn.state` stays on the class.

## Overview

`button[cngxActionButton]` is an attribute component on the native `<button>`. `CngxAsyncClick` runs as a host directive on the same element, so the button carries `aria-busy`, the async state classes and the click guard itself; every attribute you write lands on the real button. The visual axes are the `CngxButton` ones: `cngxActionButton="outline"` binds the variant, `tone` and `size` are inputs, and `provideButtonConfig` / a button group apply as for `cngxButton`.

Three feedback pathways:

1. **Labels** - `pendingLabel`, `succeededLabel`, `failedLabel` strings
2. **Template slots** - `cngxPending`, `cngxSucceeded`, `cngxFailed` directives
3. **State** - bind `btn.state` to any state consumer

The idle content and the status labels render stacked in one cell; only the active one is visible and part of the button name. The button is always as wide as its widest label, so it never jumps after a run. Without a pending label or template, the idle label stays in place under the busy spinner. The spinner follows `CNGX_LOADING_CONFIG`: it appears after `showDelay` (120 ms by default) and stays for at least `minDwell` (400 ms); override per button with `[showDelay]` / `[minDwell]`. The pending label waits for the same gate, so a fast run goes from the idle label straight to the result without a pending flash in the label or the accessible name. The success and error labels, `aria-busy` and the announcement switch at once.

## Accessibility

- **Name:** the visible label is the name; inactive labels are `aria-hidden`.
- **Busy:** `aria-busy` while the action (or a bound `[externalState]`) is pending; the button is `aria-disabled` and swallows clicks until it settles.
- **Disabled says why:** `[disabled]` renders `aria-disabled="true"` (the button stays focusable) and `disabledReason` is referenced through `aria-describedby` while disabled.
- **Announcements:** the `cngxAsyncClick` live region next to the button gets one write per settle, also for two runs that settle before change detection (both writes land in the same render pass; whether a screen reader voices both depends on the assistive technology). An external `[externalState]` success or failure is spoken once per observed edge. The text matches what the button shows, the same order for both outcomes: `succeededAnnouncement` / `failedAnnouncement` -> the rendered result cell (`cngxSucceeded` / `cngxFailed` text with `aria-hidden` parts skipped, else the label) -> `succeededLabel` / `failedLabel` -> the `CNGX_INTERACTIVE_I18N` default. The region is written after the render that follows the settle. A language switch never re-voices a shown announcement.
- **Toast and region:** an outcome a shown toast already announces (`toastSuccess` / `toastError` set and a `CngxToaster` provided) is not spoken by the region too. With only `toastError`, a success is still spoken. `[autoAnnounce]="true"` speaks next to the toast. `[autoAnnounce]="false"` keeps the region silent: it stays next to the button but receives no text, so drive your own region from `(settled)`. The input takes `boolean | undefined`; it is forwarded to `CngxActionStatusBrain`, not to `cngxAsyncClick`.
- **Keyboard:** native button; `Enter` / `Space` run the action, focus stays on the button.

## Composition

The component is skin: template, CSS and two providers. Four host directives do the work:

- **`CngxButtonBrain`** (`@cngx/common/button`): `variant`, `tone`, `size`, `disabled`, `disabledReason`, `cngxDescribedBy`, `type`. The same brain every cngx button renders on.
- **`CngxAsyncClick`** (`@cngx/common/interactive`): `action`, `feedbackDuration`, `showDelay`, `minDwell`; `(settled)` re-exported, once per own run with a monotonic `generation`. Owns the live region next to the button.
- **`CngxActionStatusBrain`** (`@cngx/common/interactive`): `pendingLabel`, `succeededLabel`, `failedLabel`, `succeededAnnouncement`, `failedAnnouncement`, `autoAnnounce`, `externalState`. Status, label cells and the announcement, read through `CNGX_ACTION_STATUS`; each label span carries `[cngxActionStatusCell]`.
- **`CngxActionToast`** (`@cngx/ui/action-button`): `toastSuccess`, `toastError`, `toastErrorDetail`, `toastSuccessDuration`, `toastErrorDuration`. One toast per outcome; covers a toasted outcome through `CNGX_ANNOUNCEMENT_COVER`.

The two providers read tokens, not the class: `CNGX_HOST_INTERACTION_STATE` spreads `CngxButtonBrain.interaction` and adds `CNGX_ACTION_STATUS.announcement`; `CNGX_BUTTON_HOST_STATE` refuses clicks while `CNGX_ACTION_STATUS.externalBusy`. An ejected template on the same four host directives and providers renders every state the component does.

- **Own run or external state:** bind `[action]` (the button runs it) or `[externalState]` (the button reflects a run it does not own). `state.lastUpdated` follows the bound source only, with no fall-through to the own runs.
- **Combines with:** `CngxPending`, `CngxSucceeded`, `CngxFailed`; `CngxToaster` for toast integration; `[cngxToastOn]` on the same element as an alternative to the toast inputs (not both, `CNGX3008`).

```html
<button cngxActionButton #btn="cngxActionButton" [action]="save">Save</button>
<cngx-alert [state]="btn.state" title="Save status" />
```

## Styling

The box, paint, sizes, disabled and busy states come from the `CngxButton` sheet (`--cngx-button-*` tokens). This component only adds the label stack. The `cngxAsyncClick` state classes are still set on the host, but `@cngx/common/theming/components/cngx-async.css` skips `.cngx-button` hosts: pending shows the button's busy ring, and the settle result is the label swap plus the live region (and the optional toast). The `--cngx-async-*` tokens do not tint this button.

## Migrating from `<cngx-action-button>`

- `<cngx-action-button [action]="save">Save</cngx-action-button>` becomes `<button cngxActionButton [action]="save">Save</button>`.
- `variant="primary" | "secondary" | "ghost"` and `ActionButtonVariant` are gone: use `tone="primary"` for the old filled default, `cngxActionButton="outline"` or `"ghost"` for the others.
- `[enabled]="false"` becomes `[disabled]="true"`; `disabledReason` keeps working.
- The `--cngx-action-btn-*` colour, radius and padding tokens are gone; theme the `--cngx-button-*` tokens instead.
- The async state tokens moved to `@cngx/common` and were renamed: `--cngx-action-btn-pending-opacity` -> `--cngx-async-pending-opacity`, `--cngx-action-btn-transition` -> `--cngx-async-transition`, `--cngx-action-btn-succeeded-{bg,color,border}` -> `--cngx-async-success-{bg,color,border}`, `--cngx-action-btn-failed-{bg,color,border}` -> `--cngx-async-error-{bg,color,border}`. The colour tokens have no registered default any more: unset, they follow `--cngx-color-success` / `--cngx-color-danger` in both colour schemes.
