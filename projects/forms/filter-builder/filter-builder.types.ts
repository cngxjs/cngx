/**
 * @cngx/forms/filter-builder - data model.
 *
 * Recursive discriminated-union tree describing a user-built filter
 * predicate. The root is always a `FilterGroup`; leaves are
 * `FilterExpression` nodes binding a field to an operator and a value.
 *
 * Three logic operators ship: `and`, `or`, `xor`. The orthogonal
 * `negated: boolean` modifier on every group is the **sole** negation
 * surface - `nand` and `nor` are intentionally NOT supported as logic
 * operators because they would create 4-way overlap with
 * `negated: true + 'and' / 'or'` (same denotation, different syntax) and
 * force every consumer to canonicalise. The `FilterLogic` union
 * deliberately excludes `'nand'` and `'nor'`; the types spec carries
 * `@ts-expect-error` guards to prevent silent re-introduction in a
 * future commit.
 *
 * `xor` semantic: exactly-one-true across the group's direct children
 * (n >= 2). For n < 2 the group always evaluates to `false`. `xor` is
 * NOT associative across nested groups - to express XOR over more than
 * the direct-child count, nest a sub-group of the desired arity.
 */

/**
 * Boolean combinator for a `FilterGroup`'s direct children. `nand`/`nor` are intentionally absent - use `negated` for inversion.
 *
 * @category forms/filter-builder/config
 */
export type FilterLogic = 'and' | 'or' | 'xor';

/**
 * Editor-type discriminator. Used as the key into `CNGX_FILTER_EDITORS`.
 * The library ships defaults for the four
 * builtin keys (`'string'`, `'number'`, `'date'`, `'boolean'`);
 * consumers add custom editor types freely.
 *
 * @category forms/filter-builder/config
 */
export type FilterEditorType = string;

/**
 * Consumer-supplied field descriptor - one entry per filterable column.
 *
 * @category forms/filter-builder/config
 */
export interface FilterFieldDef<TValue = unknown> {
  readonly key: string;
  readonly label: string;
  readonly editorType: FilterEditorType;
  readonly operators?: readonly string[];
  readonly defaultValue?: TValue;
}

/**
 * Leaf node - binds one field to one operator and one value.
 *
 * @category forms/filter-builder/config
 */
export interface FilterExpression<TValue = unknown> {
  readonly type: 'expression';
  /**
   * Stable identity used by Angular's `@for` track expression in the builder's
   * recursive renderer. Survives content edits (`setField`/`setOperator`/`setValue`)
   * so focused inputs do not lose focus when ancestor groups re-emit fresh
   * references through the path-update mutators. Factories
   * (`createFilterExpression`) auto-populate; consumer-constructed trees
   * normalise via `ensureFilterTreeIds`.
   */
  readonly id: string;
  readonly field: string;
  readonly operator: string;
  readonly value?: TValue;
}

/**
 * Branch node - combines child nodes under one `logic` operator with an optional `negated` flag.
 *
 * @category forms/filter-builder/config
 */
export interface FilterGroup {
  readonly type: 'group';
  /**
   * Stable identity used by Angular's `@for` track expression in the builder's
   * recursive renderer. See {@link FilterExpression.id} for the full contract.
   */
  readonly id: string;
  readonly logic: FilterLogic;
  readonly negated: boolean;
  readonly filters: readonly FilterNode[];
}

/**
 * Discriminated union - every node in the tree is either a group or an expression.
 *
 * @category forms/filter-builder/config
 */
export type FilterNode = FilterGroup | FilterExpression;

/**
 * Default operator lists per builtin editor type. Consumers extend via `withDefaultOperators({...})`.
 *
 * @category forms/filter-builder/config
 */
export const DEFAULT_OPERATORS = {
  string: ['contains', 'eq', 'neq', 'startsWith', 'endsWith', 'isEmpty', 'isNotEmpty'],
  number: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
  date: ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'isEmpty', 'isNotEmpty'],
  boolean: ['eq', 'neq'],
} as const satisfies Record<FilterEditorType, readonly string[]>;
