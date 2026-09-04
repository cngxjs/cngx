/**
 * Coerces a value to a boolean.
 *
 * Strings are truthy unless they equal `'false'`.
 * All other falsy values return `false`.
 *
 * @category core/utils
 * @since 0.1.0
 */
export function coerceBooleanProperty(value: unknown): boolean {
  if (value == null) {
    return false;
  }

  if (typeof value === 'string') {
    return value !== 'false';
  }

  return Boolean(value);
}

/**
 * Coerces a value to a number.
 *
 * Returns `fallback` when the value is null, undefined, NaN, or non-numeric.
 *
 * Strings parse leniently via `Number.parseFloat`: a leading numeric prefix
 * wins even when a unit trails it (`'12px'` coerces to `12`, `'1.5rem'` to
 * `1.5`). A string with no leading number (`'px12'`, `'true'`) returns
 * `fallback`. Booleans and objects are never numeric and return `fallback`.
 *
 * @category core/utils
 * @since 0.1.0
 */
export function coerceNumberProperty(value: unknown, fallback = 0): number {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? fallback : value;
  }

  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number.NaN;

  return Number.isNaN(parsed) ? fallback : parsed;
}
