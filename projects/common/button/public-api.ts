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
export { CngxButtonStart, CngxButtonEnd } from './slots';
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
export { CngxButtonGroup, type CngxButtonGroupOrientation } from './button-group.directive';
export { CngxButtonGroupAddon } from './button-group-addon.directive';
export { CngxButtonGroupSeparator } from './button-group-separator.directive';
