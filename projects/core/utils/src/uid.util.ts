let counter = 0;

/**
 * Generates a unique ID string with the given prefix.
 *
 * Each call returns a monotonically increasing ID: `prefix-0`, `prefix-1`, etc.
 * Used internally for ARIA `id` attributes on dialogs, popovers, and tooltips.
 */
export function nextUid(prefix: string): string {
  return `${prefix}-${counter++}`;
}
