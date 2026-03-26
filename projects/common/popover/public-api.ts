/**
 * @module @cngx/common/popover
 */

// Atoms
export type { PopoverPlacement, PopoverState, PopoverMode } from './src/popover.types';
export { CngxPopover } from './src/popover.directive';
export { CngxPopoverTrigger } from './src/popover-trigger.directive';
export { CngxTooltip } from './src/tooltip.directive';

// Panel molecule
export type { CngxPopoverPanelConfig, PopoverPanelFeature } from './src/popover-panel.types';
export {
  CNGX_POPOVER_PANEL_CONFIG,
  providePopoverPanel,
  withAutoDismiss,
  withCloseOnSuccess,
  withDefaultVariant,
  withCloseButton,
  withArrow,
} from './src/popover-panel.config';
export { CngxPopoverPanel } from './src/popover-panel.component';
export { CngxPopoverAction, type PopoverActionVariant } from './src/popover-action.component';
export {
  CngxPopoverHeader,
  CngxPopoverBody,
  CngxPopoverFooter,
  CngxPopoverClose,
  CngxPopoverLoading,
  CngxPopoverEmpty,
  CngxPopoverError,
} from './src/popover-panel-slots';
