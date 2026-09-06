/**
 * Options for {@link memoize}.
 *
 * @category core/utils
 * @since 0.1.0
 */
export interface MemoizeOptions {
  /**
   * Maximum number of cached entries. When the cache is full, the oldest
   * inserted entry is evicted (FIFO) before the new one lands. Unset
   * means unbounded - only safe when the key space is provably finite
   * (locales, enum keys); derive-per-input call sites MUST set a limit.
   */
  readonly cacheLimit?: number;
}

/**
 * Creates a memoized version of a single-argument pure function.
 * Each call to `memoize()` produces an independent cache.
 *
 * const expensive = memoize((id: string) => computeHeavy(id));
 * expensive('a'); // computes
 * expensive('a'); // cached
 *
 * @category core/utils
 * @since 0.1.0
 */
export function memoize<K, V>(fn: (key: K) => V, options?: MemoizeOptions): (key: K) => V {
  const cache = new Map<K, V>();
  const limit = options?.cacheLimit;
  return (key: K): V => {
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(key);
    if (limit !== undefined && cache.size >= limit) {
      const oldest = cache.keys().next().value;
      if (oldest !== undefined) {
        cache.delete(oldest);
      }
    }
    cache.set(key, result);
    return result;
  };
}
