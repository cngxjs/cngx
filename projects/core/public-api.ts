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
  CNGX_TEXT_SCALE,
  type CngxTextScaleValue,
  provideTextScale,
  injectTextScale,
} from './theming/text-scale';
export {
  CNGX_TOUCH_TARGET,
  type CngxTouchTargetValue,
  provideTouchTargets,
  injectTouchTargets,
} from './theming/touch-target';
export { CngxTouchTarget } from './theming/cngx-touch-target.directive';
export {
  CNGX_MOTION,
  type CngxMotionPreference,
  provideMotion,
  injectMotion,
} from './theming/motion';
export { CngxMotionScope } from './theming/cngx-motion-scope.directive';
export {
  CNGX_CONTRAST,
  type CngxContrastPreference,
  provideContrast,
  injectContrast,
} from './theming/contrast';
export { CngxContrast } from './theming/cngx-contrast.directive';
export {
  type CngxA11yPrefFeature,
  provideA11yPreferences,
  withDensity,
  withTextScale,
  withMotion,
  withContrast,
  withPersistence,
  CNGX_A11Y_STORAGE,
  injectA11yPreferences,
} from './theming/a11y-preferences';
