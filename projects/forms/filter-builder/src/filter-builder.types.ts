/**
 * @cngx/forms/filter-builder — data model.
 *
 * Recursive discriminated-union tree describing a user-built filter
 * predicate. The root is always a `FilterGroup`; leaves are
 * `FilterExpression` nodes binding a field to an operator and a value.
 *
 * Three logic operators ship: `and`, `or`, `xor`. The orthogonal
 * `negated: boolean` modifier on every group is the **sole** negation
 * surface — `nand` and `nor` are intentionally NOT supported as logic
 * operators because they would create 4-way overlap with
 * `negated: true + 'and' / 'or'` (same denotation, different syntax) and
 * force every consumer to canonicalise. The `FilterLogic` union
 * deliberately excludes `'nand'` and `'nor'`; the types spec carries
 * `@ts-expect-error` guards to prevent silent re-introduction in a
 * future commit.
 *
 * `xor` semantic: exactly-one-true across the group's direct children
 * (n >= 2). For n < 2 the group always evaluates to `false`. `xor` is
 * NOT associative across nested groups — to express XOR over more than
 * the direct-child count, nest a sub-group of the desired arity.
 */

export type FilterLogic = 'and' | 'or' | 'xor';

/**
 * Editor-type discriminator. Used as the key into `CNGX_FILTER_EDITORS`
 * (introduced in Phase 3). The library ships defaults for the four
 * builtin keys (`'string'`, `'number'`, `'date'`, `'boolean'`);
 * consumers add custom editor types freely.
 */
export type FilterEditorType = string;

export interface FilterFieldDef<TValue = unknown> {
  readonly key: string;
  readonly label: string;
  readonly editorType: FilterEditorType;
  readonly operators?: readonly string[];
  readonly defaultValue?: TValue;
}

export interface FilterExpression<TValue = unknown> {
  readonly type: 'expression';
  readonly field: string;
  readonly operator: string;
  readonly value?: TValue;
}

export interface FilterGroup {
  readonly type: 'group';
  readonly logic: FilterLogic;
  readonly negated: boolean;
  readonly filters: readonly FilterNode[];
}

export type FilterNode = FilterGroup | FilterExpression;

export const DEFAULT_OPERATORS: Readonly<Record<FilterEditorType, readonly string[]>> = {
  string: ['contains', 'eq', 'neq', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
  date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
  boolean: ['eq', 'neq'],
};
