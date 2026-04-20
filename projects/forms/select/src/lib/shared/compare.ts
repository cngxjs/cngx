import type { CngxSelectCompareFn } from './select-core';

/**
 * Element-wise equality for two readonly arrays under a caller-supplied
 * comparator. Short-circuits on reference equality and on length mismatch;
 * otherwise walks both arrays once.
 *
 * Used by the select family's `Field ↔ component` sync and commit-flow
 * guards to suppress redundant writes when the new array holds the same
 * items as the current one under `compareWith`.
 *
 * @category interactive
 */
export function sameArrayContents<T>(
  a: readonly T[],
  b: readonly T[],
  eq: CngxSelectCompareFn<T>,
): boolean {
  if (a === b) {
    return true;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i++) {
    if (!eq(a[i], b[i])) {
      return false;
    }
  }
  return true;
}
