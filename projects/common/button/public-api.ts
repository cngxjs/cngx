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
export { CngxCloseButton, CNGX_CLOSE_ICON } from './close-button.component';
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
// Cross-entry internal surface: the shared button brain, consumed by
// `@cngx/ui/action-button` and `@cngx/common/menu-button` so they render on
// the same core instead of a copy (ng-packagr has no cross-entry private
// surface). Each declaration carries
// its own `@internal` tag. Precedent: `@cngx/ui/mat-tabs`.
export {
  injectButtonCore,
  provideButtonDescribedBy,
  type CngxButtonCore,
  type CngxButtonCoreDefaults,
  type CngxButtonCoreInputs,
} from './button-core';
export { hasAccessibleName } from './accessible-name';
