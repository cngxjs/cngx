/**
 * Public API Surface of @cngx/ui
 *
 * Re-exports all secondary entry points for backwards compatibility.
 * Prefer importing from specific entry points:
 *   @cngx/ui/action-button
 *   @cngx/ui/empty-state
 *   @cngx/ui/feedback
 *   @cngx/ui/layout
 *   @cngx/ui/mat-paginator
 *   @cngx/ui/mat-stepper
 *   @cngx/ui/mat-tabs
 *   @cngx/ui/overlay
 *   @cngx/ui/sidenav
 *   @cngx/ui/skeleton
 *   @cngx/ui/speak
 *   @cngx/ui/stepper
 *   @cngx/ui/tabs
 *
 * @module @cngx/ui
 */

export * from './ui';
export * from '@cngx/ui/action-button';
export * from '@cngx/ui/sidenav';
export * from '@cngx/ui/skeleton';
export * from '@cngx/ui/speak';

// Re-export from @cngx/common/interactive for backwards compatibility
export { CngxPending, CngxSucceeded, CngxFailed } from '@cngx/common/interactive';
