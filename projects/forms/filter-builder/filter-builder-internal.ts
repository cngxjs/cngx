/**
 * @internal Shared module-local helpers for the filter-builder secondary
 * entry. Never re-exported from `public-api.ts`; consumers should not
 * import from here.
 */

import type { FilterExpression } from './filter-builder.types';
import { resolveOperatorDef, type CngxFilterOperatorDef } from './filter-builder-operators';

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
 * The one canonical emptiness test for an expression's value:
 * `null` / `undefined` / `''` count as unfilled, except for operators
 * whose resolved definition is `valueless` (builtin `isEmpty` /
 * `isNotEmpty`; consumer-registered valueless operators when the config's
 * registry is passed). Shared by `evaluateExpression`'s no-op guard, the
 * presenter's `errorState` count, and the row's dashed-outline CSS state
 * so the three surfaces can never drift apart again.
 */
export function isExpressionValueEmpty(
  expression: FilterExpression,
  operators?: ReadonlyMap<string, CngxFilterOperatorDef>,
): boolean {
  if (resolveOperatorDef(expression.operator, operators)?.valueless) {
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
export function isExpressionIncomplete(
  expression: FilterExpression,
  operators?: ReadonlyMap<string, CngxFilterOperatorDef>,
): boolean {
  return (
    !expression.field || !expression.operator || isExpressionValueEmpty(expression, operators)
  );
}
