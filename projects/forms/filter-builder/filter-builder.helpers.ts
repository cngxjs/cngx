import { nextUid } from '@cngx/core/utils';

import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';
import { isExpressionValueEmpty } from './filter-builder-internal';
import {
  resolveOperatorDef,
  warnUnknownFilterOperatorOnce,
  type CngxFilterOperatorDef,
} from './filter-builder-operators';

/**
 * Pure helpers - zero Angular dependency, zero `inject()`. Importing this
 * module from a test or a non-Angular consumer (e.g. a backend predicate
 * translator) is safe.
 */

/**
 * @internal Shared frozen zero-state. The state factory and presenter both
 * import this back from here so a single canonical instance is reused -
 * keeps `filter-builder.helpers.ts` Angular-free (no transitive import of
 * `@angular/core` through `filter-builder-state.ts`).
 *
 * The root carries a fixed sentinel id so it is recognisable on inspection;
 * `ensureFilterTreeIds` short-circuits on it.
 */
export const EMPTY_ROOT: FilterGroup = Object.freeze({
  type: 'group',
  id: 'cngx-filter-root-empty',
  logic: 'and',
  negated: false,
  filters: Object.freeze([]),
}) as FilterGroup;

/**
 * Optional knobs for `createFilterGroup`.
 *
 * @category forms/filter-builder
 */
export interface CreateFilterGroupOptions {
  readonly negated?: boolean;
}

/**
 * Build a fresh `FilterGroup` with a generated id. Defaults to `and` logic, no children, not negated.
 *
 * @category forms/filter-builder
 */
export function createFilterGroup(
  logic: FilterLogic = 'and',
  filters: readonly FilterNode[] = [],
  opts: CreateFilterGroupOptions = {},
): FilterGroup {
  return {
    type: 'group',
    id: nextUid('cngx-filter-'),
    logic,
    negated: opts.negated ?? false,
    filters,
  };
}

/**
 * Build a fresh `FilterExpression` with a generated id.
 *
 * @category forms/filter-builder
 */
export function createFilterExpression<TValue = unknown>(
  field: string,
  operator: string,
  value?: TValue,
): FilterExpression<TValue> {
  return {
    type: 'expression',
    id: nextUid('cngx-filter-'),
    field,
    operator,
    value,
  };
}

/**
 * Normalises a tree by assigning a stable id to every node missing one.
 * Identity-preserving short-circuit - when every node already carries an id,
 * the same `tree` reference is returned. Consumers who hand-construct trees
 * (deserialised JSON, presets, persisted snapshots) run this once at the
 * boundary; the presenter already invokes it on initial read and on every
 * external write through `value`.
 */
export function ensureFilterTreeIds(tree: FilterGroup): FilterGroup {
  return normaliseGroupIds(tree);
}

/** @internal */
function normaliseGroupIds(group: FilterGroup): FilterGroup {
  const nextFilters: FilterNode[] = [];
  let childrenChanged = false;
  for (const child of group.filters) {
    const nextChild =
      child.type === 'group' ? normaliseGroupIds(child) : normaliseExpressionId(child);
    if (nextChild !== child) {
      childrenChanged = true;
    }
    nextFilters.push(nextChild);
  }
  if (group.id && !childrenChanged) {
    return group;
  }
  return {
    ...group,
    id: group.id || nextUid('cngx-filter-'),
    filters: childrenChanged ? nextFilters : group.filters,
  };
}

/** @internal */
function normaliseExpressionId(expression: FilterExpression): FilterExpression {
  if (expression.id) {
    return expression;
  }
  return { ...expression, id: nextUid('cngx-filter-') };
}

/**
 * Frozen empty root used as the presenter's `model<FilterGroup>` default and
 * by `CngxFilterBuilderState.clear()`. Always returns the same frozen
 * reference so consumers comparing tree identity short-circuit correctly.
 *
 * @category forms/filter-builder
 */
export function createEmptyFilterRoot(): FilterGroup {
  return EMPTY_ROOT;
}

/**
 * Optional evaluation knobs for `evaluateExpression` / `toFilterPredicate`.
 * Omitting the whole object (or any field) resolves to the pure builtin
 * defaults - the no-options path is bit-identical to the historical
 * closed-switch evaluation.
 *
 * @category forms/filter-builder
 */
export interface CngxFilterEvaluationOptions {
  /**
   * Operator registry to resolve keys against - typically
   * `CNGX_FILTER_BUILDER_CONFIG.operators` after `withOperators(...)`
   * merged consumer definitions over the builtins. Default:
   * `CNGX_FILTER_BUILTIN_OPERATOR_DEFS`.
   */
  readonly operators?: ReadonlyMap<string, CngxFilterOperatorDef>;
  /**
   * Fold both sides of the builtin substring trio (`contains` /
   * `startsWith` / `endsWith`) via `toLowerCase()` before comparing.
   * Default `false` (case-sensitive). `eq` / `neq` keep `Object.is`
   * identity semantics regardless.
   */
  readonly caseInsensitive?: boolean;
}

