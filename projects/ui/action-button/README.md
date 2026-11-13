# CngxActionButton

A `cngxButton` that runs an async action and reports the outcome in its own label, in a live
region and, optionally, in a toast. Sits on the native `<button>`.

## Import

```typescript
import { CngxActionButton } from '@cngx/ui/action-button';
// Template slots for the status cells
import { CngxFailed, CngxPending, CngxSucceeded } from '@cngx/common/interactive';
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

## When to use it

`cngxButton` with `[cngxAsyncClick]` already gets the busy layer, `aria-busy`, the click guard
and a generic announcement ("Action succeeded"). Its label stays as written unless you switch
on `btn.status()` yourself.

Use `cngxActionButton` when the label itself should report the outcome, when the announcement
should say what the button shows, when the button reflects a run it does not own, or when the
outcome raises a toast.

Variant, tone, size, `disabled` with a reason and the busy layer work as on `cngxButton`, see
[`@cngx/common/button`](../../common/button/README.md) and
[Gated surfaces](../../../core-concepts/async-state-machine.md#gated-surfaces).

## What the user sees

The idle content and the status labels sit stacked in one cell. Only the active one is visible
and names the button, so the button is as wide as its widest label and never jumps after a run.

1. Click: the action starts, and `aria-busy`, `aria-disabled` and the click guard are set.
2. After `showDelay` (120 ms by default) the pending label replaces the idle label. Without
   one, the spinner covers the idle label. The busy visual stays for at least `minDwell`
   (400 ms).
3. The run settles. Once the busy visual releases, the success or failure label shows and
   `aria-busy`, `aria-disabled` and the guard clear. A run faster than `showDelay` shows no
   busy visual and goes from the idle label straight to the result.
4. `feedbackDuration` (2000 ms) after the release, the idle label returns.

A state without a label or template keeps the idle label. The English language pack ships
empty status labels, so a button without labels, templates or app-wide defaults never changes
its visible label: only the live region reports the outcome.

A projected template beats a bound label, and a bound `''` switches a cell off. App-wide
defaults go through `provideCngxButton(withActionStatusLabels({ ... }))`; the full order and
app-wide templates are documented on `CngxActionStatusBrain`.

```html
<button cngxActionButton [action]="save" pendingLabel="Saving...">
  Save draft
  <ng-template cngxSucceeded>Saved</ng-template>
  <ng-template cngxFailed let-err>{{ err }}, retry?</ng-template>
</button>
```

## Accessibility

The visible label is the accessible name; inactive labels are `aria-hidden`. `Enter` and
`Space` run the action, focus stays on the button.

Each outcome is written once to the live region `cngxAsyncClick` renders next to the button,
right after the settle and not held by the dwell. The text matches what the button shows:

1. `succeededAnnouncement` / `failedAnnouncement`
2. the text of the rendered result cell (template or label)
3. the language pack: "Action succeeded" / "Action failed" in English

`autoAnnounce` decides whether the region speaks:

- unbound: every outcome, except one a shown toast already announces
- `true`: every outcome, also next to a toast
- `false`: nothing. The region stays in the DOM but gets no text; drive your own from
  `(settled)` or `(outcome)`.

## Toasts

`CngxActionToast` is co-hosted. Bind `toastSuccess`, `toastError` or both, and provide a
`CngxToaster` with `provideFeedback(withToasts())` or `provideToasts()`. Without a toaster the
toast inputs do nothing.

```html
<button cngxActionButton [action]="save" toastSuccess="Draft saved" toastError="Could not save">
  Save
</button>
```

Each outcome raises one toast. A toasted outcome is not spoken by the region as well, so a
button with only `toastError` still speaks its successes. Do not add `[cngxToastOn]` to the
same button; it toasts the same outcome again
([`CNGX3008`](../../../core-concepts/error-codes/cngx3008.md)). Durations and the error detail
are documented on the toast inputs.

## External state

`[externalState]` takes a `CngxAsyncState` the button does not own, such as a form submit or a
query, and shows it as if it were its own run.

```html
<button cngxActionButton [action]="save" [externalState]="submitState" succeededLabel="Sent">
  Send
