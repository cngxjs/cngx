/**
 * @module @cngx/common/interactive
 */
export { CngxAsyncClick, type AsyncAction } from './async-click/async-click.directive';
export { CngxPending, CngxSucceeded, CngxFailed } from './async-click/async-status-templates';
export {
  CngxAsyncStatus,
  reflectAsyncDisplayStatus,
  type CngxAsyncDisplayStatus,
} from './async-status/async-status.directive';
export { type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
export { CngxCopyText } from './copy/copy-text.directive';
export { CngxCopyBlock } from './copy/copy-block';
export { CngxRipple } from './ripple/ripple.directive';
export { CngxPressable } from './ripple/pressable.directive';
export { CngxPressRipple } from './ripple/press-ripple.directive';
export {
  CNGX_NAV_CONFIG,
  provideNavConfig,
  injectNavConfig,
  withSingleAccordion,
  withNavIndent,
  withNavAnimation,
  type CngxNavConfig,
  type NavConfigFeature,
} from './nav/nav-config';
export { CngxNavGroup } from './nav/nav-group.directive';
export { CngxNavGroupRegistry } from './nav/nav-group-registry';
export { CngxNavLabel } from './nav/nav-label.directive';
export { CngxNavLink } from './nav/nav-link.directive';
export { CngxNavBadge, type NavBadgeVariant } from './nav/nav-badge.directive';
export { CngxDisclosure } from './nav/disclosure.directive';
export { CngxExpandable } from './expandable/expandable.directive';
export { CngxHoverIntent } from './hover-intent/hover-intent.directive';
export {
  CNGX_CONTROL_VALUE,
  type CngxControlValue,
} from './control-value/control-value.token';
export {
  createSliderCore,
  type CngxSliderCore,
  type CngxSliderCoreOptions,
} from './slider/slider-core';
export { CngxSlider } from './slider/slider.component';
export { CngxRangeSlider } from './slider/range-slider.component';
export { CngxSliderTrack } from './slider/slider.directive';
export { CngxRangeSliderTrack } from './slider/range-slider.directive';
export { CngxSliderThumb } from './slider/slider-thumb.directive';
export {
  CNGX_SLIDER_RANGE,
  type CngxSliderRangeHost,
  type CngxSliderThumbBounds,
  type CngxSliderThumbPosition,
} from './slider/range-slider.token';
export { CngxAccordion } from './accordion/accordion.directive';
export { CngxAccordionPanel } from './accordion/accordion-panel.directive';
export { CNGX_ACCORDION, type CngxAccordionHost } from './accordion/accordion.token';
export {
  createAccordionKeyboardNav,
  type CngxAccordionHeaderHandle,
  type CngxAccordionKeyboardNav,
  type CngxAccordionKeyboardNavHost,
  type CngxAccordionKeyboardNavOptions,
} from './accordion/accordion-keyboard-nav';
export { CngxBreadcrumb } from './breadcrumb/breadcrumb.directive';
export { CNGX_BREADCRUMB, type CngxBreadcrumbHost } from './breadcrumb/breadcrumb.token';
export { CngxBreadcrumbItem } from './breadcrumb/breadcrumb-item.directive';
export { CngxBreadcrumbSeparator } from './breadcrumb/breadcrumb-separator.directive';
export {
  createBreadcrumbCollapse,
  type CngxBreadcrumbCollapseStrategy,
} from './breadcrumb/breadcrumb-collapse';
export { CNGX_BREADCRUMB_COLLAPSE_STRATEGY } from './breadcrumb/breadcrumb-collapse.token';
export {
  DEFAULT_BREADCRUMB_WIDTH_TIERS,
  resolveBreadcrumbTier,
  type CngxBreadcrumbWidthTier,
} from './breadcrumb/breadcrumb-responsive';
export { CngxToggle } from './toggle/toggle.component';
export { CngxCheckbox } from './checkbox/checkbox.component';
export { CngxCheckboxGroup } from './checkbox-group/checkbox-group.component';
export {
  CNGX_BUTTON_TOGGLE_GROUP,
  type CngxButtonToggleGroupContract,
} from './button-toggle/button-toggle-group.token';
export { CngxButtonToggleGroup } from './button-toggle/button-toggle-group.component';
export {
  CNGX_BUTTON_MULTI_TOGGLE_GROUP,
  type CngxButtonMultiToggleGroupContract,
} from './button-toggle/button-multi-toggle-group.token';
export { CngxButtonMultiToggleGroup } from './button-toggle/button-multi-toggle-group.component';
export { CngxButtonToggle } from './button-toggle/button-toggle.directive';
export {
  CNGX_RADIO_GROUP,
  type CngxRadioGroupContract,
  type CngxRadioRegistration,
} from './radio/radio-group.token';
export { CngxRadioGroup } from './radio/radio-group.component';
export { CngxRadio } from './radio/radio.component';
export {
  CNGX_CHIP_GROUP_HOST,
  type CngxChipGroupHost,
} from './chip-group/chip-group-host.token';
export { CngxChipInteraction } from './chip-interaction/chip-interaction.directive';
export { CngxChipInGroup } from './chip-in-group/chip-in-group.directive';
export { CngxChipGroup } from './chip-group/chip-group.component';
export { CngxMultiChipGroup } from './multi-chip-group/multi-chip-group.component';
export { CngxChipInput } from './chip-input/chip-input.directive';
export {
  CNGX_TREE_CONTROLLER_FACTORY,
  createTreeController,
  type CngxTreeController,
  type CngxTreeControllerFactory,
  type CngxTreeControllerOptions,
} from './tree-controller/tree-controller';
export { createTreeAdItems } from './tree-controller/tree-ad-items';
export {
  CNGX_TREE_CONFIG,
  injectTreeConfig,
  provideTreeConfig,
  provideTreeConfigAt,
  withDefaultInitiallyExpanded,
  withDefaultKeyFn,
  withDefaultLabelFn,
  withDefaultNodeIdFn,
  withTreeCacheLimit,
  type CngxTreeConfig,
  type CngxTreeConfigFeature,
} from './tree-controller/tree-config';
export { CngxHierarchicalNav } from './hierarchical-nav/hierarchical-nav.directive';
export {
  CNGX_HIERARCHICAL_NAV_STRATEGY,
  createW3CTreeStrategy,
  type CngxHierarchicalNavAction,
  type CngxHierarchicalNavContext,
  type CngxHierarchicalNavStrategy,
} from './hierarchical-nav/hierarchical-nav-strategy';
export { withRetry, type RetryConfig, type RetryState } from './retry/with-retry';
export { optimistic, type OptimisticState } from './optimistic/optimistic';
export { CngxLongPress } from './gestures/long-press.directive';
export { CngxSwipe } from './gestures/swipe.directive';
export { CngxSwipeDismiss } from './gestures/swipe-dismiss.directive';
export type { SwipeAxis, SwipeDirection } from './gestures/swipe-direction';
export {
  CngxReorder,
  type CngxReorderEvent,
  type CngxReorderModifier,
} from './reorder/reorder.directive';
export {
  CNGX_CHIP_STRIP_ROVING_FACTORY,
  createChipStripRoving,
  type CngxChipStripRovingController,
  type CngxChipStripRovingFactory,
  type CngxChipStripRovingOptions,
} from './reorder/chip-strip-roving';
export { CngxKeyboardShortcut } from './keyboard/keyboard-shortcut.directive';
export { CngxSearch } from './keyboard/search.directive';
export { CngxClickOutside } from './keyboard/click-outside.directive';
export { CngxBeforeUnload } from './guard/before-unload.directive';
export { canDeactivateWhenClean } from './guard/can-deactivate';
export { CngxCloseButton, CNGX_CLOSE_ICON } from './close-button/close-button';
export { CngxHoverable } from './hoverable/hoverable.directive';
export { CngxSpeak } from './speak/speak.directive';
export { CngxOption } from './listbox/option.directive';
export { CngxOptionGroup } from './listbox/option-group.directive';
export {
  CNGX_OPTION_CONTAINER,
  type CngxOptionContainer,
  type CngxOptionContainerGroup,
  type CngxOptionContainerOption,
} from './listbox/option-container';
export {
  CNGX_OPTION_STATUS_HOST,
  type CngxOptionStatus,
  type CngxOptionStatusHost,
} from './listbox/option-status-host';
export {
  CNGX_OPTION_FILTER_HOST,
  type CngxOptionFilterHost,
} from './listbox/option-filter-host';
export {
  CNGX_OPTION_INTERACTION_HOST,
  type CngxOptionInteractionHost,
} from './listbox/option-interaction-host';
export { CngxListbox } from './listbox/listbox.directive';
export {
  CngxListboxSearch,
  type ListboxMatchFn,
} from './listbox/listbox-search.directive';
export { CngxListboxTrigger } from './listbox/listbox-trigger.directive';
export { CngxMenu } from './menu/menu.directive';
export { CNGX_MENU_HOST, type CngxMenuHost } from './menu/menu-host.token';
export {
  CNGX_MENU_SUBMENU_ITEM,
  type CngxMenuSubmenuLike,
} from './menu/menu-submenu.token';
export { CngxMenuItem } from './menu/menu-item.directive';
export {
  CngxMenuItemIcon,
  CngxMenuItemKbd,
  CngxMenuItemLabel,
  CngxMenuItemSuffix,
} from './menu/menu-item-slot.directives';
export { CngxMenuItemSubmenu } from './menu/menu-item-submenu.directive';
export { CNGX_SUBMENU_TRY_FALLBACKS } from './menu/submenu-defaults';
export { CngxMenuItemCheckbox } from './menu/menu-item-checkbox.directive';
export { CngxMenuItemRadio } from './menu/menu-item-radio.directive';
export { CngxMenuGroup } from './menu/menu-group.directive';
export { CngxMenuSeparator } from './menu/menu-separator.directive';
export {
  CNGX_MENU_NAV_STRATEGY,
  createW3CMenuStrategy,
  type CngxMenuNavAction,
  type CngxMenuNavContext,
  type CngxMenuNavStrategy,
} from './menu/menu-nav-strategy';
export {
  CNGX_MENU_CONFIG,
  DEFAULT_MENU_CONFIG,
  injectMenuConfig,
  provideMenuConfig,
  provideMenuConfigAt,
  type CngxMenuAriaLabels,
  type CngxMenuConfig,
  type CngxMenuConfigFeature,
} from './menu/menu-config';
export {
  withAriaLabels,
  withCloseOnSelect,
  withDismissOnBlur,
  withDismissOnOutsideClick,
  withDismissOnScroll,
  withSubmenuCloseDelay,
  withSubmenuOpenDelay,
  withTypeaheadDebounce,
} from './menu/menu-config-features';
export {
  CNGX_MENU_DISMISS_HANDLER_FACTORY,
  createMenuDismissHandler,
  createMenuTriggerDismissBinding,
  type CngxMenuDismissHandler,
  type CngxMenuDismissHandlerFactory,
  type CngxMenuDismissHandlerOptions,
  type CngxMenuDismissPopoverRef,
  type CngxMenuDismissSource,
  type CngxMenuTriggerDismissBinding,
  type CngxMenuTriggerDismissBindingOptions,
} from './menu/dismiss-handler';
export {
  CNGX_MENU_ANNOUNCER_FACTORY,
  CngxMenuAnnouncer,
  createMenuAnnouncer,
  injectMenuAnnouncer,
  type CngxMenuAnnouncerFactory,
  type CngxMenuAnnouncerLike,
} from './menu/menu-announcer';
export { CngxContextMenuTrigger } from './menu/context-menu-trigger.directive';
export { provideCngxMenu, type CngxMenuFeature } from './menu/provide-cngx-menu';
export {
  CNGX_MENU_RADIO_GROUP,
  createMenuRadioController,
  type CngxMenuRadioGroup,
  type CngxMenuRadioGroupFactory,
} from './menu/menu-radio-controller';
export { CngxMenuTrigger } from './menu/menu-trigger.directive';
export { CngxErrorState } from './error-state/error-state.directive';
export {
  CNGX_ERROR_SCOPE,
  type CngxErrorScopeContract,
} from './error-scope/error-scope.token';
export { CngxErrorScope } from './error-scope/error-scope.directive';
export {
  CNGX_ERROR_AGGREGATOR,
  type CngxErrorAggregatorContract,
  type CngxErrorAggregatorSourceEntry,
} from './error-aggregator/error-aggregator.token';
export { CngxErrorSource } from './error-source/error-source.directive';
export { CngxErrorAggregator } from './error-aggregator/error-aggregator.directive';
export { CngxErrorRegistry } from './error-registry/error-registry';
export { injectErrorScope } from './error-registry/inject-error-scope';
export { injectErrorAggregator } from './error-registry/inject-error-aggregator';
export {
  provideErrorRegistry,
  withGlobalRevealOnSubmit,
  withRevealOnNavigate,
  type ErrorRegistryFeature,
} from './error-registry/provide-error-registry';
