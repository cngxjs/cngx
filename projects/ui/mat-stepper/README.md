# @cngx/ui/mat-stepper

Material-twin `<cngx-mat-stepper>` organism. Wraps Angular Material's `<mat-stepper>` while sharing the same `CngxStepperPresenter` brain (from `@cngx/common/stepper`) as `<cngx-stepper>`. Material consumers gain commit-action lifecycle, router sync, and error aggregation **for free** — same brain, different skin.

## What it does

The `<cngx-mat-stepper>` organism is a thin wrapper around `<mat-stepper>`:

- Composes `CngxStepperPresenter` via `hostDirectives` (presenter contract identical to `<cngx-stepper>`).
- Renders Material's `<mat-stepper>` in its template; iterates `presenter.flatSteps()` to synthesize one `<mat-step>` per registered `<cngxStep>` atom.
- Bidirectional sync between `presenter.activeStepIndex` and `MatStepper.selectedIndex` via a single `effect()` whose Material writes are wrapped in `untracked()` (no reactivity loops, per `reference_signal_architecture` rule 2).
- Material owns its own keyboard nav (`MatStepperHeader` ARIA) and focus management — this organism deliberately does NOT compose `CngxRovingTabindex` / `CngxFocusRestore` (which would conflict with Material's internals).
- Group nodes flatten — Material's `<mat-step>` doesn't support nesting; depth is preserved as a `data-step-depth` attribute on the rendered label for CSS hooks.

## Exports

| Export           | Selector           | Description                                                                       |
| ---------------- | ------------------ | --------------------------------------------------------------------------------- |
| `CngxMatStepper` | `cngx-mat-stepper` | The Material-twin organism. Composes `CngxStepperPresenter` via `hostDirectives`. |

**Only `<cngxStep>` atoms are accepted as content.** Native `<mat-step>` siblings are NOT supported — see `.internal/architektur/stepper-accepted-debt.md §1` for the structural rationale (Angular content-projection DI ordering blocks the adoption pattern; both attempted plans archived under `.internal/architektur/plans/halted/`).

## Bidirectional sync

The organism's constructor wires two effects (after `afterNextRender` ensures `viewChild.required(MatStepper)` resolves):

1. **presenter → Material**: an `effect()` reads `presenter.activeStepIndex()` and writes `matStepper.selectedIndex` inside `untracked()`. Equality guard suppresses redundant writes.
2. **Material → presenter**: subscribes to `matStepper.selectionChange` via `takeUntilDestroyed`, calls `presenter.select(event.selectedIndex)` when the values diverge.

Material's commit-action gate works because `presenter.select()` routes through the commit handler — pessimistic mode keeps Material's `selectedIndex` on origin until success.

