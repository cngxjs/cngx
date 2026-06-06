/**
 * Public API surface of `@cngx/ui/mat-stepper`.
 *
 * The Material twin of the cngx stepper family, shipped as the
 * instrumentation directive `[cngxMatStepper]`: attach it to a vanilla
 * `<mat-stepper>` and it composes the same `CngxStepperPresenter` brain
 * as `<cngx-stepper>` (in `@cngx/ui/stepper`) via `hostDirectives`, so
 * commit-action lifecycle, router sync, and error aggregation all work
 * against Material's own markup. Mirrors `[cngxMatTabs]`.
 */
export { CngxMatStepper } from './mat-stepper.directive';
export {
  CNGX_MAT_STEP_HANDLE_FACTORY,
  createMatStepHandle,
  type CngxMatStepHandleFactory,
} from './material-bridge/handle';
