import { computed, type Resource } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import { buildResourceBridge } from './resource-bridge';

/**
 * Shape of an `HttpResourceRef` - only the signals we need.
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
 * ```typescript
 * private readonly res = httpResource<Item[]>(() => ({
 *   url: '/api/items',
 *   params: { q: this.filter() },
 * }));
 *
 * readonly items = fromHttpResource(this.res);
 * // items.progress() tracks upload/download progress
 * // <cngx-progress [state]="items"> - auto-wired progress bar
 * ```
 *
 * @category common/data/async-state
 */
export function fromHttpResource<T>(ref: HttpResourceLike<T>): CngxAsyncState<T> {
  // Map HTTP progress (0-1 float) to 0-100 integer, clamped.
  const progress = computed(() => {
    const p = ref.progress();
    if (p == null) {
      return undefined;
    }
    return Math.round(Math.min(p, 1) * 100);
  });

  return buildResourceBridge(ref, progress);
}
