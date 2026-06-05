/**
 * @module @cngx/ui/stepper
 *
 * Level-4 organism - CNGX-standard `<cngx-stepper>` skin over the
 * Level-2 `CngxStepperPresenter` from `@cngx/common/stepper`.
 * Composes presenter + roving tabindex + focus restore + live
 * region via `hostDirectives`. Material consumers reach for
 * `@cngx/ui/mat-stepper` instead.
 */

export { CngxStepper } from './stepper.component';
export { CngxProgressBarStepper } from './progress-bar-stepper.component';
export { CngxDotStepper } from './dot-stepper.component';
export { CngxTextStepper } from './text-stepper.component';
export { CngxStepperFooter } from './footer/stepper-footer.component';
export {
  CngxStepperFooterStart,
  CngxStepperFooterCenter,
  CngxStepperFooterEnd,
} from './footer/stepper-footer-regions';
