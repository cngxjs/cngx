/**
 * Public API surface of `@cngx/ui/mat-stepper`.
 *
 * Material-twin organism for the cngx stepper family. Composes the same
 * `CngxStepperPresenter` brain as `<cngx-stepper>` (in `@cngx/ui/stepper`)
 * via `hostDirectives`, so commit-action lifecycle, router sync, and
 * error aggregation all work identically against `<mat-stepper>`.
 */
export { CngxMatStepper } from './src/mat-stepper.component';
export { CngxMatStepperBridge } from './src/mat-stepper.directive';
export { createMatStepHandle } from './src/material-bridge/handle';
