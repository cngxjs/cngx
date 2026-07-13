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
