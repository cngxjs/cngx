import { computed, type Resource } from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import { buildResourceBridge } from './resource-bridge';

/**
 * Structural subset of Angular's `HttpProgressEvent` - the byte counts the
 * bridge reads. `total` is absent when the server sends no length.
 */
interface HttpProgressLike {
  readonly loaded: number;
  readonly total?: number;
}

/**
 * Shape of an `HttpResourceRef` - only the signals we need.
 *
 * Declared here to avoid a hard dependency on `@angular/common/http`.
 * The consumer passes the actual `httpResource()` return value, whose
 * `progress` signal carries the latest `HttpProgressEvent`.
 */
interface HttpResourceLike<T> extends Resource<T> {
  progress: () => HttpProgressLike | undefined;
}

/**
 * Bridge that projects an Angular `httpResource()` ref onto `CngxAsyncState<T>`.
 *
 * Identical to `fromResource` but additionally maps the HTTP progress
 * signal to `CngxAsyncState.progress` (0-100 scale): `loaded / total`,
 * rounded and clamped. With an unknown or zero `total` the progress is
 * `undefined` (indeterminate). Angular only emits progress events when the
 * request sets `reportProgress: true`.
 *
 * Must be called in an injection context.
 *
 * ```typescript
 * private readonly res = httpResource<Item[]>(() => ({
 *   url: '/api/items',
 *   params: { q: this.filter() },
 *   reportProgress: true,
 * }));
 *
 * readonly items = fromHttpResource(this.res);
 * // items.progress() tracks download progress 0-100
 * // <cngx-progress [state]="items"> - auto-wired progress bar
 * ```
 *
 * @category common/data/async-state
 */
export function fromHttpResource<T>(ref: HttpResourceLike<T>): CngxAsyncState<T> {
  // Map loaded/total bytes to a 0-100 integer, clamped; no total = indeterminate.
  const progress = computed(() => {
    const event = ref.progress();
    if (event?.total == null || event.total <= 0) {
      return undefined;
    }
    return Math.round(Math.min(event.loaded / event.total, 1) * 100);
  });

  return buildResourceBridge(ref, progress);
}
