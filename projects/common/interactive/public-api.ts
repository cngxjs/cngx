/**
 * @module @cngx/common/interactive
 */
export { CngxClickOutside } from './src/click-outside.directive';
export { CngxDisclosure } from './src/disclosure.directive';
export { CngxHoverable } from './src/hoverable.directive';
export { CngxNavBadge, type NavBadgeVariant } from './src/nav-badge.directive';
export {
  CNGX_NAV_CONFIG,
  provideNavConfig,
  injectNavConfig,
  withSingleAccordion,
  withNavIndent,
  withNavAnimation,
  type CngxNavConfig,
  type NavConfigFeature,
} from './src/nav-config';
export { CngxNavGroup } from './src/nav-group.directive';
export { CngxNavGroupRegistry } from './src/nav-group-registry';
export { CngxNavLabel } from './src/nav-label.directive';
export { CngxNavLink } from './src/nav-link.directive';
export { CngxSearch } from './src/search.directive';
export { CngxSpeak } from './src/speak.directive';
export { CngxSwipeDismiss, type SwipeDirection } from './src/swipe-dismiss.directive';
export { CngxAsyncClick, type AsyncAction } from './src/async-click.directive';
export { type AsyncStatus } from '@cngx/core/utils';
export { CngxPending, CngxSucceeded, CngxFailed } from './src/async-status-templates';
export { CngxPressable } from './src/pressable.directive';
export { CngxLongPress } from './src/long-press.directive';
export { CngxKeyboardShortcut } from './src/keyboard-shortcut.directive';
export { CngxRipple } from './src/ripple.directive';
export { CngxCopyText } from './src/copy-text.directive';
export { withRetry, type RetryConfig, type RetryState } from './src/with-retry';
export { optimistic, type OptimisticState } from './src/optimistic';
export { CngxBeforeUnload } from './src/before-unload.directive';
export { canDeactivateWhenClean } from './src/can-deactivate';
export { CngxPressRipple } from './src/press-ripple.directive';
export { CngxCopyBlock } from './src/copy-block';
export { CngxCloseButton, CNGX_CLOSE_ICON } from './src/close-button';
