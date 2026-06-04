# Mat Stepper Material Bridge

Material-side adapter that wires `@cngx/common/stepper` onto `@angular/material/stepper`. Translates `MatStep` instances into `CngxStepRegistration` handles the presenter understands, and installs the bidirectional `selectedIndex` sync that keeps `CngxStepperPresenter.activeStepIndex` and `MatStepper.selectedIndex` in lockstep without reactivity loops.

Internal seam: both `<cngx-mat-stepper>` (the wrapper component) and `[cngxMatStepper]` (the instrumentation directive) call into this folder. Consumers never instantiate these helpers directly.

## Import

```ts
import {
  CNGX_MAT_STEP_HANDLE_FACTORY,
  createMatStepHandle,
  type CngxMatStepHandleFactory,
} from '@cngx/ui/mat-stepper';
```

## Quick start

The default factory is `providedIn: 'root'`, so the bridge runs without setup. Override the handle factory via DI when wrapping with telemetry, swapping the id strategy, or pinning ids in tests:

```ts
import { ApplicationConfig } from '@angular/core';
import {
  CNGX_MAT_STEP_HANDLE_FACTORY,
  createMatStepHandle,
  type CngxMatStepHandleFactory,
} from '@cngx/ui/mat-stepper';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: CNGX_MAT_STEP_HANDLE_FACTORY,
      useValue: ((step, idSeed) => {
        const setup = createMatStepHandle(step, idSeed);
        reportStepRegistered(setup.handle.id);
        return setup;
      }) satisfies CngxMatStepHandleFactory,
    },
  ],
};
```

The supplied `idSeed` defaults to `() => nextUid('cngx-mat-step-')`. An override is free to call it, ignore it, or replace it with a server-synced / deterministic id strategy.

## What the bridge wires

| Slot | Source | Behaviour |
|-|-|-|
| `handle.id` | `idSeed()` | Fresh id per `MatStep`. Label collisions never produce duplicate ids. |
| `handle.kind` | constant | Fixed `'step'`. Material has no native group-of-steps concept. |
| `handle.label` | `MatStep.label` -> `MatStep.ariaLabel` -> static text from `matStepLabel` template -> `Step <id>` | Snapshot read once at registration. Runtime label changes do not propagate (see `stepper-accepted-debt §4`). |
| `handle.disabled` | constant | Fixed `false`. Material owns gating via `linear` / `editable` / `completed`. |
| `handle.state` | `computed()` over `MatStep.hasError` / `MatStep.completed` | Tracks `_completedOverride` through the CDK getter. Unpaired `hasError` writes do not re-fire (see `stepper-accepted-debt §4`). |
| `handle.errorAggregator` | shared `signal(undefined)` | Material's own error surface stays authoritative; cngx-side aggregation is intentionally off. |
| `selectedIndex` sync | `createMatStepperBidirectionalSync` | Presenter -> Material via `effect()` + equality guard; Material -> presenter via `selectedIndexChange` with re-entrancy guard. Eager-advance reconciled the same way as `[cngxMatTabs]`. |

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for token signatures and option shapes.
- `@cngx/common/stepper` for the presenter brain and the `CngxStepRegistration` contract.
- `@cngx/ui/mat-stepper` for the consumer-facing `<cngx-mat-stepper>` organism and `[cngxMatStepper]` instrumentation directive.
