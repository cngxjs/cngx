import { computed, effect, type Resource, signal } from '@angular/core';
import type { AsyncStatus, CngxAsyncState } from '@cngx/core/utils';

/**
 * Bridge that projects an Angular `Resource<T>` onto `CngxAsyncState<T>`.
 *
 * Must be called in an injection context (the `effect()` that tracks
 * `hadSuccess` requires one).
 *
 * All signals are derived reactively from the resource — no manual
 * synchronization. The resource stays the single source of truth.
 *
 * @usageNotes
 *
 * ```typescript
 * private readonly res = resource({
 *   request: () => ({ filter: this.filter() }),
 *   loader: ({ request, abortSignal }) =>
 *     fetch(`/api/items?q=${request.filter}`, { signal: abortSignal })
 *       .then(r => r.json()),
 * });
 *
 * readonly items = fromResource(this.res);
 * // items.status(), items.data(), items.isFirstLoad() — all work
 * // <cngx-async-container [state]="items"> — direct binding
 * ```
 *
 * @category async
 */
export function fromResource<T>(ref: Resource<T>): CngxAsyncState<T> {
  // Track whether a successful load has ever occurred.
  // Needed because ResourceStatus has no "first load" concept.
  const hadSuccess = signal(false);

  effect(() => {
    const s = ref.status();
    if (s === 'resolved' || s === 'local') {
      hadSuccess.set(true);
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

  const data = computed(() => (ref.hasValue() ? ref.value() : undefined));
  const error = computed(() => ref.error());

  const isLoading = computed(() => status() === 'loading');
  const isPending = computed(() => false); // resource() has no mutation concept
  const isRefreshing = computed(() => status() === 'refreshing');
  const isBusy = computed(() => ref.isLoading());
  const isFirstLoad = computed(() => !hadSuccess() && isBusy());
  const isEmpty = computed(() => {
    const d = data();
    return d == null || (Array.isArray(d) && d.length === 0);
  });
  const hasData = computed(() => ref.hasValue() && !isEmpty());
  const isSettled = computed(() => {
    const s = status();
    return s === 'success' || s === 'error';
  });
  const lastUpdated = signal<Date | undefined>(undefined);

  // Track lastUpdated on success transitions
  effect(() => {
    const s = ref.status();
    if (s === 'resolved' || s === 'local') {
      lastUpdated.set(new Date());
    }
  });

  return {
    status,
    data,
    error,
    progress: signal(undefined).asReadonly(),
    isLoading,
    isPending,
    isRefreshing,
    isBusy,
    isFirstLoad,
    isEmpty,
    hasData,
    isSettled,
    lastUpdated: lastUpdated.asReadonly(),
  };
}
