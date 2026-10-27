/**
 * Coerce a single value or an array to an array. Returns the input
 * unchanged when already an array; wraps a scalar value in a
 * single-element array otherwise.
 */
export function coerceArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
