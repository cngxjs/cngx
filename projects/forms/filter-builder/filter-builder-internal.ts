/**
 * @internal Shared module-local helpers for the filter-builder secondary
 * entry. Never re-exported from `public-api.ts`; consumers should not
 * import from here.
 */

import type { FilterExpression } from './filter-builder.types';

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

/**
 * Operators that query the item value itself - an expression using them is
 * complete without an expression value (`isEmpty` / `isNotEmpty`).
 */
const VALUELESS_OPERATORS: ReadonlySet<string> = new Set(['isEmpty', 'isNotEmpty']);

/**
 * The one canonical emptiness test for an expression's value:
 * `null` / `undefined` / `''` count as unfilled, except for the valueless
 * operator family. Shared by `evaluateExpression`'s no-op guard, the
 * presenter's `errorState` count, and the row's dashed-outline CSS state so
 * the three surfaces can never drift apart again.
 */
export function isExpressionValueEmpty(expression: FilterExpression): boolean {
  if (VALUELESS_OPERATORS.has(expression.operator)) {
    return false;
  }
  const value = expression.value;
  return value === null || value === undefined || value === '';
}

/**
 * An expression is incomplete while the user has not finished it: missing
 * field, missing operator, or an unfilled value (see
 * {@link isExpressionValueEmpty}).
 */
export function isExpressionIncomplete(expression: FilterExpression): boolean {
  return !expression.field || !expression.operator || isExpressionValueEmpty(expression);
}
