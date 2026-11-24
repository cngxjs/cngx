import { computed, effect, linkedSignal, type Resource, type Signal } from '@angular/core';
import { type AsyncStatus, buildAsyncStateView, type CngxAsyncState } from '@cngx/core/utils';

import {
  nextResourceLatch,
  resourceLatchEqual,
  resourceLatchSourceEqual,
  type ResourceLatch,
  type ResourceLatchSource,
} from './resource-latch';

/**
 * Shared projection core for the two resource bridges (`fromResource`,
 * `fromHttpResource`). Derives every flag through `buildAsyncStateView`, so
 * the family semantics (`isLoading` includes pending/refreshing,
 * `isBusy === isLoading`) cannot drift between the bridges and the factories.
 *
 * "First load" is per request identity: a failed reload of the same request
 * keeps the last good value, a params change or `idle` starts over. The latch
 * is a `linkedSignal` over the pure `nextResourceLatch` reducer.
 *
 * A read-only effect keeps the latch observed while no view reads the state
 * (a hidden template), so a params change that fails there is not mistaken for
 * a failed reload of the old request. Probed in jsdom only; not probed: real
 * browser schedulers and a loader that synchronously returns a resolved value.
 *
 * @internal
 */
export function buildResourceBridge<T>(
  ref: Resource<T>,
  progress?: Signal<number | undefined>,
): CngxAsyncState<T> {
  // Angular throws from value() in error, so the value is read only behind hasValue().
  const source = computed(
    (): ResourceLatchSource<T> => {
      const hasValue = ref.hasValue();
      return {
        status: ref.status(),
        hasValue,
        value: hasValue ? ref.value() : undefined,
        error: ref.error(),
      };
    },
    { equal: resourceLatchSourceEqual },
  );

  // ResourceStatus has no "first load" concept; the latch holds the last good
  // value of the current request chain with its timestamp.
  const latch = linkedSignal<ResourceLatchSource<T>, ResourceLatch<T>>({
    source,
    computation: (current, previous) => nextResourceLatch(current, previous, new Date()),
    equal: resourceLatchEqual,
  });

  // Read-only keep-alive: reads the latch, never writes a signal.
  effect(() => {
    latch();
  });

  // Every signal the bridge hands out reads the latch first, so a consumer of
  // any of them (status, isLoading, error, data, ...) keeps the request chain
  // observed; a template that gates on status alone would otherwise skip the
  // steps the reducer needs to tell a reload from a params change.
  const status = computed((): AsyncStatus => {
    latch();
    switch (ref.status()) {
      case 'idle':
        return 'idle';
      case 'loading':
        return 'loading';
      case 'reloading':
        return 'refreshing';
      case 'resolved':
      case 'local':
        return 'success';
      case 'error':
        return 'error';
    }
  });

  return buildAsyncStateView<T>({
    status,
    data: computed(() => {
      const last = latch();
      return ref.hasValue() ? ref.value() : last.value;
    }),
    error: computed(() => {
      latch();
      return ref.error();
    }),
    progress: progress
      ? computed(() => {
          latch();
          return progress();
        })
      : undefined,
    // Idle and a new request count as "before the first load", never as empty.
    isFirstLoad: computed(() => !latch().has),
    // Stamped inside the lazy latch computation: the time of the first read
    // after a successful load, not of the load itself.
    lastUpdated: computed(() => latch().at, {
      equal: (a, b) => a?.getTime() === b?.getTime(),
    }),
  });
}
