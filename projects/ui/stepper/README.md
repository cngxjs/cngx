# @cngx/ui/stepper

CNGX-standard `<cngx-stepper>` organism. Composes the `CngxStepperPresenter` brain (from `@cngx/common/stepper`) with `CngxRovingTabindex` and `CngxFocusRestore` via `hostDirectives`. W3C step pattern compliant — `role="group"` + `aria-roledescription="stepper"` host, `role="region"` panels, reactive `aria-current` / `aria-busy` / `aria-describedby` on every step button.

## What it does

`<cngx-stepper>` is the cngx-native stepper skin: thin component, signals everywhere, full ARIA, optional commit-action lifecycle, optional router sync, optional error aggregation. Material consumers reach for `<cngx-mat-stepper>` (sibling `@cngx/ui/mat-stepper` entry) instead — both share the same `CngxStepperPresenter` brain.

The organism's body is template + reactive ARIA only. All state lives in the presenter (composed via `hostDirectives`). The component class is ~260 LOC; the template is ~70 lines; structural CSS lives in `styles/stepper-base.css`, thematic CSS in `stepper.component.css` — both routed through `--cngx-stepper-*` custom properties for theming.

## Exports

| Export | Selector | Description |
|-|-|-|
| `CngxStepper` | `cngx-stepper` | The organism. Composes `CngxStepperPresenter` (presenter brain), `CngxRovingTabindex` (keyboard nav), `CngxFocusRestore` (focus management) via `hostDirectives`. |

## Composed inputs (forwarded to presenter)

- `[(activeStepIndex)]: number` — two-way bindable primary value via `model<number>(0)`.
- `[linear]: boolean` — linear mode (only completed steps editable).
- `[orientation]: 'horizontal' \| 'vertical'` — strip layout direction; also drives `CngxRovingTabindex` keyboard semantics.
- `[commitAction]: CngxStepperCommitAction \| null` — async gate for step transitions.
- `[commitMode]: 'optimistic' \| 'pessimistic'` — commit-action behaviour.
- `[ariaLabel]` / `[ariaLabelledBy]` — ARIA labelling on the host landmark.
- `(activeStepIndexChange)` — emits when active step changes.

## Content projection

```html
<cngx-stepper [(activeStepIndex)]="active" aria-label="Wizard">
  <div cngxStep label="Profile">
    <ng-template cngxStepContent>Profile content…</ng-template>
  </div>
  <div cngxStepGroup label="Settings">
    <div cngxStep label="Notifications">…</div>
    <div cngxStep label="Security">…</div>
  </div>
  <div cngxStep label="Done">…</div>
</cngx-stepper>
```

`<cngxStep>` and `<cngxStepGroup>` atoms (from `@cngx/common/stepper`) register themselves with the enclosing presenter on construction. Group nodes nest steps; the strip renders both step buttons and group headers with `role="group"` + `aria-roledescription="step group"`.

## ARIA contract

The organism is W3C step-pattern compliant:

- Host element: `role="group"` + `aria-roledescription` (configurable via `withStepperFallbackLabels({ stepRoleDescription })`) + `aria-orientation` + `data-orientation` (for CSS hooks) + `aria-label` / `aria-labelledby`.
- Step button: `aria-current="step"` (when active) + `aria-controls="<step-id>-panel"` + `aria-disabled` (when disabled) + `aria-busy="true"` (during commit-action pending) + `aria-describedby="<step-id>-desc"` (always present; visibility via SR phrase).
- Step panel: `role="region"` + `aria-labelledby="<step-id>-header"` + `[hidden]="!isActive"`.
- Group header: `role="group"` + `aria-roledescription="step group"` + `data-step-depth` + `data-state` + `aria-describedby` (rolls up children's aggregated status).
- Live region: planned for Phase 3 commit-lifecycle SR announcements; deliberately NOT composed via `hostDirectives` because `CngxLiveRegion` would clobber the host's `role="group"` landmark.

## Theming

All colours / sizes / typography flow through `--cngx-stepper-*` and `--cngx-step-*` custom properties with fallback defaults. Material variants default to `--mat-sys-*` colours where appropriate. `prefers-reduced-motion` is honoured in both base and skin styles.

Key custom properties:
- `--cngx-stepper-strip-gap`, `--cngx-stepper-panel-padding`
- `--cngx-step-indicator-size`, `--cngx-step-indicator-bg`, `--cngx-step-indicator-fg`
- `--cngx-step-indicator-font-size`, `--cngx-step-indicator-font-weight`
- `--cngx-step-active-bg`, `--cngx-step-success-bg`, `--cngx-step-error-bg`
- `--cngx-step-disabled-opacity`

## Demos

- `dev-app/src/app/demos/ui/stepper/stepper-horizontal-demo/` — basic horizontal layout
- `dev-app/src/app/demos/ui/stepper/stepper-vertical-demo/` — vertical sidebar layout
- `dev-app/src/app/demos/ui/stepper/stepper-hierarchical-demo/` — nested groups + group-header status rollup
- `dev-app/src/app/demos/ui/stepper/stepper-error-aggregation-demo/` — `CngxErrorAggregator` integration on individual steps
- `dev-app/src/app/demos/ui/stepper/stepper-commit-action-demo/` — async commit lifecycle (optimistic / pessimistic + simulate-error)
- `dev-app/src/app/demos/ui/stepper/stepper-router-sync-demo/` — URL deep-linking (fragment vs queryParam mode)

## See also

- `@cngx/common/stepper` — Level-2 brain + atoms + tokens + config + i18n
- `@cngx/ui/mat-stepper` — Material-twin organism (`<cngx-mat-stepper>`)
