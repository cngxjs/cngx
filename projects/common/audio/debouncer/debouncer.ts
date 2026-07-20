/** Default suppression window in milliseconds. */
const DEFAULT_WINDOW_MS = 100;

/**
 * Public handle returned by {@link createDebouncer}.
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/debouncer/debouncer.ts
 * @since 0.1.0
 */
export interface CngxDebouncer {
  /**
   * Returns `true` if `name` may fire now, `false` if an identical name fired
   * within the window. A `true` result records the fire time; a `false` result
   * leaves it untouched (so a burst is suppressed against its first fire).
   */
  shouldFire(name: string): boolean;
  /** Clear the recorded fire time for `name`, or all names when omitted. */
  reset(name?: string): void;
}

/**
 * Per-name time-window debouncer: suppresses repeated fires of the same earcon
 * within `windowMs`. A separate composed factory rather than logic buried in
 * the engine (Pillar 3). Plain factory, no DI token — `withDebounceMs` covers
 * configuration and there is no independent swap consumer.
 *
 * `windowMs` accepts a getter so a caller whose window is a reactive input can
 * hold ONE debouncer instance for its lifetime and still track changes: the
 * window is resolved per `shouldFire` call, not captured at construction. That
 * keeps the (stateful) debouncer out of the signal graph — minting one inside a
 * `computed` would return a fresh object per evaluation and break the equality
 * rule. `CngxAudioPitch` is the getter consumer; the engine passes a number.
 *
 * The clock is injectable (`now`) purely so specs are deterministic; production
 * defaults to `Date.now`.
 *
 * @param options.windowMs Suppression window, or a getter for it. `<= 0` disables debouncing. Default `100`.
 * @param options.now Clock source in ms. Default `Date.now`.
 * @category common/audio
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/audio/debouncer/debouncer.ts
 * @since 0.1.0
 */
export function createDebouncer(options?: {
  readonly windowMs?: number | (() => number);
  readonly now?: () => number;
}): CngxDebouncer {
  const windowOption = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const resolveWindow =
    typeof windowOption === 'function' ? windowOption : (): number => windowOption;
  const now = options?.now ?? (() => Date.now());
  const lastFiredAt = new Map<string, number>();

  return {
    shouldFire(name) {
      const at = now();
      const last = lastFiredAt.get(name);
      if (last !== undefined && at - last < resolveWindow()) {
        return false;
      }
      lastFiredAt.set(name, at);
      return true;
    },
    reset(name) {
      if (name === undefined) {
        lastFiredAt.clear();
      } else {
        lastFiredAt.delete(name);
      }
    },
  };
}
