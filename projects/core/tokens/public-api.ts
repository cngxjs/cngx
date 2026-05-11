/**
 * @module @cngx/core/tokens
 */
export { ENVIRONMENT, type Environment, provideEnvironment } from './environment.token';
export { WINDOW, provideWindow, injectWindow } from './window.token';
export {
  CNGX_FORM_FIELD_CONTROL,
  type CngxFormFieldControl,
} from './form-field-control.token';
export {
  CNGX_FORM_FIELD_HOST,
  type CngxFormFieldHostContract,
} from './form-field-host.token';
