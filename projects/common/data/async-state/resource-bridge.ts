import { computed, linkedSignal, type Resource, type Signal } from '@angular/core';
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
 * is a `linkedSignal` over the pure `nextResourceLatch` reducer - no effect.
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

  const status = computed((): AsyncStatus => {
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
      // Read the latch first so every data reader keeps the request chain observed.
      const last = latch();
      return ref.hasValue() ? ref.value() : last.value;
    }),
    error: computed(() => ref.error()),
    progress,
    // Idle and a new request count as "before the first load", never as empty.
    isFirstLoad: computed(() => !latch().has),
    lastUpdated: computed(() => latch().at, {
      equal: (a, b) => a?.getTime() === b?.getTime(),
    }),
  });
}
