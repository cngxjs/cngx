import { computed, effect, type Resource, signal } from '@angular/core';
import type { AsyncStatus, CngxAsyncState } from '@cngx/core/utils';

/**
 * Shape of an `HttpResourceRef` — only the signals we need.
 *
 * Declared here to avoid a hard dependency on `@angular/common/http`.
 * The consumer passes the actual `httpResource()` return value which
 * satisfies this interface at runtime.
 */
interface HttpResourceLike<T> extends Resource<T> {
  progress: () => number | undefined;
}

/**
 * Bridge that projects an Angular `httpResource()` ref onto `CngxAsyncState<T>`.
 *
 * Identical to `fromResource` but additionally maps the HTTP progress
 * signal to `CngxAsyncState.progress` (0–100 scale).
 *
 * Must be called in an injection context.
 *
 * @usageNotes
 *
 * ```typescript
 * private readonly res = httpResource<Item[]>(() => ({
 *   url: '/api/items',
 *   params: { q: this.filter() },
 * }));
 *
 * readonly items = fromHttpResource(this.res);
 * // items.progress() tracks upload/download progress
 * // <cngx-progress [state]="items"> — auto-wired progress bar
 * ```
 *
 * @category async
 */
export function fromHttpResource<T>(ref: HttpResourceLike<T>): CngxAsyncState<T> {
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

  // Map HTTP progress (0–1 float) to 0–100 integer, clamped
  const progress = computed(() => {
    const p = ref.progress();
    if (p == null) {
      return undefined;
    }
    return Math.round(Math.min(p, 1) * 100);
  });

  const isLoading = computed(() => status() === 'loading');
  const isPending = computed(() => false);
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
    progress,
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
