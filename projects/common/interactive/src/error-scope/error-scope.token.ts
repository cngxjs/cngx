import { InjectionToken, type Signal } from '@angular/core';

/**
 * Contract every {@link CngxErrorScope} (or external override) fulfils.
 *
 * The scope encapsulates the "should errors be visible right now?"
 * decision. A scope starts hidden (`showErrors === false`) and reveals
 * when {@link reveal} is called — typically on form submit, on route
 * navigation, or on programmatic error trigger.
 *
 * Descendant directives (`CngxErrorAggregator`, `CngxErrorState`) read
 * the scope's `showErrors` signal to gate their own visibility, so a
 * single `reveal()` propagates atomically through the subtree.
 *
 * @category interfaces
 */
export interface CngxErrorScopeContract {
  /** Reactive flag — `true` when errors should be visible to the user. */
  readonly showErrors: Signal<boolean>;
  /** Reveals errors in this scope (idempotent). */
  reveal(): void;
  /** Resets the scope to hidden (idempotent). */
  reset(): void;
  /** Optional name for programmatic registry lookup (Phase 6b). */
  readonly scopeName?: Signal<string | undefined>;
}

/**
 * DI token resolving to the nearest {@link CngxErrorScopeContract} ancestor.
 *
 * Provided by {@link CngxErrorScope} via `useExisting`; descendants inject
 * with `{ optional: true }` and fall back gracefully when no scope is
 * present (no-op).
 *
 * @category tokens
 */
export const CNGX_ERROR_SCOPE = new InjectionToken<CngxErrorScopeContract>(
  'CngxErrorScope',
);
