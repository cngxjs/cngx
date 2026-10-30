// The default "did the query answer" rule, a leaf module so the command shape and
// the query helpers both use it without importing each other.

/** A payload counts as found unless it is `null`, `undefined` or an empty array. */
export function defaultFound(payload: unknown): boolean {
  if (payload === null || payload === undefined) {
    return false;
  }
  return !(Array.isArray(payload) && payload.length === 0);
}
