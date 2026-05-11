// Phase 2: size-cache.ts — Signal-based measured height cache

import { type Signal, signal } from '@angular/core';

/**
 * Signal-based cache mapping item index to measured height.
 *
 * The `version` signal increments on every `set()`, allowing any `computed()`
 * that reads `version()` to re-evaluate when measurements change.
 *
 * @internal Not exported from `@cngx/common/data` public API.
 */
export interface SizeCache {
  /** Get measured size for an index, or `undefined` if not yet measured. */
  get(index: number): number | undefined;
  /** Set measured size. Increments `version` to trigger recomputation. */
  set(index: number, size: number): void;
  /** Signal that increments on every `set()` — use as a dependency in `computed()`. */
  readonly version: Signal<number>;
  /** Get size for an index, falling back to `estimateSize` if not measured. */
  resolve(index: number, estimateSize: number | ((i: number) => number)): number;
  /** Number of measured entries. */
  readonly count: number;
  /** Clear all measurements. */
  clear(): void;
}

/**
 * Creates a signal-based size cache for measured item heights.
 *
 * @internal
 */
export function createSizeCache(): SizeCache {
  const cache = new Map<number, number>();
  const versionState = signal(0);

  return {
    get(index: number): number | undefined {
      return cache.get(index);
    },

    set(index: number, size: number): void {
      const current = cache.get(index);
      if (current === size) {
        return;
      }
      cache.set(index, size);
      versionState.update((v) => v + 1);
    },

    version: versionState.asReadonly(),

    resolve(index: number, estimateSize: number | ((i: number) => number)): number {
      const measured = cache.get(index);
      if (measured != null) {
        return measured;
      }
      return typeof estimateSize === 'number' ? estimateSize : estimateSize(index);
    },

    get count(): number {
      return cache.size;
    },

    clear(): void {
      if (cache.size === 0) {
        return;
      }
      cache.clear();
      versionState.update((v) => v + 1);
    },
  };
}
