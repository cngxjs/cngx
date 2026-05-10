import type { CngxSelectCompareFn } from './select-core';

/**
 * Element-wise array equality under a caller comparator. Short-circuits on
 * reference equality and length mismatch.
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
