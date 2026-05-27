import { InjectionToken } from '@angular/core';

/**
 * Outcome reported by an `attempt` callback. `true` halts the loop
 * (success); `false` or `null` schedules another tick.
 *
 * @category common/tabs/overflow
 */
export type CngxDomAnchorRetryResult = true | false | null;

/**
 * Configuration for {@link createDomAnchorRetry}.
 *
 * @category common/tabs/overflow
 */
export interface CngxDomAnchorRetryOptions {
  /**
   * Per-attempt callback. `true` halts; `false`/`null` schedules
   * another attempt.
   */
  readonly attempt: () => CngxDomAnchorRetryResult;
  /**
   * Cap on unsuccessful attempts before {@link onGiveUp} fires.
   * The first synchronous call counts as attempt #1 — `5` permits
   * four scheduled retries after the initial.
   */
  readonly maxAttempts: number;
  /**
   * Schedules the next attempt (rAF / `afterNextRender` /
   * `setTimeout` / `queueMicrotask`). Returns a cancellation
   * closure — return a noop when the scheduler doesn't expose one.
   */
  readonly schedule: (cb: () => void) => () => void;
  /** Fires once after the `maxAttempts`-th unsuccessful attempt. */
  readonly onGiveUp?: () => void;
}

/**
 * Imperative handle returned by {@link createDomAnchorRetry}.
 *
 * @category common/tabs/overflow
 */
export interface CngxDomAnchorRetryHandle {
  /** Begin (or restart) the retry loop. Resets the attempt counter. */
  start(): void;
  /** Stop the retry loop and cancel any pending scheduled attempt. */
  cancel(): void;
}

/**
 * Bounded retry loop for DOM-anchoring patterns — shared
 * attempt-counter + give-up + cancellation contract. Used by
 * `<cngx-tab-overflow>`'s rAF strip-attach loop and `[cngxMatTabs]`'s
 * `afterNextRender` header-anchor loop. Consumer-supplied scheduler
 * lets different timing primitives flow through one counter.
 *
 * ```ts
 * const retry = createDomAnchorRetry({
 *   attempt: () => {
 *     const root = host.closest('.strip-wrapper');
 *     if (!root) return null;
 *     observer.observe(root);
 *     return true;
 *   },
 *   maxAttempts: 60,
 *   schedule: (cb) => {
 *     const h = requestAnimationFrame(cb);
 *     return () => cancelAnimationFrame(h);
 *   },
 *   onGiveUp: () => console.warn('strip wrapper not found'),
 * });
 * afterNextRender(() => retry.start());
 * destroyRef.onDestroy(() => retry.cancel());
 * ```
 *
 * @category common/tabs/overflow
 */
export function createDomAnchorRetry(
  options: CngxDomAnchorRetryOptions,
): CngxDomAnchorRetryHandle {
  let attempts = 0;
  let cancelLast: (() => void) | null = null;
  let stopped = false;
  const tick = (): void => {
    if (stopped) {
      cancelLast = null;
      return;
    }
    cancelLast = null;
    let result: CngxDomAnchorRetryResult;
    try {
      result = options.attempt();
    } catch {
      // Swallow + terminal stop — covers the test-runner teardown
      // race where a global (e.g. IntersectionObserver) is reset
      // between schedule and fire, before consumer DestroyRef can
      // call cancel(). Production callback bugs still surface via
      // their own console.error before they throw here.
      stopped = true;
      return;
    }
    if (result === true) {
      stopped = true;
      return;
    }
    attempts++;
    if (attempts >= options.maxAttempts) {
      stopped = true;
      options.onGiveUp?.();
      return;
    }
    cancelLast = options.schedule(tick);
  };
  return {
    start: () => {
      stopped = false;
      attempts = 0;
      tick();
    },
    cancel: () => {
      stopped = true;
      cancelLast?.();
      cancelLast = null;
    },
  };
}

/**
 * Factory signature for {@link CNGX_DOM_ANCHOR_RETRY_FACTORY} —
 * matches {@link createDomAnchorRetry} for drop-in overrides.
 *
 * @category common/tabs/overflow
 */
export type CngxDomAnchorRetryFactory = (
  options: CngxDomAnchorRetryOptions,
) => CngxDomAnchorRetryHandle;

/**
 * DI token for the DOM-anchor retry policy. Default
 * {@link createDomAnchorRetry}. Two real consumers today —
 * `<cngx-tab-overflow>`'s rAF strip-attach loop and
 * `[cngxMatTabs]`'s `afterNextRender` header-anchor loop. Override
 * via `providers` / `viewProviders` for retry-with-backoff,
 * telemetry on give-up, etc. Symmetric to
 * `CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY`,
 * `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY`, and
 * `CNGX_TABS_COMMIT_HANDLER_FACTORY`.
 *
 * @category common/tabs/overflow
 */
export const CNGX_DOM_ANCHOR_RETRY_FACTORY =
  new InjectionToken<CngxDomAnchorRetryFactory>(
    'CngxDomAnchorRetryFactory',
    {
      providedIn: 'root',
      factory: () => createDomAnchorRetry,
    },
  );
