/**
 * @module @cngx/common/popover
 */

// Atoms
export type {
  ArrowEdge,
  PopoverPlacement,
  PopoverPositionTryFallback,
  PopoverState,
  PopoverMode,
  PopoverHaspopup,
  PopoverPanelRole,
  TooltipTriggerMode,
} from './popover.types';
export { CngxPopover } from './popover.directive';
export { CngxPopoverTrigger } from './popover-trigger.directive';
export { CngxPopoverAnchor } from './popover-anchor.directive';
export { CngxTooltip } from './tooltip.directive';

// Floating UI fallback (opt-in)
export {
  CNGX_FLOATING_FALLBACK,
  provideFloatingFallback,
  type ComputePositionFn,
  type FloatingFallbackConfig,
} from './floating-fallback';

// Panel molecule
export type {
  CngxPopoverPanelConfig,
  CngxPopoverPanelLabels,
  PopoverPanelFeature,
} from './popover-panel.types';
export {
  CNGX_POPOVER_PANEL_CONFIG,
  providePopoverPanel,
  withAutoDismiss,
  withCloseOnSuccess,
  withDefaultVariant,
  withCloseButton,
  withArrow,
  withArrowTemplate,
  withPopoverPanelLabels,
} from './popover-panel.config';
export {
  CNGX_POPOVER_LANGUAGE_EN,
  type CngxPopoverLanguageSection,
} from './i18n/popover-language-section';
export { CngxPopoverPanel } from './popover-panel.component';
export { CngxPopoverAction, type PopoverActionVariant } from './popover-action.component';
export {
  CNGX_POPOVER_ARROW_BOUNDS,
  type CngxPopoverArrowBounds,
} from './popover-arrow-bounds';
export {
  CngxPopoverArrow,
  type CngxPopoverArrowContext,
  CngxPopoverHeader,
  CngxPopoverBody,
  CngxPopoverFooter,
  CngxPopoverClose,
  CngxPopoverLoading,
  CngxPopoverEmpty,
  CngxPopoverError,
} from './popover-panel-slots';
export { CngxPopoverDivider } from './popover-divider.directive';