</button>
```

Labels, the busy layer, `state`, `(outcome)` and the announcement follow the bound state, once
per `success` / `error` edge. While it is pending the button refuses clicks. Own runs are not
reflected or spoken while a state is bound.

## State and outputs

|Member|What it carries|
|-|-|
|`state`|`CngxAsyncState` of the effective run, for any `[state]` consumer|
|`state.lastUpdated`|Time of the last successful own run; with `[externalState]` bound, that state's value, with no fall back to own runs|
|`status()`|Effective status, immediate (not gated by the busy visual)|
|`busyVisible()`|`true` while the spinner or pending label shows|
|`(settled)`|Once per own run, with a monotonic `generation`|
|`(outcome)`|Once per own settle and once per `[externalState]` `success` / `error` edge|

```html
<button cngxActionButton #btn="cngxActionButton" [action]="save">Save</button>
<cngx-alert [state]="btn.state" title="Save status" />
```

## Inputs

The button declares no input of its own. Each one is forwarded to a host directive.

|Input|Forwarded to|Default|
|-|-|-|
|`cngxActionButton` (variant), `tone`, `size`, `disabled`, `disabledReason`, `cngxDescribedBy`, `type`|`CngxButtonBrain`|as on `cngxButton`, variant `solid`|
|`action`|`CngxAsyncClick` (`cngxAsyncClick`)|required|
|`feedbackDuration`|`CngxAsyncClick`|`2000` ms|
|`showDelay`, `minDwell`|`CngxAsyncClick`|`CNGX_LOADING_CONFIG` (120 / 400 ms)|
|`pendingLabel`, `succeededLabel`, `failedLabel`|`CngxActionStatusBrain`|app-wide label, else the language pack (empty in English)|
|`succeededAnnouncement`, `failedAnnouncement`|`CngxActionStatusBrain`|the rendered result cell|
|`autoAnnounce`|`CngxActionStatusBrain`|unbound|
|`externalState`|`CngxActionStatusBrain`|unbound (own runs)|
|`toastSuccess`, `toastError`|`CngxActionToast`|no toast|
|`toastErrorDetail`|`CngxActionToast`|`false`|
|`toastSuccessDuration`|`CngxActionToast`|`withToasts({ defaultDuration })`, else `5000` ms|
|`toastErrorDuration`|`CngxActionToast`|`'persistent'`|

## Composition

The component is skin: template, stylesheet, `provideButtonHost()` and
`provideActionStatusHost()`. Four host directives do the work:

- `CngxButtonBrain` (`@cngx/common/button`): the button axes and the disabled contract
- `CngxAsyncClick` (`@cngx/common/interactive`): the run, the busy gate and the live region
- `CngxActionStatusBrain` (`@cngx/common/interactive`): status, label cells, the announcement
  and `[externalState]`, read through `inject(CNGX_ACTION_STATUS)` on the button's injector
- `CngxActionToast` (this entry): the toasts

For your own markup, list the same directives in `hostDirectives` (`CngxActionToast` only if
the host toasts), add the two providers and render the cells with `CngxActionStatusStack`. See
[Building a custom button host](../../common/button/README.md#building-a-custom-button-host) and
the ejected-host example (`/#/ui/action-button/async-button/ejected-host`).

## Styling

Box, paint, sizes and states come from the `cngxButton` sheet (`--cngx-button-*`). This entry
adds only the label stack. `cngxAsyncClick` still sets its `cngx-async--*` classes on the host,
but the `--cngx-async-*` tint skips `.cngx-button` hosts: the result shows as the label swap,
not as a colour.

## Migrating from `<cngx-action-button>`

- `<cngx-action-button [action]="save">Save</cngx-action-button>` becomes
  `<button cngxActionButton [action]="save">Save</button>`.
- `variant="primary" | "secondary" | "ghost"` and `ActionButtonVariant` are gone. Use
  `tone="primary"` for the old filled default, `cngxActionButton="outline"` or `"ghost"` for the
  others.
- `[enabled]="false"` becomes `[disabled]="true"`. `disabledReason` keeps working.
- The `--cngx-action-btn-*` colour, radius and padding tokens are gone. Theme the
  `--cngx-button-*` tokens instead.
- The async state tokens moved to `@cngx/common` as `--cngx-async-*`:

  |Old|New|
  |-|-|
  |`--cngx-action-btn-pending-opacity`|`--cngx-async-pending-opacity`|
  |`--cngx-action-btn-transition`|`--cngx-async-transition`|
  |`--cngx-action-btn-succeeded-{bg,color,border}`|`--cngx-async-success-{bg,color,border}`|
  |`--cngx-action-btn-failed-{bg,color,border}`|`--cngx-async-error-{bg,color,border}`|

  The colour tokens have no registered default. Unset, they follow `--cngx-color-success` /
  `--cngx-color-danger` in both colour schemes.
