/**
 * Outcome reported by an `attempt` callback to
 * {@link createDomAnchorRetry}. Returning `true` halts the retry
 * loop (success); `false` or `null` requests another scheduled tick.
 *
 * @category interactive
 */
export type CngxDomAnchorRetryResult = true | false | null;

/**
 * Configuration for {@link createDomAnchorRetry}.
 *
 * @category interactive
 */
export interface CngxDomAnchorRetryOptions {
  /**
   * Per-attempt callback. Return `true` when the anchor succeeded
   * (the loop stops); `false` or `null` to schedule another attempt.
   */
  readonly attempt: () => CngxDomAnchorRetryResult;
  /**
   * Maximum unsuccessful attempts before {@link onGiveUp} fires and
   * the loop stops. The very first synchronous call counts as
   * attempt #1, so a value of `5` permits four scheduled retries
   * after the initial attempt.
   */
  readonly maxAttempts: number;
  /**
   * Schedules the next attempt. Common implementations: `rAF`,
   * `afterNextRender`, `setTimeout`, `queueMicrotask`. Returns a
   * cancellation closure — return a noop when the underlying
   * scheduler does not expose one (e.g. `afterNextRender` is
   * one-shot).
   */
  readonly schedule: (cb: () => void) => () => void;
  /**
   * Optional: invoked once after the `maxAttempts`-th unsuccessful
   * attempt. Use to dev-warn or surface a fallback path.
   */
  readonly onGiveUp?: () => void;
}

/**
 * Imperative handle returned by {@link createDomAnchorRetry}.
 *
 * @category interactive
 */
export interface CngxDomAnchorRetryHandle {
  /** Begin (or restart) the retry loop. Resets the attempt counter. */
  start(): void;
  /** Stop the retry loop and cancel any pending scheduled attempt. */
  cancel(): void;
}

/**
 * Bounded retry loop for DOM-anchoring patterns. Encapsulates the
 * attempt-counter + give-up + cancellation contract shared by
 * `<cngx-tab-overflow>`'s rAF-based strip-attach loop and
 * `[cngxMatTabs]`'s afterNextRender-based header-anchor loop. The
 * scheduler is consumer-supplied so different timing primitives
 * (browser frames, Angular render hooks, debounced timers) flow
 * through one counter contract.
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
 * @category interactive
 */
export function createDomAnchorRetry(
  options: CngxDomAnchorRetryOptions,
): CngxDomAnchorRetryHandle {
  let attempts = 0;
  let cancelLast: (() => void) | null = null;
  let stopped = false;
  const tick = (): void => {
    cancelLast = null;
    if (stopped) {
      return;
    }
    if (options.attempt() === true) {
      return;
    }
    attempts++;
    if (attempts >= options.maxAttempts) {
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
