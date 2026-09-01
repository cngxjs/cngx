import { type Resource } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import { buildResourceBridge } from './resource-bridge';

/**
 * Bridge that projects an Angular `Resource<T>` onto `CngxAsyncState<T>`.
 *
 * Must be called in an injection context (the `effect()` that tracks
 * `hadSuccess` requires one).
 *
 * All signals are derived reactively from the resource - no manual
 * synchronization. The resource stays the single source of truth.
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
 * // items.status(), items.data(), items.isFirstLoad() - all work
 * // <cngx-async-container [state]="items"> - direct binding
 * ```
 *
 * @category common/data/async-state
 */
export function fromResource<T>(ref: Resource<T>): CngxAsyncState<T> {
  return buildResourceBridge(ref);
}
