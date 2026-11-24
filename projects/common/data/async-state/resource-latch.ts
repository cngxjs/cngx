import type { ResourceStatus } from '@angular/core';

/**
 * One observed reading of a `Resource`, the input of `nextResourceLatch`.
 *
 * @internal
 */
export interface ResourceLatchSource<T> {
  readonly status: ResourceStatus;
  readonly hasValue: boolean;
  readonly value: T | undefined;
  readonly error: unknown;
}

/**
 * The last good value of the current request chain. `has` is false before the
 * first load of a request; `at` is the time of the last successful load of the
 * bridge and survives a cleared latch.
 *
 * @internal
 */
export interface ResourceLatch<T> {
  readonly has: boolean;
  readonly value: T | undefined;
  readonly at: Date | undefined;
}

/** @internal */
export interface ResourceLatchPrevious<T> {
  readonly source: ResourceLatchSource<T>;
  readonly value: ResourceLatch<T>;
}

/**
 * Pure latch reducer behind `buildResourceBridge`. `previous` is the last
 * reading somebody observed, not the last state that existed (the latch lives
 * in a lazy `linkedSignal`), so the latch is carried into `error` or a
 * value-less `reloading` only along a chain that proves the same request; every
 * ambiguous step clears it, which degrades to the error view, never to stale
 * data.
 *
 * @internal
 */
export function nextResourceLatch<T>(
  source: ResourceLatchSource<T>,
  previous: ResourceLatchPrevious<T> | undefined,
  now: Date,
): ResourceLatch<T> {
  const at = previous?.value.at;
  const cleared: ResourceLatch<T> = { has: false, value: undefined, at };

  switch (source.status) {
    case 'resolved':
    case 'local':
      return { has: true, value: source.value, at: now };
    case 'idle':
    case 'loading':
      return cleared;
    case 'reloading': {
      if (source.hasValue) {
        return { has: true, value: source.value, at: at ?? now };
      }
      // Angular keeps the failed stream through a reload of the same request,
      // so an unchanged error object proves the chain.
      const sameFailedRequest =
        previous?.source.status === 'error' && previous.source.error === source.error;
      return sameFailedRequest ? previous.value : cleared;
    }
    case 'error':
      return previous?.source.status === 'reloading' ? previous.value : cleared;
  }
}

/** @internal */
export function resourceLatchEqual<T>(a: ResourceLatch<T>, b: ResourceLatch<T>): boolean {
  return a.has === b.has && Object.is(a.value, b.value) && a.at?.getTime() === b.at?.getTime();
}

/** @internal */
export function resourceLatchSourceEqual<T>(
  a: ResourceLatchSource<T>,
  b: ResourceLatchSource<T>,
): boolean {
  return (
    a.status === b.status &&
    a.hasValue === b.hasValue &&
    Object.is(a.value, b.value) &&
    Object.is(a.error, b.error)
  );
}
