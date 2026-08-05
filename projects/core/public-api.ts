/**
 * Public API Surface of core
 * @module @cngx/core
 */

export * from './core';
export {
  CNGX_DENSITY,
  type CngxDensityValue,
  provideDensity,
  injectDensity,
} from './theming/density';
export { CngxDensity } from './theming/cngx-density.directive';
export {
  CNGX_TOUCH_TARGET,
  type CngxTouchTargetValue,
  provideTouchTargets,
  injectTouchTargets,
} from './theming/touch-target';
export { CngxTouchTarget } from './theming/cngx-touch-target.directive';
