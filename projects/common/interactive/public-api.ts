/**
 * @module @cngx/common/interactive
 */
export { CngxAsyncClick, type AsyncAction } from './src/async-click/async-click.directive';
export { CngxPending, CngxSucceeded, CngxFailed } from './src/async-click/async-status-templates';
export { type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
export { CngxCopyText } from './src/copy/copy-text.directive';
export { CngxCopyBlock } from './src/copy/copy-block';
export { CngxRipple } from './src/ripple/ripple.directive';
export { CngxPressable } from './src/ripple/pressable.directive';
export { CngxPressRipple } from './src/ripple/press-ripple.directive';
export {
  CNGX_NAV_CONFIG,
  provideNavConfig,
  injectNavConfig,
  withSingleAccordion,
  withNavIndent,
  withNavAnimation,
  type CngxNavConfig,
  type NavConfigFeature,
} from './src/nav/nav-config';
export { CngxNavGroup } from './src/nav/nav-group.directive';
export { CngxNavGroupRegistry } from './src/nav/nav-group-registry';
export { CngxNavLabel } from './src/nav/nav-label.directive';
export { CngxNavLink } from './src/nav/nav-link.directive';
export { CngxNavBadge, type NavBadgeVariant } from './src/nav/nav-badge.directive';
export { CngxDisclosure } from './src/nav/disclosure.directive';
export { withRetry, type RetryConfig, type RetryState } from './src/retry/with-retry';
export { optimistic, type OptimisticState } from './src/optimistic/optimistic';
export { CngxLongPress } from './src/gestures/long-press.directive';
export { CngxSwipeDismiss, type SwipeDirection } from './src/gestures/swipe-dismiss.directive';
export { CngxKeyboardShortcut } from './src/keyboard/keyboard-shortcut.directive';
export { CngxSearch } from './src/keyboard/search.directive';
export { CngxClickOutside } from './src/keyboard/click-outside.directive';
export { CngxBeforeUnload } from './src/guard/before-unload.directive';
export { canDeactivateWhenClean } from './src/guard/can-deactivate';
export { CngxCloseButton, CNGX_CLOSE_ICON } from './src/close-button/close-button';
export { CngxHoverable } from './src/hoverable/hoverable.directive';
export { CngxSpeak } from './src/speak/speak.directive';
export { CngxOption } from './src/listbox/option.directive';
export { CngxOptionGroup } from './src/listbox/option-group.directive';
export { CngxListbox } from './src/listbox/listbox.directive';
export {
  CngxListboxSearch,
  type ListboxMatchFn,
} from './src/listbox/listbox-search.directive';
export { CngxListboxTrigger } from './src/listbox/listbox-trigger.directive';
export { CngxMenu } from './src/menu/menu.directive';
export { CngxMenuItem } from './src/menu/menu-item.directive';
