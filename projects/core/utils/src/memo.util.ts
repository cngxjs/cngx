/**
 * Simple memoization decorator for pure methods with a single argument.
 * Uses a Map for cache storage.
 */
export function Memo(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value as (...args: unknown[]) => unknown;
    const cache = new Map<unknown, unknown>();

    descriptor.value = function (...args: unknown[]) {
      const key = args[0];
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = original.apply(this, args);
      cache.set(key, result);
      return result;
    };

    return descriptor;
  };
}
