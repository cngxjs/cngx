/**
 * Public API surface of `@cngx/ui/mat-stepper`.
 *
 * Material-twin organism for the cngx stepper family. Composes the same
 * `CngxStepperPresenter` brain as `<cngx-stepper>` (in `@cngx/ui/stepper`)
 * via `hostDirectives`, so commit-action lifecycle, router sync, and
 * error aggregation all work identically against `<mat-stepper>`.
 */
export { CngxMatStepper } from './mat-stepper.component';
export { CngxMatStepperBridge } from './mat-stepper.directive';
export {
  CNGX_MAT_STEP_HANDLE_FACTORY,
  createMatStepHandle,
  type CngxMatStepHandleFactory,
} from './material-bridge/handle';
