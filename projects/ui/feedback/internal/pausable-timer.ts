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
