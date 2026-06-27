/**
 * @internal Shared module-local helpers for the filter-builder secondary
 * entry. Never re-exported from `public-api.ts`; consumers should not
 * import from here.
 */

/**
 * Reference-identity equality predicate. Used as the `equal` fn on object
 * and array `computed` signals whose producers already preserve identity
 * across re-evaluations - see `getNodeAtPath` / `appendAtPath` /
 * `updateAtPath` / `removeAtPath` in `filter-builder.utils.ts`, which
 * return the same reference when no descendant changed.
 *
 * Explicit `equal` fn on every object/array computed prevents downstream
 * cascades.
 */
export const referenceEqual = <T>(a: T, b: T): boolean => a === b;
