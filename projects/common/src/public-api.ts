/**
 * Public API Surface of @cngx/common
 * @module @cngx/common
 */

// Behaviors — interactive
export { CngxHoverable } from './lib/behaviors/interactive/hoverable.directive';
export { CngxSearch } from './lib/behaviors/interactive/search.directive';
export { CngxClickOutside } from './lib/behaviors/interactive/click-outside.directive';
export { CngxSpeak } from './lib/behaviors/interactive/speak.directive';
export { CngxSwipeDismiss, type SwipeDirection } from './lib/behaviors/interactive/swipe-dismiss.directive';
export { CngxDisclosure } from './lib/behaviors/interactive/disclosure.directive';
export { CngxNavLink } from './lib/behaviors/interactive/nav-link.directive';
export { CngxNavLabel } from './lib/behaviors/interactive/nav-label.directive';
export { CngxNavBadge, type NavBadgeVariant } from './lib/behaviors/interactive/nav-badge.directive';
export { CngxNavGroup } from './lib/behaviors/interactive/nav-group.directive';

// Behaviors — layout
export { CngxResizeObserver } from './lib/behaviors/layout/resize-observer.directive';
export { CngxIntersectionObserver } from './lib/behaviors/layout/intersection-observer.directive';
export { CngxScrollLock } from './lib/behaviors/layout/scroll-lock.directive';
export { CngxBackdrop } from './lib/behaviors/layout/backdrop.directive';
export { CngxMediaQuery } from './lib/behaviors/layout/media-query.directive';
export { CngxDrawer, type DrawerPosition } from './lib/behaviors/layout/drawer/drawer.directive';
export { CngxDrawerPanel, type DrawerMode } from './lib/behaviors/layout/drawer/drawer-panel.directive';
export { CngxDrawerContent } from './lib/behaviors/layout/drawer/drawer-content.directive';

// Behaviors — a11y
export { CngxAriaExpanded } from './lib/behaviors/a11y/aria-expanded.directive';
export { CngxLiveRegion } from './lib/behaviors/a11y/live-region.directive';
export { CngxFocusVisible } from './lib/behaviors/a11y/focus-visible.directive';
export { CngxReducedMotion } from './lib/behaviors/a11y/reduced-motion.directive';
export { CngxFocusTrap } from './lib/behaviors/a11y/focus-trap.directive';

// Behaviors — data
export { CngxSort, type SortEntry } from './lib/behaviors/data/sort.directive';
export { CngxSortHeader } from './lib/behaviors/data/sort-header.directive';
export { CngxFilter } from './lib/behaviors/data/filter.directive';
export { CngxPaginate } from './lib/behaviors/data/paginate.directive';

// Data sources
export { CngxDataSource, injectDataSource } from './lib/data/data-source';
export {
  CngxSmartDataSource,
  injectSmartDataSource,
  type CngxSmartDataSourceOptions,
} from './lib/data/smart-data-source';

export { VERSION } from './lib/version';
