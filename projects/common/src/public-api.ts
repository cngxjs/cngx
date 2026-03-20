/**
 * Public API Surface of @cngx/common
 * @module @cngx/common
 */

// Behaviors — interactive
export { CngxHoverable } from './lib/behaviors/interactive/hoverable.directive';
export { CngxSearch } from './lib/behaviors/interactive/search.directive';
export { CngxClickOutside } from './lib/behaviors/interactive/click-outside.directive';
export { CngxSpeak } from './lib/behaviors/interactive/speak.directive';

// Behaviors — layout
export { CngxResizeObserver } from './lib/behaviors/layout/resize-observer.directive';
export { CngxIntersectionObserver } from './lib/behaviors/layout/intersection-observer.directive';

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
