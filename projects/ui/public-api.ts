/**
 * Public API Surface of @cngx/ui
 *
 * The root entry is a small backwards-compat set only: it re-exports
 * `action-button`, `sidenav`, `skeleton` and `speak` plus the three
 * async-state directives that moved to `@cngx/common/interactive`.
 * Everything else ships exclusively through its secondary entry point
 * (`@cngx/ui/<entry>`, 26 entries) - deliberately not re-exported here so
 * a root import can never pull Material or CDK into a bundle that does
 * not use them.
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
