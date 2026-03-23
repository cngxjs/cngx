/** Coerces a value to a boolean. */
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

/** Coerces a value to a number. */
export function coerceNumberProperty(value: unknown, fallback = 0): number {
  // Handle null/undefined
  if (value == null) {
    return fallback;
  }

  // If already a number, return it
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
