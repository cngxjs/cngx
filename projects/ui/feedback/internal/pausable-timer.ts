import { signal, type Signal } from '@angular/core';

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
  /**
   * Milliseconds left on the current start: the stored remainder while
   * paused, the remainder minus the running slice while running, `0` once
   * cleared or fired. The one clock read of the toast timer surface.
   */
  remaining(): number;
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
    remaining: () =>
      id === undefined ? remaining : Math.max(0, remaining - (Date.now() - startedAt)),
  };
}

/**
 * A source that holds a registry timer. Pointer hover and focus-within fire
 * separate event pairs on the same element; `queue` is the outlet's hold on a
 * toast that `maxVisible` keeps out of view.
 *
 * @internal
 */
export type TimerHoldSource = 'pointer' | 'focus' | 'queue';

/**
 * One countdown segment of a registry timer, snapshotted at the transition
 * that opened it (a start, the first hold or the last release).
 *
 * `serial` is registry-wide and monotonic, so a renderer keyed by it starts a
 * fresh animation at every transition. `total` is the duration of the current
 * start, `remaining` the milliseconds left at the snapshot, `running` whether
 * the clock was moving at that moment.
 *
 * @internal
 */
export interface TimerSegment {
  readonly serial: number;
  readonly total: number;
  readonly remaining: number;
  readonly running: boolean;
}

/**
 * Id-keyed pausable timers with sourced holds for the alert/toast services.
 *
 * Each id keeps a set of hold sources. The timer pauses on the first source
 * and resumes only when the last one releases, so leaving with the mouse
 * never un-pauses a still-focused item, and a late `focusout` never releases
 * a `queue` hold. Holding a held source and releasing an absent one are
 * no-ops; holds on an id without a live timer are ignored.
 *
 * `segments` publishes the current countdown segment per id. Snapshots are
 * taken synchronously at each transition, but the signal is written in one
 * coalesced microtask flush, never inside the timer call: a call from a
 * `focusout` during render or from an effect therefore never writes a signal
 * there.
 *
 * @internal - not exported from `public-api.ts`.
 */
export interface HeldTimerRegistry {
  /** (Re)starts the timer for `id`; stays paused while holds are active. */
  start(id: number, duration: number, onComplete: () => void): void;
  hold(id: number, source: TimerHoldSource): void;
  release(id: number, source: TimerHoldSource): void;
  /** Drops several sources in one transition. */
  releaseAll(id: number, sources: readonly TimerHoldSource[]): void;
  clear(id: number): void;
  clearAll(): void;
  /** Current segment per live timer id, written in a microtask flush. */
  readonly segments: Signal<ReadonlyMap<number, TimerSegment>>;
}

/** @internal */
export function createHeldTimerRegistry(): HeldTimerRegistry {
  const timers = new Map<number, PausableTimer>();
  const holds = new Map<number, Set<TimerHoldSource>>();
  const totals = new Map<number, number>();
  const segments = signal<ReadonlyMap<number, TimerSegment>>(new Map());
  const pending = new Map<number, TimerSegment | null>();
  let serial = 0;
  let flushQueued = false;

  const flush = (): void => {
    flushQueued = false;
    const current = segments();
    let next: Map<number, TimerSegment> | undefined;
    for (const [id, segment] of pending) {
      if (segment === null && !current.has(id)) {
        continue;
      }
      next ??= new Map(current);
      if (segment === null) {
        next.delete(id);
      } else {
        next.set(id, segment);
      }
    }
    pending.clear();
    if (next) {
      segments.set(next);
    }
  };

  const queue = (id: number, segment: TimerSegment | null): void => {
    pending.set(id, segment);
    if (!flushQueued) {
      flushQueued = true;
      queueMicrotask(flush);
    }
  };

  const snapshot = (id: number, timer: PausableTimer, running: boolean): void => {
    queue(id, {
      serial: ++serial,
      total: totals.get(id) ?? 0,
      remaining: timer.remaining(),
      running,
    });
  };

  const isHeld = (id: number): boolean => (holds.get(id)?.size ?? 0) > 0;

  const resumeIfFree = (id: number, timer: PausableTimer, wasHeld: boolean): void => {
    if (!wasHeld || isHeld(id)) {
      return;
    }
    holds.delete(id);
    timer.resume();
    snapshot(id, timer, true);
  };

  return {
    start: (id, duration, onComplete) => {
      let timer = timers.get(id);
      if (!timer) {
        timer = createPausableTimer();
        timers.set(id, timer);
      }
      timer.start(duration, onComplete);
      totals.set(id, duration);
      const held = isHeld(id);
      if (held) {
        timer.pause();
      }
      snapshot(id, timer, !held);
    },
    hold: (id, source) => {
      const timer = timers.get(id);
      if (!timer) {
        return;
      }
      let sources = holds.get(id);
      if (!sources) {
        sources = new Set();
        holds.set(id, sources);
      }
      if (sources.has(source)) {
        return;
      }
      sources.add(source);
      if (sources.size === 1) {
        timer.pause();
        snapshot(id, timer, false);
      }
    },
    release: (id, source) => {
      const timer = timers.get(id);
      const sources = holds.get(id);
      if (!timer || !sources?.has(source)) {
        return;
      }
      sources.delete(source);
      resumeIfFree(id, timer, true);
    },
    releaseAll: (id, sourcesToDrop) => {
      const timer = timers.get(id);
      const sources = holds.get(id);
      if (!timer || !sources) {
        return;
      }
      const wasHeld = sources.size > 0;
      for (const source of sourcesToDrop) {
        sources.delete(source);
      }
      resumeIfFree(id, timer, wasHeld);
    },
    clear: (id) => {
      timers.get(id)?.clear();
      timers.delete(id);
      holds.delete(id);
      totals.delete(id);
      queue(id, null);
    },
    clearAll: () => {
      for (const [id, timer] of timers) {
        timer.clear();
        queue(id, null);
      }
      timers.clear();
      holds.clear();
      totals.clear();
    },
    segments: segments.asReadonly(),
  };
}
