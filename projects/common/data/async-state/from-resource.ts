import { type Resource } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import { buildResourceBridge } from './resource-bridge';

/**
 * Bridge that projects an Angular `Resource<T>` onto `CngxAsyncState<T>`.
 *
 * Must be called in an injection context.
 *
 * All signals are derived reactively from the resource - no manual
 * synchronization. The resource stays the single source of truth.
 *
 * "First load" is per request: a failed reload keeps the last good value, a
 * params change or `idle` starts over with no data and `isFirstLoad()` true.
 *
 * ```typescript
 * private readonly res = resource({
 *   params: () => ({ filter: this.filter() }),
 *   loader: ({ params, abortSignal }) =>
 *     fetch(`/api/items?q=${params.filter}`, { signal: abortSignal })
 *       .then(r => r.json()),
 * });
 *
 * readonly items = fromResource(this.res);
 * // items.status(), items.data(), items.isFirstLoad() - all work
 * // <cngx-async-container [state]="items"> - direct binding
 * ```
 */
export function fromResource<T>(ref: Resource<T>): CngxAsyncState<T> {
  return buildResourceBridge(ref);
}
