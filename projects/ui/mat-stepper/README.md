# @cngx/ui/mat-stepper

The Material twin of the cngx stepper family, shipped as the instrumentation directive `[cngxMatStepper]`. Attach it to a vanilla `<mat-stepper>` and it shares the same `CngxStepperPresenter` brain (from `@cngx/common/stepper`) as `<cngx-stepper>`. Material consumers gain the commit-action lifecycle, router sync, error aggregation, and the shared `CNGX_STEPPER_HOST` contract **for free** - same brain, Material's own chrome. Mirrors `[cngxMatTabs]`.

## What it does

`[cngxMatStepper]` is the instrumentation pattern: Material owns the rendering, the consumer authors native `<mat-step>` markup, cngx is the behaviour layer.

- Composes `CngxStepperPresenter` via `hostDirectives`; forwards `[activeStepIndex]`, `[linear]`, `[orientation]`, `[commitAction]`, `[commitMode]` and the `(activeStepIndexChange)` output.
- Registers one step handle per `<mat-step>` it finds (`contentChildren(MatStep)`), so the presenter tracks Material's own steps.
- Bidirectional sync between `presenter.activeStepIndex` and `MatStepper.selectedIndex`, Material writes wrapped in `untracked()` (no reactivity loops).
- Provides `CNGX_STATEFUL`, so `<cngx-toast-on />` / `<cngx-banner-on />` self-wire as children; exposes `presenter` so a `<cngx-stepper-footer>` can drive Back / Next.
- Material owns keyboard nav (`MatStepperHeader` ARIA), focus, and per-step error chrome (`[hasError]`, `errorMessage`, `<ng-template matStepperIcon>`) - the directive re-renders none of it.

## Exports

| Export | Selector / exportAs | Description |
|-|-|-|
| `CngxMatStepperBridge` | `[cngxMatStepper]` / `cngxMatStepperDirective` | Instrumentation directive for `<mat-stepper>`. |
| `CNGX_MAT_STEP_HANDLE_FACTORY` / `createMatStepHandle` | - | Swappable factory building the per-`<mat-step>` registration handle. |

Because the directive upgrades the consumer's own `<mat-stepper>`, native `<mat-step>` markup, `<ng-template matStepperIcon>`, `[hasError]`, and `errorMessage` are authored directly in Material - there is no projection constraint and no icon-forwarding shim.

## Usage

A cngx footer drives navigation instead of Material's `matStepperPrevious` / `matStepperNext` buttons. The footer sits outside the stepper and is handed the host through the directive ref.

```html
<mat-stepper cngxMatStepper #s="cngxMatStepperDirective"
  [(activeStepIndex)]="active" [commitMode]="'pessimistic'" [commitAction]="submit"
  cngxToastOn cngxBannerOn>
  <mat-step label="Method">...</mat-step>
  <mat-step label="Details">...</mat-step>
  <mat-step label="Verify">...</mat-step>
</mat-stepper>

<cngx-stepper-footer [host]="s.presenter">
  <button cngxStepperFooterStart cngxStepperPrevious>Back</button>
  <button cngxStepperFooterEnd cngxStepperNext>Continue</button>
</cngx-stepper-footer>
```

## Bidirectional sync

`createMatStepperBidirectionalSync` wires both directions once the directive is constructed:

1. **presenter → Material**: `presenter.activeStepIndex()` writes `matStepper.selectedIndex` inside `untracked()`, equality-guarded against redundant writes.
2. **Material → presenter**: `matStepper.selectionChange` calls `presenter.select(...)` when the values diverge.

The commit-action gate works because `presenter.select()` routes through the commit handler - pessimistic mode keeps Material's `selectedIndex` on origin until the action resolves.

## Errors

Error **state** flows through Material's own `<mat-step [hasError]>`; the message through Material's `errorMessage`, or for the async channel through the `cngxToastOn` / `cngxBannerOn` bridges. The cngx per-step error slots (`*cngxStepError`) are CNGX-skin-only by design - Material owns its label chrome.
