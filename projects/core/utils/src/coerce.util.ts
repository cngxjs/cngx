/**
 * Coerces a value to a boolean.
 *
 * Strings are truthy unless they equal `'false'`.
 * All other falsy values return `false`.
 *
 * @category utils
 */
export function coerceBooleanProperty(value: unknown): boolean {
  if (value == null) {
    return false;
  }

  // Handle string values explicitly
  if (typeof value === 'string') {
    return value !== 'false';
  }

  // For non-string values, convert to boolean directly
  return Boolean(value);
}

/**
 * Coerces a value to a number.
 *
 * Returns `fallback` when the value is null, undefined, NaN, or non-numeric.
 *
 * @category utils
 */
export function coerceNumberProperty(value: unknown, fallback = 0): number {
  if (value == null) {
    return fallback;
  }

  if (typeof value === 'number') {
    return Number.isNaN(value) ? fallback : value;
  }

  // Convert to string only for string or number-like values
  const parsed =
    typeof value === 'string' || typeof value === 'boolean'
      ? Number.parseFloat(String(value))
      : Number.NaN;

  return Number.isNaN(parsed) ? fallback : parsed;
}
