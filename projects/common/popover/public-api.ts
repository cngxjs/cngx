/**
 * @module @cngx/common/popover
 */

// Atoms
export type {
  PopoverPlacement,
  PopoverPositionTryFallback,
  PopoverState,
  PopoverMode,
} from './popover.types';
export { CngxPopover } from './popover.directive';
export { CngxPopoverTrigger } from './popover-trigger.directive';
export { CngxTooltip } from './tooltip.directive';

// Floating UI fallback (opt-in)
export {
  CNGX_FLOATING_FALLBACK,
  provideFloatingFallback,
  type ComputePositionFn,
  type FloatingFallbackConfig,
} from './floating-fallback';

// Panel molecule
export type { CngxPopoverPanelConfig, PopoverPanelFeature } from './popover-panel.types';
export {
  CNGX_POPOVER_PANEL_CONFIG,
  providePopoverPanel,
  withAutoDismiss,
  withCloseOnSuccess,
  withDefaultVariant,
  withCloseButton,
  withArrow,
} from './popover-panel.config';
export { CngxPopoverPanel } from './popover-panel.component';
export { CngxPopoverAction, type PopoverActionVariant } from './popover-action.component';
export {
  CngxPopoverHeader,
  CngxPopoverBody,
  CngxPopoverFooter,
  CngxPopoverClose,
  CngxPopoverLoading,
  CngxPopoverEmpty,
  CngxPopoverError,
} from './popover-panel-slots';
