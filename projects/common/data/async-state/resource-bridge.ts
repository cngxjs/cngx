import { computed, effect, type Resource, signal, type Signal } from '@angular/core';
import { type AsyncStatus, buildAsyncStateView, type CngxAsyncState } from '@cngx/core/utils';

/**
 * Shared projection core for the two resource bridges (`fromResource`,
 * `fromHttpResource`). Derives every flag through `buildAsyncStateView`, so
 * the family semantics (`isLoading` includes pending/refreshing,
 * `isBusy === isLoading`) cannot drift between the bridges and the factories.
 *
 * Must be called in an injection context (the tracking `effect()` requires one).
 *
 * @internal
 */
export function buildResourceBridge<T>(
  ref: Resource<T>,
  progress?: Signal<number | undefined>,
): CngxAsyncState<T> {
  // ResourceStatus has no "first load" concept, so a successful load is
  // latched here together with its timestamp.
  const hadSuccess = signal(false);
  const lastUpdated = signal<Date | undefined>(undefined);

  effect(() => {
    const s = ref.status();
    if (s === 'resolved' || s === 'local') {
      hadSuccess.set(true);
      lastUpdated.set(new Date());
    }
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
    data: computed(() => (ref.hasValue() ? ref.value() : undefined)),
    error: computed(() => ref.error()),
    progress,
    // Idle counts as "before the first load": a not-yet-triggered resource
    // still shows the skeleton, not the empty state.
    isFirstLoad: computed(() => !hadSuccess() && (ref.isLoading() || status() === 'idle')),
    lastUpdated: lastUpdated.asReadonly(),
  });
}
