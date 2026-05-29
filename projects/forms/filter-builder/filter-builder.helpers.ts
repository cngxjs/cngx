import { nextUid } from '@cngx/core/utils';

import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';

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
 * Build an item-level predicate from a `FilterGroup`. Returns `null` when
 * the tree itself is `null` - the consumer typically interprets `null` as
 * "no filtering, accept every item". For an empty root group, the returned
 * predicate evaluates `true` for every item (vacuous truth on `and`).
 *
 * @category forms/filter-builder
 */
export function toFilterPredicate<TItem>(
  tree: FilterGroup | null,
  fields: readonly FilterFieldDef[],
): ((item: TItem) => boolean) | null {
  if (!tree) {
    return null;
  }
  const fieldMap = new Map<string, FilterFieldDef>();
  for (const def of fields) {
    fieldMap.set(def.key, def);
  }
  return (item: TItem) => evaluateGroup(tree, item, fieldMap);
}

/**
 * Evaluate a single `FilterExpression` against `item`. Unfilled expressions short-circuit to `true` (except `isEmpty`/`isNotEmpty`).
 *
 * @category forms/filter-builder
 */
export function evaluateExpression<TItem>(
  expr: FilterExpression,
  item: TItem,
  fieldDef: FilterFieldDef | undefined,
): boolean {
  if (!fieldDef) {
    return false;
  }
  // Expressions that have not been filled in yet (value === undefined) are
  // treated as no-ops: the user picked a field and an operator but did not
  // type a value yet, so the row should not exclude every item. The
  // `isEmpty` / `isNotEmpty` family is exempt - they target the item value,
  // not the expression target, so undefined is still a valid query.
  if (expr.value === undefined && expr.operator !== 'isEmpty' && expr.operator !== 'isNotEmpty') {
    return true;
  }
  const record = item as Record<string, unknown>;
  const itemValue: unknown = record[fieldDef.key];
  const targetValue: unknown = expr.value;

  switch (expr.operator) {
    case 'eq':
      return Object.is(itemValue, targetValue);
    case 'neq':
      return !Object.is(itemValue, targetValue);
    case 'isEmpty':
      return itemValue == null || itemValue === '';
    case 'isNotEmpty':
      return itemValue != null && itemValue !== '';
    case 'contains':
      return (
        typeof itemValue === 'string' &&
        typeof targetValue === 'string' &&
        itemValue.includes(targetValue)
      );
    case 'startsWith':
      return (
        typeof itemValue === 'string' &&
        typeof targetValue === 'string' &&
        itemValue.startsWith(targetValue)
      );
    case 'endsWith':
      return (
        typeof itemValue === 'string' &&
        typeof targetValue === 'string' &&
        itemValue.endsWith(targetValue)
      );
    case 'gt':
      return compare(itemValue, targetValue) > 0;
    case 'gte':
      return compare(itemValue, targetValue) >= 0;
    case 'lt':
      return compare(itemValue, targetValue) < 0;
    case 'lte':
      return compare(itemValue, targetValue) <= 0;
    default:
      return false;
  }
}

/** @internal */
function evaluateGroup<TItem>(
  group: FilterGroup,
  item: TItem,
  fieldMap: ReadonlyMap<string, FilterFieldDef>,
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
      results.push(evaluateGroup(child, item, fieldMap));
    } else {
      results.push(evaluateExpression(child, item, fieldMap.get(child.field)));
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

/** @internal */
function compare(a: unknown, b: unknown): number {
  if (a == null || b == null) {
    return Number.NaN;
  }
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  if (a instanceof Date && b instanceof Date) {
    return a.getTime() - b.getTime();
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return a < b ? -1 : a > b ? 1 : 0;
  }
  return Number.NaN;
}
