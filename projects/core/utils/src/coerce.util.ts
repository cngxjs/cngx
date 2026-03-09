/** Coerces a value to a boolean. */
export function coerceBooleanProperty(value: unknown): boolean {
  return value != null && `${value}` !== 'false';
}

/** Coerces a value to a number. */
export function coerceNumberProperty(value: unknown, fallback = 0): number {
  const parsed = parseFloat(`${value}`);
  return isNaN(parsed) ? fallback : parsed;
}

/** Coerces a value to an array. */
export function coerceArray<T>(value: T | T[]): T[] {
  return Array.isArray(value) ? value : [value];
}
