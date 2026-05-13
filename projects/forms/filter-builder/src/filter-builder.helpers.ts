import type {
  FilterExpression,
  FilterFieldDef,
  FilterGroup,
  FilterLogic,
  FilterNode,
} from './filter-builder.types';

/**
 * Pure helpers — zero Angular dependency, zero `inject()`. Importing this
 * module from a test or a non-Angular consumer (e.g. a backend predicate
 * translator) is safe.
 */

/**
 * @internal Shared frozen zero-state. The state factory and presenter both
 * import this back from here so a single canonical instance is reused —
 * keeps `filter-builder.helpers.ts` Angular-free (no transitive import of
 * `@angular/core` through `filter-builder-state.ts`).
 */
export const EMPTY_ROOT: FilterGroup = Object.freeze({
  type: 'group',
  logic: 'and',
  negated: false,
  filters: Object.freeze([]),
}) as FilterGroup;

export interface CreateFilterGroupOptions {
  readonly negated?: boolean;
}

export function createFilterGroup(
  logic: FilterLogic = 'and',
  filters: readonly FilterNode[] = [],
  opts: CreateFilterGroupOptions = {},
): FilterGroup {
  return {
    type: 'group',
    logic,
    negated: opts.negated ?? false,
    filters,
  };
}

export function createFilterExpression<TValue = unknown>(
  field: string,
  operator: string,
  value?: TValue,
): FilterExpression<TValue> {
  return {
    type: 'expression',
    field,
    operator,
    value,
  };
}

/**
 * Frozen empty root used as the presenter's `model<FilterGroup>` default and
 * by `CngxFilterBuilderState.clear()`. Always returns the same frozen
 * reference so consumers comparing tree identity short-circuit correctly.
 */
export function createEmptyFilterRoot(): FilterGroup {
  return EMPTY_ROOT;
}

/**
 * Build an item-level predicate from a `FilterGroup`. Returns `null` when
 * the tree itself is `null` — the consumer typically interprets `null` as
 * "no filtering, accept every item". For an empty root group, the returned
 * predicate evaluates `true` for every item (vacuous truth on `and`).
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

export function evaluateExpression<TItem>(
  expr: FilterExpression,
  item: TItem,
  fieldDef: FilterFieldDef | undefined,
): boolean {
  if (!fieldDef) {
    return false;
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

function evaluateGroup<TItem>(
  group: FilterGroup,
  item: TItem,
  fieldMap: ReadonlyMap<string, FilterFieldDef>,
): boolean {
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
  }

  return group.negated ? !combined : combined;
}

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