/**
 * Build an item-level predicate from a `FilterGroup`. Returns `null` when
 * the tree itself is `null` - the consumer typically interprets `null` as
 * "no filtering, accept every item". For an empty root group, the returned
 * predicate evaluates `true` for every item (vacuous truth on `and`).
 *
 * Evaluation contract per expression - see {@link evaluateExpression}:
 * unknown field keys evaluate `false`, unfilled values short-circuit
 * `true`, unknown operators warn once in dev mode and evaluate `false`.
 * Pass `options` to evaluate against a consumer-extended operator
 * registry or with case-insensitive substring matching.
 *
 * @category forms/filter-builder
 */
export function toFilterPredicate<TItem>(
  tree: FilterGroup | null,
  fields: readonly FilterFieldDef[],
  options?: CngxFilterEvaluationOptions,
): ((item: TItem) => boolean) | null {
  if (!tree) {
    return null;
  }
  const fieldMap = new Map<string, FilterFieldDef>();
  for (const def of fields) {
    fieldMap.set(def.key, def);
  }
  return (item: TItem) => evaluateGroup(tree, item, fieldMap, options);
}

/**
 * Evaluate a single `FilterExpression` against `item`.
 *
 * The contract, in resolution order:
 *
 * 1. **Unknown field** (`fieldDef` is `undefined`) - `false`. The
 *    expression references a field the consumer never declared.
 * 2. **Unfilled value** - `true`. The user picked a field and an operator
 *    but supplied no value (`null` / `undefined` / `''`), so the row is a
 *    no-op that must not exclude every item. Operators whose definition is
 *    `valueless` (builtin `isEmpty` / `isNotEmpty`) are exempt and
 *    evaluate normally; the registry passed via `options.operators`
 *    extends this exemption to consumer-registered valueless operators.
 * 3. **Unknown operator** - one `console.warn` per key in dev mode, then
 *    `false` for every item. An operator that reaches evaluation without
 *    a registered definition is a wiring bug, and a loud conservative
 *    `false` beats a silent one.
 * 4. Otherwise the resolved {@link CngxFilterOperatorDef.evaluate} runs
 *    with the item value, the expression value, and the evaluation
 *    context.
 *
 * Semantics of the builtin definitions:
 *
 * - `eq` / `neq` compare with `Object.is` identity - no coercion, no
 *   case folding.
 * - `contains` / `startsWith` / `endsWith` require both sides to be
 *   strings (anything else is `false`) and are case-SENSITIVE unless
 *   `options.caseInsensitive` is `true`, which lowercases both sides.
 * - `gt` / `gte` / `lt` / `lte` order numbers, `Date` instances, and
 *   strings (lexicographic). Nullish operands and mixed/unsupported type
 *   pairs compare as `NaN`, so every ordering test on them is `false`.
 *
 * @category forms/filter-builder
 */
export function evaluateExpression<TItem>(
  expr: FilterExpression,
  item: TItem,
  fieldDef: FilterFieldDef | undefined,
  options?: CngxFilterEvaluationOptions,
): boolean {
  if (!fieldDef) {
    return false;
  }
  // Expressions that have not been filled in yet are treated as no-ops: the
  // user picked a field and an operator but did not type a value, so the row
  // must not exclude every item. The shared definition covers null /
  // undefined / '' and exempts the valueless operator family - same test
  // that drives errorState and the row's incomplete CSS state.
  if (isExpressionValueEmpty(expr, options?.operators)) {
    return true;
  }
  const def = resolveOperatorDef(expr.operator, options?.operators);
  if (!def) {
    warnUnknownFilterOperatorOnce(expr.operator);
    return false;
  }
  const record = item as Record<string, unknown>;
  const itemValue: unknown = record[fieldDef.key];
  return def.evaluate(itemValue, expr.value, {
    caseInsensitive: options?.caseInsensitive ?? false,
  });
}

/** @internal */
function evaluateGroup<TItem>(
  group: FilterGroup,
  item: TItem,
  fieldMap: ReadonlyMap<string, FilterFieldDef>,
  options?: CngxFilterEvaluationOptions,
): boolean {
  // Empty group = no constraint. Pure boolean logic would return
  // `OR(∅) = false`, `XOR(∅) = false`, `AND(∅) = true` - but in a
  // filter-UX context an empty group means "the user defined no filter
  // here", which should accept every item regardless of the dormant
  // `logic` flag. Bypasses the switch so the group's `negated` flag also
  // collapses to neutral (otherwise `negated + OR(∅)` would invert
  // false→true and surface a "reject everything" filter the user never
  // expressed).
  if (group.filters.length === 0) {
    return true;
  }

  const results: boolean[] = [];
  for (const child of group.filters) {
    if (child.type === 'group') {
      results.push(evaluateGroup(child, item, fieldMap, options));
    } else {
      results.push(evaluateExpression(child, item, fieldMap.get(child.field), options));
    }
  }

  let combined: boolean;
  switch (group.logic) {
    case 'and':
      combined = results.every((r) => r);
      break;
    case 'or':
      combined = results.some((r) => r);
      break;
    case 'xor':
      combined = results.length >= 2 && results.filter((r) => r).length === 1;
      break;
    default: {
      const _exhaustive: never = group.logic;
      throw new Error(`Unhandled FilterLogic variant: ${_exhaustive as string}`);
    }
  }

  return group.negated ? !combined : combined;
}
