/**
 * Timer with pause/resume support for hover/focus interactions (WCAG 2.2.1).
 *
 * Tracks the remaining time per start: every `pause()` subtracts only the
 * elapsed slice since the last `start()`/`resume()`, so repeated
 * pause/resume cycles never stretch the total duration.
 *
 * @internal - not exported from `public-api.ts`; consumed by CngxAlert,
 *   CngxAlerter, and CngxToaster via relative path.
 */
export interface PausableTimer {
  start(duration: number, onComplete: () => void): void;
  pause(): void;
  resume(): void;
  clear(): void;
}

/** @internal */
export function createPausableTimer(): PausableTimer {
  let id: ReturnType<typeof setTimeout> | undefined;
  let remaining = 0;
  let startedAt = 0;
  let onComplete: (() => void) | undefined;

  const clear = (): void => {
    if (id !== undefined) {
      clearTimeout(id);
      id = undefined;
    }
    remaining = 0;
    onComplete = undefined;
  };

  const resume = (): void => {
    if (remaining > 0 && id === undefined && onComplete) {
      startedAt = Date.now();
      const cb = onComplete;
      id = setTimeout(() => {
        id = undefined;
        remaining = 0;
        cb();
      }, remaining);
    }
  };

  const pause = (): void => {
    if (id !== undefined) {
      clearTimeout(id);
      id = undefined;
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
    }
  };

  return {
    start: (duration, cb) => {
      clear();
      onComplete = cb;
      remaining = duration;
      resume();
    },
    pause,
    resume,
    clear,
  };
}

/**
 * Id-keyed pausable timers with hold counting for the alert/toast services.
 *
 * `hold`/`release` count independent pause sources (pointer hover and
 * focus-within fire separate event pairs on the same element) - the timer
 * resumes only when the LAST hold releases, so leaving with the mouse never
 * un-pauses a still-focused item and vice versa.
 *
 * @internal - not exported from `public-api.ts`.
 */
export interface HeldTimerRegistry {
  /** (Re)starts the timer for `id`; stays paused while holds are active. */
  start(id: number, duration: number, onComplete: () => void): void;
  hold(id: number): void;
  release(id: number): void;
  clear(id: number): void;
  clearAll(): void;
}

/** @internal */
export function createHeldTimerRegistry(): HeldTimerRegistry {
  const timers = new Map<number, PausableTimer>();
  const holds = new Map<number, number>();

  return {
    start: (id, duration, onComplete) => {
      let timer = timers.get(id);
      if (!timer) {
        timer = createPausableTimer();
        timers.set(id, timer);
      }
      timer.start(duration, onComplete);
      if ((holds.get(id) ?? 0) > 0) {
        timer.pause();
      }
    },
    hold: (id) => {
      holds.set(id, (holds.get(id) ?? 0) + 1);
      timers.get(id)?.pause();
    },
    release: (id) => {
      const next = Math.max(0, (holds.get(id) ?? 0) - 1);
      if (next === 0) {
        holds.delete(id);
        timers.get(id)?.resume();
      } else {
        holds.set(id, next);
      }
    },
    clear: (id) => {
      timers.get(id)?.clear();
      timers.delete(id);
      holds.delete(id);
    },
    clearAll: () => {
      for (const timer of timers.values()) {
        timer.clear();
      }
      timers.clear();
      holds.clear();
    },
  };
}
