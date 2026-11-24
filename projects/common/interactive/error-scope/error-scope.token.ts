import { InjectionToken, type Signal } from '@angular/core';

/**
 * Contract every {@link CngxErrorScope} (or external override) fulfils.
 *
 * The scope encapsulates the "should errors be visible right now?"
 * decision. A scope starts hidden (`showErrors === false`) and reveals
 * when {@link reveal} is called - typically on form submit, on route
 * navigation, or on programmatic error trigger.
 *
 * Descendant directives (`CngxErrorAggregator`, `CngxErrorState`) read
 * the scope's `showErrors` signal to gate their own visibility, so a
 * single `reveal()` propagates atomically through the subtree.
 * `CngxErrorAggregator` also reads `revealEpoch` to speak again on a
 * repeated reveal.
 */
export interface CngxErrorScopeContract {
  /** Reactive flag - `true` when errors should be visible to the user. */
  readonly showErrors: Signal<boolean>;
  /**
   * Reveals errors in this scope. `showErrors` stays `true` on a repeated
   * call, but each call bumps `revealEpoch`, so aggregators speak again.
   */
  reveal(): void;
  /** Resets the scope to hidden. A repeated call changes nothing. */
  reset(): void;
  /** Optional name for programmatic registry lookup via {@link CngxErrorRegistry}. */
  readonly scopeName?: Signal<string | undefined>;
  /**
   * Count of `reveal()` calls, a repeated one included; `reset()` leaves it.
   * `CngxErrorAggregator` reads it to speak unchanged errors again on every
   * reveal. Optional so contracts written before it keep compiling.
   */
  readonly revealEpoch?: Signal<number>;
}

/**
 * DI token resolving to the nearest {@link CngxErrorScopeContract} ancestor.
 *
 * Provided by {@link CngxErrorScope} via `useExisting`; descendants inject
 * with `{ optional: true }` and fall back gracefully when no scope is
 * present (no-op).
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/error-scope/error-scope.token.ts
 * @since 0.1.0
 */
export const CNGX_ERROR_SCOPE = new InjectionToken<CngxErrorScopeContract>('CngxErrorScope');
