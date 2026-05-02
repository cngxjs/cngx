/**
 * @module @cngx/core/tokens
 */
export { ENVIRONMENT, type Environment, provideEnvironment } from './src/environment.token';
export { WINDOW, provideWindow, injectWindow } from './src/window.token';
export {
  CNGX_FORM_FIELD_CONTROL,
  type CngxFormFieldControl,
} from './src/form-field-control.token';
export {
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldHostContract,
} from './src/form-field-host.token';
