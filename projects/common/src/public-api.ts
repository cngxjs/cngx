/**
 * Public API Surface of @cngx/common
 *
 * Re-exports all secondary entry points for backwards compatibility.
 * Prefer importing from specific entry points:
 *   @cngx/common/a11y
 *   @cngx/common/display
 *   @cngx/common/interactive
 *   @cngx/common/layout
 *   @cngx/common/data
 *   @cngx/common/dialog
 *   @cngx/common/popover
 *
 * @module @cngx/common
 */

export * from '@cngx/common/a11y';
export * from '@cngx/common/display';
export * from '@cngx/common/interactive';
export * from '@cngx/common/layout';
export * from '@cngx/common/data';
export * from '@cngx/common/dialog';
export * from '@cngx/common/popover';

export { VERSION } from './lib/version';
