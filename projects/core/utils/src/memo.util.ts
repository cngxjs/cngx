/**
 * Creates a memoized version of a single-argument pure function.
 * Each call to `memoize()` produces an independent cache.
 *
 * @example
 * const expensive = memoize((id: string) => computeHeavy(id));
 * expensive('a'); // computes
 * expensive('a'); // cached
 *
 * @category utils
 */
export function memoize<K, V>(fn: (key: K) => V): (key: K) => V {
  const cache = new Map<K, V>();
  return (key: K): V => {
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = fn(key);
    cache.set(key, result);
    return result;
  };
}
