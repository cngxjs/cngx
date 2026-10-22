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
