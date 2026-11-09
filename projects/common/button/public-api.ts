/**
 * @module @cngx/common/button
 */

export type {
  CngxButtonVariant,
  CngxButtonTone,
  CngxButtonSize,
  CngxButtonType,
} from './button.types';

export { CngxButton } from './button.component';
export { CngxIconButton } from './icon-button.component';
export {
  CngxCloseButton,
  CNGX_BUTTON_CLOSE_ICON,
  provideButtonCloseIcon,
  injectButtonCloseIcon,
} from './close-button.component';
export { CngxButtonStart, CngxButtonEnd } from './slots';
export {
  CNGX_BUTTON_SPINNER,
  provideButtonSpinner,
  injectButtonSpinner,
} from './button-spinner.token';
export {
  CNGX_BUTTON_CONFIG,
  type CngxButtonConfig,
  type CngxButtonConfigFeature,
  provideButtonConfig,
  provideButtonConfigAt,
  withButtonVariant,
  withButtonTone,
  withButtonSize,
  injectButtonConfig,
} from './button-config';
export { CNGX_BUTTON_GROUP, type CngxButtonGroupContext } from './button-group.token';
export { CNGX_BUTTON_STATE, type CngxButtonState } from './button-state.token';
export { CngxButtonBrain } from './button-brain.directive';
export {
  provideCngxButton,
  provideCngxButtonAt,
  withButtonCloseIcon,
  withButtonSpinner,
  type CngxButtonFeature,
  type CngxButtonCloseIconFeature,
  type CngxButtonSpinnerFeature,
} from './provide-cngx-button';
export {
  CNGX_BUTTON_HOST,
  CNGX_BUTTON_HOST_STATE,
  provideButtonHost,
  type CngxButtonHostDescriptor,
  type CngxButtonHostState,
} from './button-host.token';
export { CngxButtonGroup, type CngxButtonGroupOrientation } from './button-group.directive';
export { CngxButtonGroupAddon } from './button-group-addon.directive';
export { CngxButtonGroupSeparator } from './button-group-separator.directive';
